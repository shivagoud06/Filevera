import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cancelSubscription } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const reqHeaders = await nextHeaders();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await cancelSubscription(session.user.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to cancel subscription." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Your subscription has been scheduled for cancellation at the end of the current billing cycle.",
    });
  } catch (error) {
    console.error("cancel-subscription error:", error);
    return NextResponse.json({ error: "Failed to process cancellation." }, { status: 500 });
  }
}
