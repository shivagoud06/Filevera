import Link from "next/link";
import AuthForm from "./auth-form";
import AuthShell from "./auth-shell";

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
                <AuthForm mode={mode} googleConfigured={googleConfigured} />
                <p className="mt-4 text-center text-xs text-slate-600">
                    {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                    <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-sky-600 hover:underline">
                        {isSignup ? "Log in" : "Sign up"}
                    </Link>
                </p>
            </div>
        </AuthShell>
    );
}