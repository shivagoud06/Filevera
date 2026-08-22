import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import ForgotPasswordForm from "../components/forgot-password-form";
import AuthShell from "../components/auth-shell";

export const metadata: Metadata = { ...pageMetadata("/forgot-password", "Reset Your Password", "Request a password reset for your Filevera account."), robots: { index: false, follow: true } };

export default function ForgotPasswordPage() {
    return (
        <AuthShell>
            <div className="w-full max-w-[390px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <Link href="/" className="text-xl font-black tracking-tight text-sky-500">
                    File<span className="text-slate-900">vera</span>
                </Link>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Forgot your password?</h1>
                <p className="mt-1.5 text-xs sm:text-sm leading-5 text-slate-600">Enter your email and we&apos;ll help you reset your password.</p>
                <ForgotPasswordForm />
                <Link href="/login" className="mt-3.5 inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                    Back to log in
                </Link>
            </div>
        </AuthShell>
    );
}