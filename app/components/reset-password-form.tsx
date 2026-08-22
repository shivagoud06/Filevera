"use client";

import { FormEvent, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/app/auth-client";

export default function ResetPasswordForm() {
    const params = useSearchParams();
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        if (password.length < 8) return setError("Password must be at least 8 characters.");
        if (password !== confirm) return setError("Passwords do not match.");
        setPending(true);
        try {
            const result = await authClient.resetPassword({ newPassword: password, token: params.get("token") ?? undefined });
            if (result.error) throw new Error("This reset link is invalid or has expired.");
            router.push("/login");
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
        } finally {
            setPending(false);
        }
    };

    return (
        <form onSubmit={submit} className="mt-4 space-y-3.5">
            <div>
                <label htmlFor="new-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">New password</label>
                <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-1 h-10 sm:h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
            </div>
            <div>
                <label htmlFor="confirm-new-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Confirm password</label>
                <input
                    id="confirm-new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    className="mt-1 h-10 sm:h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
            </div>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}
            <button
                type="submit"
                disabled={pending}
                className="h-10 sm:h-11 w-full rounded-xl bg-sky-500 px-4 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-wait disabled:bg-slate-400"
            >
                {pending ? "Resetting password..." : "Reset password"}
            </button>
        </form>
    );
}