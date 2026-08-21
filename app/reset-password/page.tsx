import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";
import ResetPasswordForm from "../components/reset-password-form";
import AuthShell from "../components/auth-shell";

export const metadata: Metadata = { ...pageMetadata("/reset-password", "Set a New Password", "Set a new password for your Filevera account."), robots: { index: false, follow: true } };
export default function ResetPasswordPage() { return <AuthShell><div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><Link href="/" className="text-2xl font-black tracking-tight text-sky-500">File<span className="text-slate-900">vera</span></Link><h1 className="mt-5 text-3xl font-bold text-slate-900">Set a new password</h1><p className="mt-2 text-sm leading-6 text-slate-700">Use the single-use reset link from your email. Links expire automatically.</p><Suspense fallback={<p className="mt-6 text-sm text-slate-600">Loading reset form...</p>}><ResetPasswordForm /></Suspense><Link href="/login" className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-900 hover:bg-slate-50">Back to log in</Link></div></AuthShell>; }