import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { getUserSubscription } from "@/lib/subscriptions";
import { siteUrl } from "@/lib/seo";

export async function POST() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured on this environment." },
        { status: 503 }
      );
    }

    const sub = await getUserSubscription(session.user.id);
    if (!sub || !sub.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active Stripe customer found for this account." },
        { status: 404 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${siteUrl}/account`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Customer Portal Error:", err);
    return NextResponse.json(
      { error: "Failed to create Stripe billing portal session." },
      { status: 500 }
    );
  }
}
