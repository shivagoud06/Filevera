import type { Metadata } from "next";
import AuthPage from "../components/auth-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...pageMetadata("/signup", "Create an Account", "Create a Filevera account for your personal file workflows."), robots: { index: false, follow: true } };
export default function SignupPage() { return <AuthPage mode="signup" googleConfigured={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} />; }