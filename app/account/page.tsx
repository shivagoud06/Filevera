"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "../components/site-header";
import { authClient } from "../auth-client";

export default function AccountPage() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        if (!isPending && !session) router.replace("/login");
    }, [isPending, session, router]);

    if (isPending || !session) {
        return (
            <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
                <SiteHeader />
                <div className="flex flex-1 items-center justify-center p-8">
                    <p className="text-xs sm:text-sm text-slate-500">Loading account...</p>
                </div>
            </main>
        );
    }

    const logout = async () => {
        setSigningOut(true);
        await authClient.signOut();
        router.replace("/");
    };

    return (
        <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
            <SiteHeader />
            <div className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-8">
                <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline">
                    ← Back to tools
                </Link>
                <div className="mt-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
                    <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                        Account Settings
                    </span>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Your Filevera Account</h1>
                    <p className="mt-1 text-xs text-slate-500">Manage your credentials and view account status.</p>

                    <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50 px-4">
                        <div className="flex justify-between items-center py-3 text-xs sm:text-sm">
                            <dt className="text-slate-500">Email address</dt>
                            <dd className="font-semibold text-slate-900 truncate max-w-[220px]">{session.user.email}</dd>
                        </div>
                        <div className="flex justify-between items-center py-3 text-xs sm:text-sm">
                            <dt className="text-slate-500">Account tier</dt>
                            <dd className="font-semibold text-slate-900">Free Tier</dd>
                        </div>
                        <div className="flex justify-between items-center py-3 text-xs sm:text-sm">
                            <dt className="text-slate-500">Status</dt>
                            <dd className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
                            </dd>
                        </div>
                    </dl>

                    <div className="mt-5 flex items-center justify-between pt-2">
                        <button
                            type="button"
                            onClick={logout}
                            disabled={signingOut}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            {signingOut ? "Signing out..." : "Log out"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}