import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { PlanId } from "@/lib/plans";
import {
  activateSubscriptionFromCheckout,
  isStripeEventProcessed,
  recordStripeEvent,
  renewSubscriptionCredits,
  syncSubscriptionStatus,
} from "@/lib/subscriptions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !stripe) {
    console.error("Stripe Webhook Error: Missing STRIPE_WEBHOOK_SECRET or Stripe client.");
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured." },
      { status: 500 }
    );
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    console.error("Stripe Signature Verification Failed:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  // Idempotency check: Don't re-process already handled event
  const alreadyProcessed = await isStripeEventProcessed(event.id);
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const plan = (session.metadata?.plan as PlanId) || "pro";
        const isIntro = session.metadata?.isIntro === "true";

        if (userId && (plan === "pro" || plan === "pro_plus")) {
          let currentPeriodStart = Date.now();
          let currentPeriodEnd = Date.now() + (plan === "pro_plus" ? 365 : 30) * 24 * 60 * 60 * 1000;
          let billingInterval = plan === "pro_plus" ? "year" : "month";
          let stripeSubscriptionId: string | null = null;
          let stripePriceId: string | null = null;

          if (session.subscription) {
            stripeSubscriptionId =
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id;

            try {
              const subObj = await stripe.subscriptions.retrieve(stripeSubscriptionId);
              // Stripe v18+ uses current_period_start and current_period_end on subscription items or root
              const rawSub = subObj as unknown as Record<string, unknown>;
              const periodStart = typeof rawSub.current_period_start === "number" ? rawSub.current_period_start : null;
              const periodEnd = typeof rawSub.current_period_end === "number" ? rawSub.current_period_end : null;

              if (periodStart) currentPeriodStart = periodStart * 1000;
              if (periodEnd) currentPeriodEnd = periodEnd * 1000;

              const firstItem = subObj.items?.data?.[0];
              if (firstItem?.price) {
                stripePriceId = firstItem.price.id;
                if (firstItem.price.recurring?.interval) {
                  billingInterval = firstItem.price.recurring.interval;
                }
              }
            } catch (retrieveErr) {
              console.warn("Could not retrieve subscription details from Stripe:", retrieveErr);
            }
          }

          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id || null;

          await activateSubscriptionFromCheckout({
            userId,
            plan,
            stripeCustomerId: customerId,
            stripeSubscriptionId,
            stripePriceId,
            billingInterval,
            introOfferUsed: isIntro,
            currentPeriodStart,
            currentPeriodEnd,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const rawSub = sub as unknown as Record<string, unknown>;
        const periodStart = typeof rawSub.current_period_start === "number" ? rawSub.current_period_start : null;
        const periodEnd = typeof rawSub.current_period_end === "number" ? rawSub.current_period_end : null;

        await syncSubscriptionStatus({
          stripeSubscriptionId: sub.id,
          status: sub.status,
          currentPeriodStart: periodStart ? periodStart * 1000 : undefined,
          currentPeriodEnd: periodEnd ? periodEnd * 1000 : undefined,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscriptionStatus({
          stripeSubscriptionId: sub.id,
          status: "canceled",
          cancelAtPeriodEnd: false,
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const rawInv = invoice as unknown as Record<string, unknown>;
        const rawSub = rawInv.subscription;
        const subId = typeof rawSub === "string" ? rawSub : (rawSub as { id?: string })?.id;

        if (subId && invoice.billing_reason === "subscription_cycle") {
          const lines = invoice.lines?.data?.[0];
          const periodEnd = lines?.period?.end;
          const targetEnd = periodEnd ? periodEnd * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000;
          await renewSubscriptionCredits({
            stripeSubscriptionId: subId,
            currentPeriodEnd: targetEnd,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const rawInv = invoice as unknown as Record<string, unknown>;
        const rawSub = rawInv.subscription;
        const subId = typeof rawSub === "string" ? rawSub : (rawSub as { id?: string })?.id;

        if (subId) {
          await syncSubscriptionStatus({
            stripeSubscriptionId: subId,
            status: "past_due",
          });
        }
        break;
      }

      default:
        // Ignore unhandled event types cleanly
        break;
    }

    // Record event as processed in PostgreSQL
    await recordStripeEvent(event.id, event.type);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Error processing Stripe webhook event ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook event handler encountered an error." },
      { status: 500 }
    );
  }
}
