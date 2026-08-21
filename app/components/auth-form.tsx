"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/app/auth-client";

export default function AuthForm({ mode, googleConfigured = false }: { mode: "login" | "signup"; googleConfigured?: boolean }) {
    const isSignup = mode === "signup";
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [pending, setPending] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [googleMessage, setGoogleMessage] = useState("");
    const router = useRouter();

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email address.");
        if (password.length < 8) return setError("Password must be at least 8 characters.");
        if (isSignup && password !== confirmPassword) return setError("Passwords do not match.");
        if (isSignup && !agreed) return setError("Please agree to the Terms of Service and Privacy Policy.");
        setPending(true);
        try {
            const result = isSignup
                ? await authClient.signUp.email({ name, email, password })
                : await authClient.signIn.email({ email, password });
            if (result.error) throw new Error(isSignup ? "Unable to create your account right now. Please try again." : "Email or password is incorrect.");
            setSuccess(isSignup ? "Your account is ready." : "You are signed in.");
            router.push("/account");
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Unable to complete this request right now. Please try again.");
        } finally {
            setPending(false);
        }
    };

    const signInWithGoogle = async () => {
        setGoogleMessage("");
        if (!googleConfigured) {
            setGoogleMessage("Google sign-in is currently unavailable. Please use email and password.");
            return;
        }
        setPending(true);
        const result = await authClient.signIn.social({ provider: "google", callbackURL: "/account" });
        if (result.error) {
            setGoogleMessage("Google sign-in is currently unavailable. Please try again later.");
            setPending(false);
        }
    };

    return (
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {isSignup && <div><label htmlFor="name" className="text-sm font-semibold text-slate-700">Name</label><input id="name" required value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" /></div>}
            <div><label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" /></div>
            <div><label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label><div className="mt-1.5 flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-200"><input id="password" type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} required value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 px-4 py-2.5 text-slate-900 outline-none" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="border-l border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">{showPassword ? "Hide" : "Show"}</button></div></div>
            {isSignup && <div><label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700">Confirm password</label><input id="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" /></div>}
            {isSignup && <label className="flex items-start gap-3 text-sm leading-5 text-slate-700"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" /> <span>By creating an account, you agree to our <Link href="/terms" className="font-semibold text-sky-700 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="font-semibold text-sky-700 hover:underline">Privacy Policy</Link>.</span></label>}
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
            <button type="submit" disabled={pending} className="w-full rounded-xl bg-sky-500 px-5 py-2.5 font-semibold text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-wait disabled:bg-slate-400">{pending ? (isSignup ? "Creating account..." : "Signing in...") : (isSignup ? "Create account" : "Log in")}</button>
            {!isSignup && <Link href="/forgot-password" className="block text-center text-sm font-medium text-sky-700 hover:underline">Forgot password?</Link>}
            {!isSignup && googleConfigured && <><div className="flex items-center gap-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-500"><span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" /></div><button type="button" onClick={() => void signInWithGoogle()} disabled={pending} aria-label="Continue with Google" className="relative flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-wait disabled:opacity-60"><svg className="absolute left-4 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z" /><path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.7Z" /><path fill="#FBBC05" d="M6.54 13.79a5.86 5.86 0 0 1 0-3.58V7.68H3.3a9.74 9.74 0 0 0 0 8.64l3.24-2.53Z" /><path fill="#EA4335" d="M12 6.18c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.27 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 7.9 9.46 6.18 12 6.18Z" /></svg><span>Continue with Google</span></button>{googleMessage && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{googleMessage}</p>}</>}
        </form>
    );
}