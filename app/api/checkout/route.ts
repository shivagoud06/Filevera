import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe, getStripePriceId, isStripeConfigured } from "@/lib/stripe";
import { getOrCreateStripeCustomer, isUserIntroEligible } from "@/lib/subscriptions";
import { siteUrl } from "@/lib/seo";

export async function POST(request: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to select a plan." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan } = body;

    if (plan !== "pro" && plan !== "pro_plus") {
      return NextResponse.json(
        { error: "Invalid plan selected. Please choose Pro or Pro Plus." },
        { status: 400 }
      );
    }

    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        {
          error:
            "Stripe credentials are not yet configured on this deployment. Please set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and Stripe Price IDs in your environment.",
          code: "STRIPE_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.name || undefined;

    // Server-side check for introductory offer eligibility
    const isEligibleForIntro = await isUserIntroEligible(userId, plan);
    const { priceId, isIntro } = getStripePriceId(plan, isEligibleForIntro);

    if (!priceId) {
      return NextResponse.json(
        {
          error: `Stripe Price ID for ${plan.toUpperCase()} (${
            isIntro ? "Introductory" : "Regular"
          }) is not configured in environment variables.`,
          code: "PRICE_ID_MISSING",
        },
        { status: 500 }
      );
    }

    // Get or create customer in Stripe
    const customerId = await getOrCreateStripeCustomer(userId, userEmail, userName);
    if (!customerId) {
      return NextResponse.json(
        { error: "Unable to provision customer record in Stripe. Please try again." },
        { status: 500 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
        isIntro: isIntro ? "true" : "false",
      },
      subscription_data: {
        metadata: {
          userId,
          plan,
          isIntro: isIntro ? "true" : "false",
        },
      },
      success_url: `${siteUrl}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing?canceled=true`,
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while initializing checkout.",
      },
      { status: 500 }
    );
  }
}
