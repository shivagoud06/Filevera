import { randomUUID } from "node:crypto";
import { dbQuery } from "./db";

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

export async function submitFeedback(data: {
  userId?: string | null;
  displayName: string;
  rating: number;
  message: string;
  tool?: string | null;
}): Promise<FeedbackItem> {
  const id = randomUUID();
  const createdAt = Date.now();
  const status = "pending"; // Always pending moderation initially

  const finalDisplayName = data.displayName.trim().slice(0, 50);
  const finalRating = Math.min(5, Math.max(1, Math.round(data.rating)));
  const finalMessage = data.message.trim().slice(0, 1000);
  const finalTool = data.tool ? data.tool.trim().slice(0, 50) : null;

  await dbQuery(
    `INSERT INTO feedback (id, "userId", "displayName", rating, message, tool, status, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      data.userId || null,
      finalDisplayName,
      finalRating,
      finalMessage,
      finalTool,
      status,
      createdAt,
    ]
  );

  return {
    id,
    userId: data.userId || null,
    displayName: finalDisplayName,
    rating: finalRating,
    message: finalMessage,
    tool: finalTool,
    status,
    createdAt,
  };
}

export async function getApprovedFeedback(
  limit = 20,
  offset = 0
): Promise<{ items: FeedbackItem[]; total: number; avgRating: number }> {
  const countResult = await dbQuery<{ count: string | number; avgrating: string | number | null }>(
    "SELECT COUNT(*) as count, AVG(rating) as avgrating FROM feedback WHERE status = 'approved'"
  );

  const row = countResult.rows[0];
  const total = row ? Number(row.count) : 0;
  const avgRating = row && row.avgrating ? Number(Number(row.avgrating).toFixed(1)) : 0;

  const selectResult = await dbQuery<{
    id: string;
    userId: string | null;
    displayName: string;
    rating: number | string;
    message: string;
    tool: string | null;
    status: "pending" | "approved" | "rejected";
    createdAt: number | string;
  }>(
    `SELECT id, "userId", "displayName", rating, message, tool, status, "createdAt" 
     FROM feedback 
     WHERE status = 'approved' 
     ORDER BY "createdAt" DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const items: FeedbackItem[] = selectResult.rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    displayName: r.displayName,
    rating: Number(r.rating),
    message: r.message,
    tool: r.tool,
    status: r.status,
    createdAt: Number(r.createdAt),
  }));

  return { items, total, avgRating };
}

export async function moderateFeedback(
  id: string,
  status: "approved" | "rejected"
): Promise<boolean> {
  const result = await dbQuery("UPDATE feedback SET status = $1 WHERE id = $2", [
    status,
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}
