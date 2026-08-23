import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  isRazorpayConfigured,
  RAZORPAY_PRICING,
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
        { error: "Authentication required. Please log in to continue." },
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

    if (!isRazorpayConfigured || !razorpay) {
      return NextResponse.json(
        {
          error:
            "Razorpay payment gateway is not configured. Please check server credentials.",
        },
        { status: 503 }
      );
    }

    const config = RAZORPAY_PRICING[plan];
    const isIntroEligible = await isUserIntroEligible(session.user.id, plan);
    const amountPaise = isIntroEligible
      ? config.introAmountPaise
      : config.regularAmountPaise;

    // Close QR in 20 minutes (epoch timestamp in seconds)
    const closeBy = Math.floor(Date.now() / 1000) + 20 * 60;

    try {
      const qr = await razorpay.qrCode.create({
        type: "upi_qr",
        name: `Filevera ${config.planName}`,
        usage: "single_use",
        fixed_amount: true,
        payment_amount: amountPaise,
        description: `${config.planName} (${isIntroEligible ? "Intro Offer" : "Standard"})`,
        close_by: closeBy,
        notes: {
          userId: session.user.id,
          userEmail: session.user.email,
          plan,
          isIntroEligible: String(isIntroEligible),
        },
      });

      return NextResponse.json({
        qrId: qr.id,
        imageUrl: qr.image_url,
        amount: amountPaise,
        currency: "INR",
        plan,
        planName: config.planName,
        isIntroEligible,
        closeBy: qr.close_by || closeBy,
      });
    } catch (err: unknown) {
      console.error("Razorpay QR creation error:", err);
      const errorObj =
        err && typeof err === "object" && "error" in err
          ? (err as { error?: { description?: string; message?: string } }).error
          : undefined;
      const description =
        errorObj?.description ||
        errorObj?.message ||
        (err instanceof Error ? err.message : "UPI QR creation failed");

      return NextResponse.json(
        {
          error: `Razorpay UPI QR Error: ${description}. Please use standard Razorpay checkout or verify UPI enablement in the Razorpay Dashboard.`,
          isFeatureDisabled: true,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("create-qr unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to initialize UPI QR payment." },
      { status: 500 }
    );
  }
}
