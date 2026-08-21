import type { Metadata } from "next";
import AuthPage from "../components/auth-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...pageMetadata("/login", "Log in", "Log in to your Filevera account."), robots: { index: false, follow: true } };
export default function LoginPage() { return <AuthPage mode="login" googleConfigured={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} />; }