import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { randomBytes } from "node:crypto";

const database = new Database(process.env.AUTH_DATABASE_PATH ?? "data/file-tools-auth.sqlite");
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
database.pragma("journal_mode = WAL");
for (const [table, oldName, newName] of [["user", "email_verified", "emailVerified"], ["user", "created_at", "createdAt"], ["user", "updated_at", "updatedAt"], ["session", "expires_at", "expiresAt"], ["session", "created_at", "createdAt"], ["session", "updated_at", "updatedAt"], ["session", "ip_address", "ipAddress"], ["session", "user_agent", "userAgent"], ["session", "user_id", "userId"], ["account", "account_id", "accountId"], ["account", "provider_id", "providerId"], ["account", "user_id", "userId"], ["account", "access_token", "accessToken"], ["account", "refresh_token", "refreshToken"], ["account", "id_token", "idToken"], ["account", "access_token_expires_at", "accessTokenExpiresAt"], ["account", "refresh_token_expires_at", "refreshTokenExpiresAt"], ["account", "created_at", "createdAt"], ["account", "updated_at", "updatedAt"], ["verification", "identifier", "identifier"], ["verification", "value", "value"], ["verification", "expires_at", "expiresAt"], ["verification", "created_at", "createdAt"], ["verification", "updated_at", "updatedAt"]] as const) {
    if (oldName === newName) continue;
    try { database.exec(`ALTER TABLE ${table} RENAME COLUMN ${oldName} TO ${newName}`); } catch { /* Fresh databases use the current schema below. */ }
}
try { database.exec("ALTER TABLE account ADD COLUMN issuer TEXT"); } catch { /* Column already exists. */ }
database.exec(`
    CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        emailVerified INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY NOT NULL,
        expiresAt INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY NOT NULL,
        accountId TEXT NOT NULL,
        providerId TEXT NOT NULL,
        issuer TEXT,
        userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        accessToken TEXT,
        refreshToken TEXT,
        idToken TEXT,
        accessTokenExpiresAt INTEGER,
        refreshTokenExpiresAt INTEGER,
        scope TEXT,
        password TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY NOT NULL,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        createdAt INTEGER,
        updatedAt INTEGER
    );
`);

export const auth = betterAuth({
    database,
    secret: process.env.BETTER_AUTH_SECRET ?? randomBytes(32).toString("hex"),
    baseURL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    trustedOrigins: [process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"],
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },
    socialProviders: googleClientId && googleClientSecret ? {
        google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
        },
    } : undefined,
});