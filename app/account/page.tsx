"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../auth-client";

export default function AccountPage() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const [signingOut, setSigningOut] = useState(false);
    useEffect(() => { if (!isPending && !session) router.replace("/login"); }, [isPending, session, router]);
    if (isPending || !session) return <main className="flex min-h-[calc(100vh-160px)] items-center justify-center bg-slate-50 px-5"><p className="text-sm text-slate-600">Loading account...</p></main>;
    const logout = async () => { setSigningOut(true); await authClient.signOut(); router.replace("/"); };
    return <main className="min-h-[calc(100vh-160px)] bg-slate-50 px-5 py-12 sm:px-8"><div className="mx-auto max-w-2xl"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Account</p><h1 className="mt-3 text-3xl font-bold">Your File Tools account</h1><dl className="mt-8 divide-y divide-slate-100"><div className="flex justify-between gap-4 py-4"><dt className="text-sm text-slate-500">Email</dt><dd className="text-right text-sm font-semibold">{session.user.email}</dd></div><div className="flex justify-between gap-4 py-4"><dt className="text-sm text-slate-500">Plan</dt><dd className="text-right text-sm font-semibold">Free</dd></div><div className="flex justify-between gap-4 py-4"><dt className="text-sm text-slate-500">Status</dt><dd className="text-right text-sm font-semibold text-emerald-700">Active</dd></div></dl><button type="button" onClick={logout} disabled={signingOut} className="mt-6 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">{signingOut ? "Signing out..." : "Log out"}</button></div></div></main>;
}