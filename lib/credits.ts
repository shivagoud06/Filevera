import { randomUUID } from "node:crypto";
import { getPlan, PlanId, PLANS } from "./plans";
import { dbQuery } from "./db";
import {
  OperationType,
  getOperationCost,
  getOperationLabel,
} from "./credit-constants";

export * from "./credit-constants";

export interface UserUsage {
  userId: string;
  plan: PlanId;
  credits: number;
  creditsResetAt: number;
  subscriptionStatus: string;
  updatedAt: number;
}

export interface CreditUsageRecord {
  id: string;
  userId: string;
  operation: string;
  operationLabel: string;
  creditsUsed: number;
  balanceAfter: number;
  createdAt: number;
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

export function checkPlanLimits(
  planId: PlanId,
  params: {
    fileBytes?: number;
    fileType?: "pdf" | "image";
    batchCount?: number;
  }
): { valid: boolean; error?: string } {
  const plan = getPlan(planId);

  if (params.fileType === "pdf" && params.fileBytes) {
    const maxPdfBytes = plan.maxPdfSizeMB * 1024 * 1024;
    if (params.fileBytes > maxPdfBytes) {
      return {
        valid: false,
        error: `File size exceeds your ${plan.name} plan limit of ${plan.maxPdfSizeMB} MB. Upgrade for higher upload limits.`,
      };
    }
  }

  if (params.fileType === "image" && params.fileBytes) {
    const maxImageBytes = plan.maxImageSizeMB * 1024 * 1024;
    if (params.fileBytes > maxImageBytes) {
      return {
        valid: false,
        error: `Image size exceeds your ${plan.name} plan limit of ${plan.maxImageSizeMB} MB. Upgrade for higher upload limits.`,
      };
    }
  }

  if (params.batchCount && params.batchCount > plan.maxBatchCount) {
    return {
      valid: false,
      error: `Batch upload of ${params.batchCount} files exceeds your ${plan.name} plan limit of ${plan.maxBatchCount} files. Upgrade to process larger batches.`,
    };
  }

  return { valid: true };
}

export async function reserveAndDeductCredits(
  userId: string,
  operation: OperationType
): Promise<{
  success: boolean;
  remaining: number;
  required: number;
  error?: string;
}> {
  const usage = await ensureUserUsage(userId);
  const cost = getOperationCost(operation);

  if (usage.credits < cost) {
    return {
      success: false,
      remaining: usage.credits,
      required: cost,
      error: `Not enough credits for this operation. Required: ${cost} credits • Available: ${usage.credits} credits.`,
    };
  }

  const now = Date.now();
  // Atomic deduction with constraint check
  const updateRes = await dbQuery<{ credits: number | string }>(
    `UPDATE user_usage 
     SET credits = credits - $1, "updatedAt" = $2 
     WHERE "userId" = $3 AND credits >= $1 
     RETURNING credits`,
    [cost, now, userId]
  );

  if (!updateRes.rows[0]) {
    return {
      success: false,
      remaining: usage.credits,
      required: cost,
      error: `Not enough credits for this operation. Required: ${cost} credits • Available: ${usage.credits} credits.`,
    };
  }

  const remaining = Number(updateRes.rows[0].credits);

  return {
    success: true,
    remaining,
    required: cost,
  };
}

export async function commitCreditUsage(
  userId: string,
  operation: OperationType,
  creditsUsed: number,
  balanceAfter: number
): Promise<void> {
  const now = Date.now();
  const id = randomUUID();
  await dbQuery(
    `INSERT INTO credit_usage (id, "userId", operation, "creditsUsed", "balanceAfter", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, operation, creditsUsed, balanceAfter, now]
  );
}

export async function refundReservedCredits(
  userId: string,
  amount: number
): Promise<void> {
  if (amount <= 0) return;
  const now = Date.now();
  await dbQuery(
    'UPDATE user_usage SET credits = credits + $1, "updatedAt" = $2 WHERE "userId" = $3',
    [amount, now, userId]
  );
}

export async function getUserCreditHistory(
  userId: string,
  limit = 20
): Promise<CreditUsageRecord[]> {
  const res = await dbQuery<{
    id: string;
    userId: string;
    operation: string;
    creditsUsed: number | string;
    balanceAfter: number | string;
    createdAt: number | string;
  }>(
    `SELECT id, "userId", operation, "creditsUsed", "balanceAfter", "createdAt"
     FROM credit_usage
     WHERE "userId" = $1
     ORDER BY "createdAt" DESC
     LIMIT $2`,
    [userId, limit]
  );

  return res.rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    operation: row.operation,
    operationLabel: getOperationLabel(row.operation),
    creditsUsed: Number(row.creditsUsed),
    balanceAfter: Number(row.balanceAfter),
    createdAt: Number(row.createdAt),
  }));
}
