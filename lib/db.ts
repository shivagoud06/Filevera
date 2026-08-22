import { Pool, PoolConfig, QueryResult, QueryResultRow } from "pg";

declare global {
  var __filevera_pg_pool__: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  const isLocal =
    connectionString?.includes("localhost") ||
    connectionString?.includes("127.0.0.1");

  const config: PoolConfig = {
    connectionString: connectionString || "postgresql://localhost:5432/filevera_dev",
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: isLocal || !connectionString ? undefined : { rejectUnauthorized: false },
  };

  return new Pool(config);
}

export const pool: Pool = globalThis.__filevera_pg_pool__ ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.__filevera_pg_pool__ = pool;
}

let initPromise: Promise<void> | null = null;

export async function ensureDbInitialized(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    return;
  }

  if (!initPromise) {
    initPromise = (async () => {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "user" (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            "emailVerified" BOOLEAN NOT NULL DEFAULT false,
            image TEXT,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "session" (
            id TEXT PRIMARY KEY NOT NULL,
            "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            token TEXT NOT NULL UNIQUE,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "ipAddress" TEXT,
            "userAgent" TEXT,
            "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS "account" (
            id TEXT PRIMARY KEY NOT NULL,
            "accountId" TEXT NOT NULL,
            "providerId" TEXT NOT NULL,
            issuer TEXT,
            "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
            "accessToken" TEXT,
            "refreshToken" TEXT,
            "idToken" TEXT,
            "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
            "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
            scope TEXT,
            password TEXT,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "verification" (
            id TEXT PRIMARY KEY NOT NULL,
            identifier TEXT NOT NULL,
            value TEXT NOT NULL,
            "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS user_usage (
            "userId" TEXT PRIMARY KEY NOT NULL,
            plan TEXT NOT NULL DEFAULT 'free',
            credits INTEGER NOT NULL DEFAULT 100,
            "creditsResetAt" BIGINT NOT NULL,
            "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
            "updatedAt" BIGINT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS feedback (
            id TEXT PRIMARY KEY NOT NULL,
            "userId" TEXT,
            "displayName" TEXT NOT NULL,
            rating INTEGER NOT NULL,
            message TEXT NOT NULL,
            tool TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            "createdAt" BIGINT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS support_ticket (
            id TEXT PRIMARY KEY NOT NULL,
            "userId" TEXT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            category TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            "createdAt" BIGINT NOT NULL
          );
        `);
      } catch (err) {
        console.error("Database schema initialization warning:", err);
      }
    })();
  }

  return initPromise;
}

export async function dbQuery<R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<R>> {
  await ensureDbInitialized();
  return pool.query<R>(text, params);
}
