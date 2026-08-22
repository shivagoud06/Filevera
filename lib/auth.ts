import { betterAuth } from "better-auth";
import { randomBytes } from "node:crypto";
import { pool } from "./db";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET ?? randomBytes(32).toString("hex"),
  baseURL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  trustedOrigins: [process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"],
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
          },
        }
      : undefined,
});