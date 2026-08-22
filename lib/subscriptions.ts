import { randomUUID } from "node:crypto";
import { dbQuery } from "./db";
import { PlanId, PLANS } from "./plans";
import { stripe } from "./stripe";

export interface SubscriptionRecord {
  id: string;
  userId: string;
  plan: PlanId;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
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
    plan: PlanId;
    subscriptionStatus: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
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
    ...row,
    currentPeriodStart: row.currentPeriodStart ? Number(row.currentPeriodStart) : null,
    currentPeriodEnd: row.currentPeriodEnd ? Number(row.currentPeriodEnd) : null,
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  };
}

export async function isUserIntroEligible(userId: string, plan: "pro" | "pro_plus"): Promise<boolean> {
  const result = await dbQuery<{ count: string | number }>(
    `SELECT COUNT(*) as count 
     FROM subscription 
     WHERE "userId" = $1 AND plan = $2 AND ("introOfferUsed" = true OR "subscriptionStatus" IN ('active', 'past_due', 'canceled'))`,
    [userId, plan]
  );
  const count = Number(result.rows[0]?.count || 0);
  return count === 0;
}

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string | null> {
  if (!stripe) return null;

  // Check if we already have a customer ID stored for this user
  const existingSub = await dbQuery<{ stripeCustomerId: string | null }>(
    'SELECT "stripeCustomerId" FROM subscription WHERE "userId" = $1 AND "stripeCustomerId" IS NOT NULL LIMIT 1',
    [userId]
  );
  if (existingSub.rows[0]?.stripeCustomerId) {
    return existingSub.rows[0].stripeCustomerId;
  }

  // Check in Stripe by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customerId = existingCustomers.data[0].id;
    return customerId;
  }

  // Create new customer in Stripe
  const newCustomer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  return newCustomer.id;
}

export async function isStripeEventProcessed(eventId: string): Promise<boolean> {
  const result = await dbQuery<{ count: string | number }>(
    "SELECT COUNT(*) as count FROM stripe_event WHERE id = $1",
    [eventId]
  );
  return Number(result.rows[0]?.count || 0) > 0;
}

export async function recordStripeEvent(eventId: string, type: string): Promise<boolean> {
  const now = Date.now();
  const insertResult = await dbQuery(
    "INSERT INTO stripe_event (id, type, \"createdAt\") VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
    [eventId, type, now]
  );
  return (insertResult.rowCount ?? 0) > 0;
}

export async function activateSubscriptionFromCheckout(params: {
  userId: string;
  plan: PlanId;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  billingInterval: string;
  introOfferUsed: boolean;
  currentPeriodStart: number;
  currentPeriodEnd: number;
}): Promise<void> {
  const now = Date.now();
  const subId = randomUUID();

  // Insert or update subscription record
  await dbQuery(
    `INSERT INTO subscription (
      id, "userId", plan, "subscriptionStatus", "stripeCustomerId", "stripeSubscriptionId",
      "stripePriceId", "billingInterval", "introOfferUsed", "currentPeriodStart",
      "currentPeriodEnd", "cancelAtPeriodEnd", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, $8, $9, $10, false, $11, $11)
    ON CONFLICT ("stripeSubscriptionId") DO UPDATE SET
      plan = EXCLUDED.plan,
      "subscriptionStatus" = 'active',
      "stripePriceId" = EXCLUDED."stripePriceId",
      "billingInterval" = EXCLUDED."billingInterval",
      "introOfferUsed" = EXCLUDED."introOfferUsed",
      "currentPeriodStart" = EXCLUDED."currentPeriodStart",
      "currentPeriodEnd" = EXCLUDED."currentPeriodEnd",
      "updatedAt" = EXCLUDED."updatedAt"`,
    [
      subId,
      params.userId,
      params.plan,
      params.stripeCustomerId,
      params.stripeSubscriptionId,
      params.stripePriceId,
      params.billingInterval,
      params.introOfferUsed,
      params.currentPeriodStart,
      params.currentPeriodEnd,
      now,
    ]
  );

  // Allocate monthly credits according to activated plan
  const planConfig = PLANS[params.plan] || PLANS.free;
  const newCredits = planConfig.monthlyCredits;
  const resetAt = params.currentPeriodEnd;

  await dbQuery(
    `INSERT INTO user_usage ("userId", plan, credits, "creditsResetAt", "subscriptionStatus", "updatedAt")
     VALUES ($1, $2, $3, $4, 'active', $5)
     ON CONFLICT ("userId") DO UPDATE SET
       plan = EXCLUDED.plan,
       credits = EXCLUDED.credits,
       "creditsResetAt" = EXCLUDED."creditsResetAt",
       "subscriptionStatus" = 'active',
       "updatedAt" = EXCLUDED."updatedAt"`,
    [params.userId, params.plan, newCredits, resetAt, now]
  );
}

export async function syncSubscriptionStatus(params: {
  stripeSubscriptionId: string;
  status: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}): Promise<void> {
  const now = Date.now();
  const subResult = await dbQuery<{ userId: string; plan: PlanId }>(
    'SELECT "userId", plan FROM subscription WHERE "stripeSubscriptionId" = $1 LIMIT 1',
    [params.stripeSubscriptionId]
  );

  const sub = subResult.rows[0];
  if (!sub) return;

  await dbQuery(
    `UPDATE subscription 
     SET "subscriptionStatus" = $1, 
         "currentPeriodStart" = COALESCE($2, "currentPeriodStart"), 
         "currentPeriodEnd" = COALESCE($3, "currentPeriodEnd"), 
         "cancelAtPeriodEnd" = COALESCE($4, "cancelAtPeriodEnd"), 
         "updatedAt" = $5
     WHERE "stripeSubscriptionId" = $6`,
    [
      params.status,
      params.currentPeriodStart || null,
      params.currentPeriodEnd || null,
      params.cancelAtPeriodEnd !== undefined ? params.cancelAtPeriodEnd : null,
      now,
      params.stripeSubscriptionId,
    ]
  );

  const isStillActive = params.status === "active" || params.status === "trialing";
  const userPlan = isStillActive ? sub.plan : "free";

  await dbQuery(
    `UPDATE user_usage 
     SET plan = $1, "subscriptionStatus" = $2, "updatedAt" = $3
     WHERE "userId" = $4`,
    [userPlan, params.status, now, sub.userId]
  );
}

export async function renewSubscriptionCredits(params: {
  stripeSubscriptionId: string;
  currentPeriodEnd: number;
}): Promise<void> {
  const now = Date.now();
  const subResult = await dbQuery<{ userId: string; plan: PlanId }>(
    'SELECT "userId", plan FROM subscription WHERE "stripeSubscriptionId" = $1 LIMIT 1',
    [params.stripeSubscriptionId]
  );

  const sub = subResult.rows[0];
  if (!sub) return;

  const planConfig = PLANS[sub.plan] || PLANS.free;
  const newCredits = planConfig.monthlyCredits;

  await dbQuery(
    `UPDATE user_usage 
     SET credits = $1, "creditsResetAt" = $2, "updatedAt" = $3
     WHERE "userId" = $4`,
    [newCredits, params.currentPeriodEnd, now, sub.userId]
  );
}
