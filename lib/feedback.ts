import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

export interface FeedbackItem {
  id: string;
  userId?: string | null;
  displayName: string;
  rating: number;
  message: string;
  tool?: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
}

const db = new Database(process.env.AUTH_DATABASE_PATH ?? "data/file-tools-auth.sqlite");
db.pragma("journal_mode = WAL");

// Ensure feedback table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY NOT NULL,
    userId TEXT,
    displayName TEXT NOT NULL,
    rating INTEGER NOT NULL,
    message TEXT NOT NULL,
    tool TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt INTEGER NOT NULL
  );
`);

export function submitFeedback(data: {
  userId?: string | null;
  displayName: string;
  rating: number;
  message: string;
  tool?: string | null;
}): FeedbackItem {
  const id = randomUUID();
  const createdAt = Date.now();
  const status = "pending"; // Always pending moderation initially

  const stmt = db.prepare(`
    INSERT INTO feedback (id, userId, displayName, rating, message, tool, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.userId || null,
    data.displayName.trim().slice(0, 50),
    Math.min(5, Math.max(1, Math.round(data.rating))),
    data.message.trim().slice(0, 1000),
    data.tool ? data.tool.trim().slice(0, 50) : null,
    status,
    createdAt
  );

  return {
    id,
    userId: data.userId || null,
    displayName: data.displayName.trim().slice(0, 50),
    rating: Math.min(5, Math.max(1, Math.round(data.rating))),
    message: data.message.trim().slice(0, 1000),
    tool: data.tool ? data.tool.trim().slice(0, 50) : null,
    status,
    createdAt
  };
}

export function getApprovedFeedback(limit = 20, offset = 0): { items: FeedbackItem[]; total: number; avgRating: number } {
  const countStmt = db.prepare("SELECT COUNT(*) as count, AVG(rating) as avgRating FROM feedback WHERE status = 'approved'");
  const countResult = countStmt.get() as { count: number; avgRating: number | null } | undefined;
  const total = countResult?.count || 0;
  const avgRating = countResult?.avgRating ? Number(countResult.avgRating.toFixed(1)) : 0;

  const selectStmt = db.prepare(`
    SELECT * FROM feedback 
    WHERE status = 'approved' 
    ORDER BY createdAt DESC 
    LIMIT ? OFFSET ?
  `);

  const items = selectStmt.all(limit, offset) as FeedbackItem[];
  return { items, total, avgRating };
}

export function moderateFeedback(id: string, status: "approved" | "rejected"): boolean {
  const stmt = db.prepare("UPDATE feedback SET status = ? WHERE id = ?");
  const result = stmt.run(status, id);
  return result.changes > 0;
}
