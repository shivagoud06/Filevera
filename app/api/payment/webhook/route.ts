import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { isRazorpayConfigured, verifyWebhookSignature } from "@/lib/razorpay";
import {
  activateSubscription,
  processRazorpayWebhookEvent,
  recordPayment,
} from "@/lib/subscriptions";
import { dbQuery } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const reqHeaders = await nextHeaders();
    const signature = reqHeaders.get("x-razorpay-signature") || "";

    if (isRazorpayConfigured) {
      if (!signature || !verifyWebhookSignature(rawBody, signature)) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event;
    const eventId = payload.id || `event_${Date.now()}`;

    // Idempotency check
    const isFirstTime = await processRazorpayWebhookEvent(eventId, eventType);
    if (!isFirstTime) {
      return NextResponse.json({ message: "Event already processed" }, { status: 200 });
    }

    const paymentEntity = payload.payload?.payment?.entity;
    const subscriptionEntity = payload.payload?.subscription?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const notes = paymentEntity?.notes || subscriptionEntity?.notes || orderEntity?.notes || {};
    const userId = notes.userId;
    const plan = (notes.plan === "pro_plus" ? "pro_plus" : "pro") as "pro" | "pro_plus";
    const isIntro = notes.isIntroEligible === "true";

    switch (eventType) {
      case "payment.captured":
      case "order.paid": {
        if (userId) {
          const paymentId = paymentEntity?.id || orderEntity?.id || eventId;
          const amount = paymentEntity?.amount || orderEntity?.amount || 0;

          await recordPayment({
            userId,
            provider: "razorpay",
            providerPaymentId: paymentId,
            subscriptionId: subscriptionEntity?.id || null,
            amount,
            currency: paymentEntity?.currency || "INR",
            status: "captured",
          });

          await activateSubscription({
            userId,
            provider: "razorpay",
            providerSubscriptionId: subscriptionEntity?.id || null,
            providerPaymentId: paymentId,
            plan,
            billingInterval: plan === "pro_plus" ? "year" : "month",
            introOfferUsed: isIntro,
          });
        }
        break;
      }

      case "subscription.activated":
      case "subscription.charged": {
        if (userId) {
          const subId = subscriptionEntity?.id;
          const periodEnd = subscriptionEntity?.current_end
            ? subscriptionEntity.current_end * 1000
            : undefined;

          await activateSubscription({
            userId,
            provider: "razorpay",
            providerSubscriptionId: subId,
            providerPaymentId: paymentEntity?.id || null,
            plan,
            billingInterval: plan === "pro_plus" ? "year" : "month",
            introOfferUsed: isIntro,
            currentPeriodEnd: periodEnd,
          });
        }
        break;
      }

      case "subscription.cancelled": {
        if (subscriptionEntity?.id) {
          const now = Date.now();
          await dbQuery(
            `UPDATE subscription 
             SET "subscriptionStatus" = 'canceled', "updatedAt" = $1 
             WHERE "providerSubscriptionId" = $2`,
            [now, subscriptionEntity.id]
          );
        }
        break;
      }

      case "payment.failed": {
        if (userId && paymentEntity?.id) {
          await recordPayment({
            userId,
            provider: "razorpay",
            providerPaymentId: paymentEntity.id,
            subscriptionId: subscriptionEntity?.id || null,
            amount: paymentEntity.amount || 0,
            currency: paymentEntity.currency || "INR",
            status: "failed",
          });
        }
        break;
      }

      default:
        // Other events safely acknowledged
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
