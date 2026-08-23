import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isRazorpayConfigured, razorpay } from "@/lib/razorpay";
import {
  activateSubscription,
  recordPayment,
} from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const reqHeaders = await nextHeaders();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const qrId = searchParams.get("qrId");

    if (!qrId) {
      return NextResponse.json(
        { error: "Missing qrId parameter." },
        { status: 400 }
      );
    }

    if (!isRazorpayConfigured || !razorpay) {
      return NextResponse.json(
        { error: "Razorpay is not configured." },
        { status: 503 }
      );
    }

    // 1. Fetch QR code status directly from Razorpay API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qr: any = await razorpay.qrCode.fetch(qrId);

    const paymentAmount = Number(qr.payment_amount || 0);
    const paymentsAmountReceived = Number(qr.payments_amount_received || 0);
    const isPaid =
      paymentsAmountReceived >= paymentAmount && paymentAmount > 0;

    if (isPaid || qr.status === "closed") {
      const notes = qr.notes || {};
      const plan: "pro" | "pro_plus" = notes.plan === "pro_plus" ? "pro_plus" : "pro";
      const isIntro = notes.isIntroEligible === "true";

      // 2. Fetch associated payments from Razorpay to get the concrete payment ID
      let providerPaymentId = `pay_qr_${qrId.slice(-8)}_${Date.now()}`;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paymentsList: any = await razorpay.qrCode.fetchAllPayments(qrId);
        if (paymentsList?.items && paymentsList.items.length > 0) {
          providerPaymentId = paymentsList.items[0].id;
        }
      } catch (listErr) {
        console.warn("Could not fetch payments list for QR:", listErr);
      }

      // 3. Record payment in database
      await recordPayment({
        userId: session.user.id,
        provider: "razorpay",
        providerPaymentId,
        subscriptionId: qrId,
        amount: paymentsAmountReceived || paymentAmount,
        currency: "INR",
        status: "captured",
      });

      // 4. Activate Filevera subscription & credits in database
      await activateSubscription({
        userId: session.user.id,
        provider: "razorpay",
        providerSubscriptionId: qrId,
        providerPaymentId,
        plan,
        billingInterval: plan === "pro_plus" ? "year" : "month",
        introOfferUsed: isIntro,
      });

      return NextResponse.json({
        status: "paid",
        plan,
        amount: paymentsAmountReceived || paymentAmount,
        paymentId: providerPaymentId,
        message: "Payment successfully verified by Razorpay.",
      });
    }

    return NextResponse.json({
      status: "pending",
      paymentsAmountReceived,
      expectedAmount: paymentAmount,
    });
  } catch (error) {
    console.error("qr-status check error:", error);
    return NextResponse.json(
      { error: "Failed to verify QR payment status." },
      { status: 500 }
    );
  }
}
