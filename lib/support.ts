import { randomUUID } from "node:crypto";
import { dbQuery } from "./db";

export interface SupportTicket {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  category: string;
  message: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: number;
}

export async function createSupportTicket(data: {
  userId?: string | null;
  name: string;
  email: string;
  category: string;
  message: string;
}): Promise<SupportTicket> {
  const id = randomUUID();
  const createdAt = Date.now();
  const status = "open";

  const finalName = data.name.trim().slice(0, 100);
  const finalEmail = data.email.trim().toLowerCase().slice(0, 150);
  const finalCategory = data.category.trim().slice(0, 50);
  const finalMessage = data.message.trim().slice(0, 5000);

  await dbQuery(
    `INSERT INTO support_ticket (id, "userId", name, email, category, message, status, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      data.userId || null,
      finalName,
      finalEmail,
      finalCategory,
      finalMessage,
      status,
      createdAt,
    ]
  );

  return {
    id,
    userId: data.userId || null,
    name: finalName,
    email: finalEmail,
    category: finalCategory,
    message: finalMessage,
    status,
    createdAt,
  };
}

export async function getSupportTickets(status?: string): Promise<SupportTicket[]> {
  if (status) {
    const result = await dbQuery<{
      id: string;
      userId: string | null;
      name: string;
      email: string;
      category: string;
      message: string;
      status: "open" | "in-progress" | "resolved";
      createdAt: number | string;
    }>(
      'SELECT id, "userId", name, email, category, message, status, "createdAt" FROM support_ticket WHERE status = $1 ORDER BY "createdAt" DESC',
      [status]
    );
    return result.rows.map((r) => ({ ...r, createdAt: Number(r.createdAt) }));
  }

  const result = await dbQuery<{
    id: string;
    userId: string | null;
    name: string;
    email: string;
    category: string;
    message: string;
    status: "open" | "in-progress" | "resolved";
    createdAt: number | string;
  }>(
    'SELECT id, "userId", name, email, category, message, status, "createdAt" FROM support_ticket ORDER BY "createdAt" DESC'
  );
  return result.rows.map((r) => ({ ...r, createdAt: Number(r.createdAt) }));
}

export async function updateSupportTicketStatus(
  id: string,
  status: "open" | "in-progress" | "resolved"
): Promise<boolean> {
  const result = await dbQuery(
    "UPDATE support_ticket SET status = $1 WHERE id = $2",
    [status, id]
  );
  return (result.rowCount ?? 0) > 0;
}
