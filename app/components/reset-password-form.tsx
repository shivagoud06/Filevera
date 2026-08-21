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
        } catch (caught) { setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again."); } finally { setPending(false); }
    };
    return <form onSubmit={submit} className="mt-7 space-y-5"><div><label htmlFor="new-password" className="text-sm font-semibold">New password</label><input id="new-password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500" /></div><div><label htmlFor="confirm-new-password" className="text-sm font-semibold">Confirm password</label><input id="confirm-new-password" type="password" autoComplete="new-password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500" /></div>{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}<button type="submit" disabled={pending} className="w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:bg-slate-400">{pending ? "Resetting password..." : "Reset password"}</button></form>;
}