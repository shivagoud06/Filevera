import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

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

const db = new Database(process.env.AUTH_DATABASE_PATH ?? "data/file-tools-auth.sqlite");
db.pragma("journal_mode = WAL");

// Ensure support_ticket table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS support_ticket (
    id TEXT PRIMARY KEY NOT NULL,
    userId TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    createdAt INTEGER NOT NULL
  );
`);

export function createSupportTicket(data: {
  userId?: string | null;
  name: string;
  email: string;
  category: string;
  message: string;
}): SupportTicket {
  const id = randomUUID();
  const createdAt = Date.now();
  const status = "open";

  const stmt = db.prepare(`
    INSERT INTO support_ticket (id, userId, name, email, category, message, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.userId || null,
    data.name.trim().slice(0, 100),
    data.email.trim().toLowerCase().slice(0, 150),
    data.category.trim().slice(0, 50),
    data.message.trim().slice(0, 5000),
    status,
    createdAt
  );

  return {
    id,
    userId: data.userId || null,
    name: data.name.trim().slice(0, 100),
    email: data.email.trim().toLowerCase().slice(0, 150),
    category: data.category.trim().slice(0, 50),
    message: data.message.trim().slice(0, 5000),
    status,
    createdAt
  };
}

export function getSupportTickets(status?: string): SupportTicket[] {
  if (status) {
    const stmt = db.prepare("SELECT * FROM support_ticket WHERE status = ? ORDER BY createdAt DESC");
    return stmt.all(status) as SupportTicket[];
  }
  const stmt = db.prepare("SELECT * FROM support_ticket ORDER BY createdAt DESC");
  return stmt.all() as SupportTicket[];
}

export function updateSupportTicketStatus(id: string, status: "open" | "in-progress" | "resolved"): boolean {
  const stmt = db.prepare("UPDATE support_ticket SET status = ? WHERE id = ?");
  const result = stmt.run(status, id);
  return result.changes > 0;
}
