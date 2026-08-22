import { getPlan, PlanId, PLANS } from "./plans";
import { dbQuery } from "./db";

export interface UserUsage {
  userId: string;
  plan: PlanId;
  credits: number;
  creditsResetAt: number;
  subscriptionStatus: string;
  updatedAt: number;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function ensureUserUsage(userId: string): Promise<UserUsage> {
  const now = Date.now();
  const res = await dbQuery<{
    userId: string;
    plan: PlanId;
    credits: number | string;
    creditsResetAt: number | string;
    subscriptionStatus: string;
    updatedAt: number | string;
  }>(
    'SELECT "userId", plan, credits, "creditsResetAt", "subscriptionStatus", "updatedAt" FROM user_usage WHERE "userId" = $1',
    [userId]
  );
  const existing = res.rows[0];

  if (!existing) {
    const starterCredits = PLANS.free.starterCredits;
    const resetAt = now + THIRTY_DAYS_MS;
    await dbQuery(
      `INSERT INTO user_usage ("userId", plan, credits, "creditsResetAt", "subscriptionStatus", "updatedAt")
       VALUES ($1, 'free', $2, $3, 'active', $4)
       ON CONFLICT ("userId") DO NOTHING`,
      [userId, starterCredits, resetAt, now]
    );
    return {
      userId,
      plan: "free",
      credits: starterCredits,
      creditsResetAt: resetAt,
      subscriptionStatus: "active",
      updatedAt: now,
    };
  }

  // Check if monthly renewal period has elapsed
  if (now >= Number(existing.creditsResetAt)) {
    const planConfig = getPlan(existing.plan);
    const renewedCredits = planConfig.monthlyCredits;
    const newResetAt = now + THIRTY_DAYS_MS;
    await dbQuery(
      `UPDATE user_usage 
       SET credits = $1, "creditsResetAt" = $2, "updatedAt" = $3
       WHERE "userId" = $4`,
      [renewedCredits, newResetAt, now, userId]
    );
    return {
      userId: existing.userId,
      plan: existing.plan,
      credits: renewedCredits,
      creditsResetAt: newResetAt,
      subscriptionStatus: existing.subscriptionStatus,
      updatedAt: now,
    };
  }

  return {
    userId: existing.userId,
    plan: existing.plan,
    credits: Number(existing.credits),
    creditsResetAt: Number(existing.creditsResetAt),
    subscriptionStatus: existing.subscriptionStatus,
    updatedAt: Number(existing.updatedAt),
  };
}

export function calculateCreditCost(tool: string, fileCount = 1, totalBytes = 0): number {
  const baseCost = 1;
  const additionalFiles = Math.max(0, fileCount - 1);
  const sizeCost = totalBytes > 20 * 1024 * 1024 ? 1 : 0;
  return baseCost + additionalFiles + sizeCost;
}

export async function deductUserCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; remaining: number; error?: string }> {
  const usage = await ensureUserUsage(userId);
  if (usage.credits < amount) {
    return {
      success: false,
      remaining: usage.credits,
      error: `Insufficient credits. This operation requires ${amount} credit${
        amount === 1 ? "" : "s"
      }, but you have ${usage.credits} remaining.`,
    };
  }

  const newCredits = usage.credits - amount;
  const now = Date.now();
  await dbQuery(
    'UPDATE user_usage SET credits = $1, "updatedAt" = $2 WHERE "userId" = $3',
    [newCredits, now, userId]
  );

  return {
    success: true,
    remaining: newCredits,
  };
}

export async function refundUserCredits(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  const now = Date.now();
  await dbQuery(
    'UPDATE user_usage SET credits = credits + $1, "updatedAt" = $2 WHERE "userId" = $3',
    [amount, now, userId]
  );
}
