import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  isRazorpayConfigured,
  RAZORPAY_KEY_ID,
  RAZORPAY_PRICING,
  getRazorpayPlanId,
  razorpay,
} from "@/lib/razorpay";
import { isUserIntroEligible } from "@/lib/subscriptions";
import { PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const reqHeaders = await nextHeaders();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to subscribe." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const plan = (body.plan as PlanId) || "pro";

    if (plan !== "pro" && plan !== "pro_plus") {
      return NextResponse.json(
        { error: "Invalid plan selected. Choose Pro or Pro Plus." },
        { status: 400 }
      );
    }

    const config = RAZORPAY_PRICING[plan];
    const isIntroEligible = await isUserIntroEligible(session.user.id, plan);
    const amountPaise = isIntroEligible ? config.introAmountPaise : config.regularAmountPaise;

    let orderId: string | null = null;
    let subscriptionId: string | null = null;

    if (razorpay) {
      const razorpayPlanId = getRazorpayPlanId(plan, isIntroEligible);

      if (razorpayPlanId) {
        try {
          const sub = await razorpay.subscriptions.create({
            plan_id: razorpayPlanId,
            total_count: plan === "pro_plus" ? 5 : 12,
            quantity: 1,
            customer_notify: 1,
            notes: {
              userId: session.user.id,
              userEmail: session.user.email,
              plan,
              isIntroEligible: String(isIntroEligible),
            },
          });
          subscriptionId = sub.id;
        } catch (subErr) {
          console.warn("Razorpay subscription creation failed, falling back to order creation:", subErr);
        }
      }

      // If no subscriptionId created or planId was not specified, create an Order
      if (!subscriptionId) {
        try {
          const order = await razorpay.orders.create({
            amount: amountPaise,
            currency: "INR",
            receipt: `rcpt_${session.user.id.slice(0, 8)}_${Date.now().toString().slice(-6)}`,
            notes: {
              userId: session.user.id,
              userEmail: session.user.email,
              plan,
              isIntroEligible: String(isIntroEligible),
            },
          });
          orderId = order.id;
        } catch (err) {
          console.error("Razorpay order creation error:", err);
          return NextResponse.json(
            { error: "Unable to create Razorpay payment order. Please check merchant credentials." },
            { status: 500 }
          );
        }
      }
    } else {
      // In development / missing keys fallback mock ID for testing
      orderId = `order_test_${Date.now()}`;
    }

    return NextResponse.json({
      keyId: RAZORPAY_KEY_ID || "rzp_test_placeholder",
      orderId,
      subscriptionId,
      amount: amountPaise,
      currency: "INR",
      plan,
      planName: config.planName,
      isIntroEligible,
      isTestMode: !isRazorpayConfigured,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    });
  } catch (error) {
    console.error("create-subscription failed:", error);
    return NextResponse.json(
      { error: "Failed to initialize subscription checkout." },
      { status: 500 }
    );
  }
}
