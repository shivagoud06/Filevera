import Database from "better-sqlite3";
import { getPlan, PlanId, PLANS } from "./plans";

export interface UserUsage {
  userId: string;
  plan: PlanId;
  credits: number;
  creditsResetAt: number;
  subscriptionStatus: string;
  updatedAt: number;
}

const db = new Database(process.env.AUTH_DATABASE_PATH ?? "data/file-tools-auth.sqlite");
db.pragma("journal_mode = WAL");

// Ensure usage table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS user_usage (
    userId TEXT PRIMARY KEY NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    credits INTEGER NOT NULL DEFAULT 100,
    creditsResetAt INTEGER NOT NULL,
    subscriptionStatus TEXT NOT NULL DEFAULT 'active',
    updatedAt INTEGER NOT NULL
  );
`);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function ensureUserUsage(userId: string): UserUsage {
  const now = Date.now();
  const selectStmt = db.prepare("SELECT * FROM user_usage WHERE userId = ?");
  const existing = selectStmt.get(userId) as UserUsage | undefined;

  if (!existing) {
    const starterCredits = PLANS.free.starterCredits;
    const resetAt = now + THIRTY_DAYS_MS;
    const insertStmt = db.prepare(`
      INSERT INTO user_usage (userId, plan, credits, creditsResetAt, subscriptionStatus, updatedAt)
      VALUES (?, 'free', ?, ?, 'active', ?)
    `);
    insertStmt.run(userId, starterCredits, resetAt, now);
    return {
      userId,
      plan: "free",
      credits: starterCredits,
      creditsResetAt: resetAt,
      subscriptionStatus: "active",
      updatedAt: now
    };
  }

  // Check if monthly renewal period has elapsed
  if (now >= existing.creditsResetAt) {
    const planConfig = getPlan(existing.plan);
    const renewedCredits = planConfig.monthlyCredits;
    const newResetAt = now + THIRTY_DAYS_MS;
    const updateResetStmt = db.prepare(`
      UPDATE user_usage 
      SET credits = ?, creditsResetAt = ?, updatedAt = ?
      WHERE userId = ?
    `);
    updateResetStmt.run(renewedCredits, newResetAt, now, userId);
    return {
      ...existing,
      credits: renewedCredits,
      creditsResetAt: newResetAt,
      updatedAt: now
    };
  }

  return existing;
}

export function calculateCreditCost(tool: string, fileCount = 1, totalBytes = 0): number {
  const baseCost = 1;
  const additionalFiles = Math.max(0, fileCount - 1);
  const sizeCost = totalBytes > 20 * 1024 * 1024 ? 1 : 0;
  return baseCost + additionalFiles + sizeCost;
}

export function deductUserCredits(userId: string, amount: number): { success: boolean; remaining: number; error?: string } {
  const usage = ensureUserUsage(userId);
  if (usage.credits < amount) {
    return {
      success: false,
      remaining: usage.credits,
      error: `Insufficient credits. This operation requires ${amount} credit${amount === 1 ? "" : "s"}, but you have ${usage.credits} remaining.`
    };
  }

  const newCredits = usage.credits - amount;
  const now = Date.now();
  const updateStmt = db.prepare("UPDATE user_usage SET credits = ?, updatedAt = ? WHERE userId = ?");
  updateStmt.run(newCredits, now, userId);

  return {
    success: true,
    remaining: newCredits
  };
}

export function refundUserCredits(userId: string, amount: number): void {
  if (amount <= 0) return;
  const now = Date.now();
  const updateStmt = db.prepare("UPDATE user_usage SET credits = credits + ?, updatedAt = ? WHERE userId = ?");
  updateStmt.run(amount, now, userId);
}
