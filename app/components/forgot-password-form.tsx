"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/app/auth-client";

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);
    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email address.");
        setPending(true);
        try {
            const result = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
            if (result.error) throw new Error("Unable to send a reset link right now. Please try again later.");
            setMessage("If an account exists for this email, you'll receive a reset link.");
        } catch (caught) { setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again."); } finally { setPending(false); }
    };
    return <form onSubmit={submit} className="mt-7 space-y-5" noValidate><div><label htmlFor="reset-email" className="text-sm font-semibold">Email</label><input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500" /></div>{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}{message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}<button type="submit" disabled={pending} className="w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:bg-slate-400">{pending ? "Sending reset link..." : "Send reset link"}</button></form>;
}