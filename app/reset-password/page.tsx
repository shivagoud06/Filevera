import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";
import ResetPasswordForm from "../components/reset-password-form";
import AuthShell from "../components/auth-shell";

export const metadata: Metadata = { ...pageMetadata("/reset-password", "Set a New Password", "Set a new password for your Filevera account."), robots: { index: false, follow: true } };

export default function ResetPasswordPage() {
    return (
        <AuthShell>
            <div className="w-full max-w-[390px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <Link href="/" className="text-xl font-black tracking-tight text-sky-500">
                    File<span className="text-slate-900">vera</span>
                </Link>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Set a new password</h1>
                <p className="mt-1.5 text-xs sm:text-sm leading-5 text-slate-600">Use the single-use reset link from your email.</p>
                <Suspense fallback={<p className="mt-4 text-xs text-slate-500">Loading reset form...</p>}>
                    <ResetPasswordForm />
                </Suspense>
                <Link href="/login" className="mt-3.5 inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                    Back to log in
                </Link>
            </div>
        </AuthShell>
    );
}