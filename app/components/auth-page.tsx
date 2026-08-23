import Link from "next/link";
import { Suspense } from "react";
import AuthForm from "./auth-form";
import AuthShell from "./auth-shell";
import { SUPPORT_EMAIL } from "@/lib/config";

export default function AuthPage({ mode, googleConfigured = false }: { mode: "login" | "signup"; googleConfigured?: boolean }) {
    const isSignup = mode === "signup";
    return (
        <AuthShell>
            <div className="w-full max-w-[390px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <Link href="/" className="text-xl font-black tracking-tight text-sky-500">
                    File<span className="text-slate-900">vera</span>
                </Link>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                    {isSignup ? "Create your account" : "Welcome back"}
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm leading-5 text-slate-600">
                    {isSignup ? "Save your place for future file work. Basic tools remain free & anonymous." : "Sign in to your Filevera account."}
                </p>
                <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-50" />}>
                    <AuthForm mode={mode} googleConfigured={googleConfigured} />
                </Suspense>
                <p className="mt-4 text-center text-xs text-slate-600">
                    {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                    <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-sky-600 hover:underline">
                        {isSignup ? "Log in" : "Sign up"}
                    </Link>
                </p>

                {/* Subtle Support Link */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-500">
                    <span>Need help? Contact support: </span>
                    <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="font-bold text-slate-800 hover:text-sky-500 transition-colors underline underline-offset-2 decoration-sky-300 hover:decoration-sky-500 break-all"
                    >
                        {SUPPORT_EMAIL}
                    </a>
                </div>
            </div>
        </AuthShell>
    );
}