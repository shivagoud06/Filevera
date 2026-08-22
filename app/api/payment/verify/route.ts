import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  isRazorpayConfigured,
  RAZORPAY_PRICING,
  verifyOrderSignature,
  verifySubscriptionSignature,
} from "@/lib/razorpay";
import {
  activateSubscription,
  isUserIntroEligible,
  recordPayment,
} from "@/lib/subscriptions";
import { PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const reqHeaders = await nextHeaders();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_signature,
      plan = "pro",
    } = body as {
      razorpay_payment_id?: string;
      razorpay_order_id?: string;
      razorpay_subscription_id?: string;
      razorpay_signature?: string;
      plan?: PlanId;
    };

    if (!razorpay_payment_id) {
      return NextResponse.json(
        { error: "Missing payment confirmation details." },
        { status: 400 }
      );
    }

    if (plan !== "pro" && plan !== "pro_plus") {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 400 }
      );
    }

    // Server-side cryptographic signature verification
    if (isRazorpayConfigured && razorpay_signature) {
      let isValid = false;

      if (razorpay_order_id) {
        isValid = verifyOrderSignature(
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        );
      } else if (razorpay_subscription_id) {
        isValid = verifySubscriptionSignature(
          razorpay_payment_id,
          razorpay_subscription_id,
          razorpay_signature
        );
      }

      if (!isValid) {
        return NextResponse.json(
          { error: "Payment verification failed. Invalid transaction signature." },
          { status: 400 }
        );
      }
    }

    // Determine intro offer eligibility strictly on server
    const isIntro = await isUserIntroEligible(session.user.id, plan);
    const config = RAZORPAY_PRICING[plan];
    const amount = isIntro ? config.introAmountPaise : config.regularAmountPaise;
    const billingInterval = plan === "pro_plus" ? "year" : "month";

    // 1. Record payment in database
    await recordPayment({
      userId: session.user.id,
      provider: "razorpay",
      providerPaymentId: razorpay_payment_id,
      subscriptionId: razorpay_subscription_id || razorpay_order_id || null,
      amount,
      currency: "INR",
      status: "captured",
    });

    // 2. Activate subscription and provision real credits
    await activateSubscription({
      userId: session.user.id,
      provider: "razorpay",
      providerSubscriptionId: razorpay_subscription_id || razorpay_order_id || null,
      providerPaymentId: razorpay_payment_id,
      plan,
      billingInterval,
      introOfferUsed: isIntro,
    });

    return NextResponse.json({
      success: true,
      message: `Payment successful! Welcome to ${config.planName}.`,
      plan,
      planName: config.planName,
      credits: plan === "pro_plus" ? 5000 : 1000,
    });
  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { error: "An error occurred while verifying the payment." },
      { status: 500 }
    );
  }
}
