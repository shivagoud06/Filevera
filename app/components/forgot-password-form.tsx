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
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
        } finally {
            setPending(false);
        }
    };

    return (
        <form onSubmit={submit} className="mt-4 space-y-3.5" noValidate>
            <div>
                <label htmlFor="reset-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Email</label>
                <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1 h-10 sm:h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
            </div>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}
            {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">{message}</p>}
            <button
                type="submit"
                disabled={pending}
                className="h-10 sm:h-11 w-full rounded-xl bg-sky-500 px-4 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-wait disabled:bg-slate-400"
            >
                {pending ? "Sending reset link..." : "Send reset link"}
            </button>
        </form>
    );
}