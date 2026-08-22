import { randomUUID } from "node:crypto";
import { dbQuery } from "./db";
import { PlanId, PLANS } from "./plans";
import { razorpay } from "./razorpay";

export interface SubscriptionRecord {
  id: string;
  userId: string;
  provider: string;
  providerSubscriptionId: string | null;
  providerPaymentId: string | null;
  plan: PlanId;
  subscriptionStatus: string;
  billingInterval: string | null;
  introOfferUsed: boolean;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  createdAt: number;
  updatedAt: number;
}

export async function getUserSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const result = await dbQuery<{
    id: string;
    userId: string;
    provider?: string;
    providerSubscriptionId?: string | null;
    providerPaymentId?: string | null;
    plan: PlanId;
    subscriptionStatus: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    billingInterval: string | null;
    introOfferUsed: boolean;
    currentPeriodStart: number | string | null;
    currentPeriodEnd: number | string | null;
    cancelAtPeriodEnd: boolean;
    createdAt: number | string;
    updatedAt: number | string;
  }>(
    'SELECT * FROM subscription WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
    [userId]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    provider: row.provider || "razorpay",
    providerSubscriptionId: row.providerSubscriptionId || row.stripeSubscriptionId || null,
    providerPaymentId: row.providerPaymentId || null,
    plan: row.plan,
    subscriptionStatus: row.subscriptionStatus,
    billingInterval: row.billingInterval,
    introOfferUsed: Boolean(row.introOfferUsed),
    currentPeriodStart: row.currentPeriodStart ? Number(row.currentPeriodStart) : null,
    currentPeriodEnd: row.currentPeriodEnd ? Number(row.currentPeriodEnd) : null,
    cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  };
}

export async function isUserIntroEligible(userId: string, plan: "pro" | "pro_plus"): Promise<boolean> {
  const result = await dbQuery<{ count: string | number }>(
    `SELECT COUNT(*) as count 
     FROM subscription 
     WHERE "userId" = $1 AND plan = $2 AND ("introOfferUsed" = true OR "subscriptionStatus" IN ('active', 'past_due', 'completed', 'canceled'))`,
    [userId, plan]
  );
  const count = Number(result.rows[0]?.count || 0);
  return count === 0;
}

export async function recordPayment(params: {
  userId: string;
  provider?: string;
  providerPaymentId: string;
  subscriptionId?: string | null;
  amount: number;
  currency?: string;
  status: string;
}): Promise<void> {
  const now = Date.now();
  const id = randomUUID();
  await dbQuery(
    `INSERT INTO payments (id, "userId", provider, "providerPaymentId", "subscriptionId", amount, currency, status, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT ("providerPaymentId") DO UPDATE 
     SET status = EXCLUDED.status`,
    [
      id,
      params.userId,
      params.provider || "razorpay",
      params.providerPaymentId,
      params.subscriptionId || null,
      params.amount,
      params.currency || "INR",
      params.status,
      now,
    ]
  );
}

export async function activateSubscription(params: {
  userId: string;
  provider?: string;
  providerSubscriptionId?: string | null;
  providerPaymentId?: string | null;
  plan: "pro" | "pro_plus";
  billingInterval: "month" | "year";
  introOfferUsed: boolean;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
}): Promise<void> {
  const now = Date.now();
  const periodDuration = params.billingInterval === "year" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const start = params.currentPeriodStart || now;
  const end = params.currentPeriodEnd || now + periodDuration;
  const subId = randomUUID();

  // 1. Insert or update subscription record
  await dbQuery(
    `INSERT INTO subscription (
      id, "userId", provider, "providerSubscriptionId", "providerPaymentId", 
      plan, "subscriptionStatus", "billingInterval", "introOfferUsed", 
      "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9, $10, false, $11, $12)`,
    [
      subId,
      params.userId,
      params.provider || "razorpay",
      params.providerSubscriptionId || null,
      params.providerPaymentId || null,
      params.plan,
      params.billingInterval,
      params.introOfferUsed,
      start,
      end,
      now,
      now,
    ]
  );

  // 2. Update user_usage table with appropriate credit allocation
  const planConfig = PLANS[params.plan];
  const newCredits = planConfig.monthlyCredits;

  await dbQuery(
    `INSERT INTO user_usage ("userId", plan, credits, "creditsResetAt", "subscriptionStatus", "updatedAt")
     VALUES ($1, $2, $3, $4, 'active', $5)
     ON CONFLICT ("userId") DO UPDATE
     SET plan = EXCLUDED.plan,
         credits = EXCLUDED.credits,
         "creditsResetAt" = EXCLUDED."creditsResetAt",
         "subscriptionStatus" = 'active',
         "updatedAt" = EXCLUDED."updatedAt"`,
    [params.userId, params.plan, newCredits, end, now]
  );
}

export async function cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
  const sub = await getUserSubscription(userId);
  if (!sub || !sub.providerSubscriptionId) {
    return { success: false, error: "No active subscription found to cancel." };
  }

  // If Razorpay subscription, cancel via Razorpay API
  if (razorpay && sub.providerSubscriptionId.startsWith("sub_")) {
    try {
      await razorpay.subscriptions.cancel(sub.providerSubscriptionId, true); // true = cancel at end of cycle
    } catch (err) {
      console.warn("Razorpay API subscription cancel notice:", err);
    }
  }

  const now = Date.now();
  await dbQuery(
    `UPDATE subscription 
     SET "cancelAtPeriodEnd" = true, "updatedAt" = $1 
     WHERE "userId" = $2 AND "subscriptionStatus" = 'active'`,
    [now, userId]
  );

  return { success: true };
}

export async function processRazorpayWebhookEvent(
  eventId: string,
  eventType: string
): Promise<boolean> {
  // Idempotency check
  const now = Date.now();
  try {
    await dbQuery(
      'INSERT INTO razorpay_event (id, type, "createdAt") VALUES ($1, $2, $3)',
      [eventId, eventType, now]
    );
    return true; // First time processing
  } catch {
    return false; // Already processed
  }
}
