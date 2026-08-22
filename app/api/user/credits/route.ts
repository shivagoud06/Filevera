import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ensureUserUsage, getUserCreditHistory } from "@/lib/credits";
import { getPlan } from "@/lib/plans";
import { getUserSubscription, isUserIntroEligible } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usage = await ensureUserUsage(session.user.id);
    const sub = await getUserSubscription(session.user.id);
    const plan = getPlan(usage.plan);
    const isProIntroEligible = await isUserIntroEligible(session.user.id, "pro");
    const isProPlusIntroEligible = await isUserIntroEligible(session.user.id, "pro_plus");
    const recentUsage = await getUserCreditHistory(session.user.id, 20);

    const monthlyAllowance = plan.monthlyCredits;
    const creditsUsedThisCycle = Math.max(0, monthlyAllowance - usage.credits);

    let maskedSubscriptionId: string | null = null;
    if (sub?.providerSubscriptionId) {
      const raw = sub.providerSubscriptionId;
      if (raw.length > 8) {
        maskedSubscriptionId = `${raw.slice(0, 4)}••••${raw.slice(-4)}`;
      } else {
        maskedSubscriptionId = raw;
      }
    }

    return NextResponse.json({
      userId: session.user.id,
      plan: usage.plan,
      planName: plan.name,
      credits: usage.credits,
      creditsResetAt: usage.creditsResetAt,
      subscriptionStatus: usage.subscriptionStatus,
      subscriptionId: maskedSubscriptionId,
      provider: sub?.provider || "razorpay",
      cancelAtPeriodEnd: Boolean(sub?.cancelAtPeriodEnd),
      currentPeriodEnd: sub?.currentPeriodEnd || null,
      billingInterval: sub?.billingInterval || (usage.plan === "pro_plus" ? "year" : "month"),
      isProIntroEligible,
      isProPlusIntroEligible,
      monthlyAllowance,
      creditsUsedThisCycle,
      recentUsage,
      planDetails: plan,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch user credits" }, { status: 500 });
  }
}
