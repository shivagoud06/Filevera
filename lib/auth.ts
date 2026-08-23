import { betterAuth } from "better-auth";
import { randomBytes } from "node:crypto";
import { pool } from "./db";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Explicit trusted production and preview origins
const trustedOrigins: string[] = [
  "https://fileveraio.vercel.app",
  "https://filevera-shivagoud06s-projects.vercel.app",
  "https://*.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

// Add runtime environment URLs if present
if (process.env.NEXT_PUBLIC_SITE_URL) {
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
    if (origin && !trustedOrigins.includes(origin)) {
      trustedOrigins.push(origin);
    }
  } catch {}
}

if (process.env.BETTER_AUTH_URL) {
  try {
    const origin = new URL(process.env.BETTER_AUTH_URL).origin;
    if (origin && !trustedOrigins.includes(origin)) {
      trustedOrigins.push(origin);
    }
  } catch {}
}

if (process.env.VERCEL_URL) {
  const vercelUrl = process.env.VERCEL_URL.startsWith("http")
    ? process.env.VERCEL_URL
    : `https://${process.env.VERCEL_URL}`;
  try {
    const origin = new URL(vercelUrl).origin;
    if (origin && !trustedOrigins.includes(origin)) {
      trustedOrigins.push(origin);
    }
  } catch {}
}

const fallbackBaseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  "https://fileveraio.vercel.app";

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET ?? randomBytes(32).toString("hex"),
  baseURL: {
    allowedHosts: [
      "fileveraio.vercel.app",
      "filevera-shivagoud06s-projects.vercel.app",
      "*.vercel.app",
      "localhost:3000",
      "localhost:3001",
      "localhost",
      "127.0.0.1:3000",
      "127.0.0.1:3001",
      "127.0.0.1",
    ],
    fallback: fallbackBaseURL,
  },
  trustedOrigins,
  onAPIError: {
    errorURL: "/login",
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            prompt: "select_account",
            accessType: "offline",
          },
        }
      : undefined,
});