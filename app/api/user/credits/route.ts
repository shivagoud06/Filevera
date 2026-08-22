import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ensureUserUsage } from "@/lib/credits";
import { getPlan } from "@/lib/plans";

export async function GET() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usage = await ensureUserUsage(session.user.id);
    const plan = getPlan(usage.plan);

    return NextResponse.json({
      userId: session.user.id,
      plan: usage.plan,
      planName: plan.name,
      credits: usage.credits,
      creditsResetAt: usage.creditsResetAt,
      subscriptionStatus: usage.subscriptionStatus,
      planDetails: plan,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch user credits" }, { status: 500 });
  }
}
