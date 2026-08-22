"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "../components/site-header";
import ProfileAvatar from "../components/profile-avatar";
import { authClient } from "../auth-client";
import { PLANS, PlanId } from "@/lib/plans";

interface UserUsageData {
  plan: PlanId;
  planName: string;
  credits: number;
  creditsResetAt: number;
  subscriptionStatus: string;
}

export default function AccountPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [usage, setUsage] = useState<UserUsageData | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/user/credits")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setUsage(data);
        })
        .catch(() => {});
    }
  }, [session]);

  if (isPending || !session) {
    return (
      <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            <span>Loading account...</span>
          </div>
        </div>
      </main>
    );
  }

  const user = session.user;
  const planId = usage?.plan || "free";
  const planConfig = PLANS[planId] || PLANS.free;
  const credits = usage ? usage.credits : planConfig.starterCredits;
  const resetDateString = usage?.creditsResetAt
    ? new Date(usage.creditsResetAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Every 30 days";

  const handleLogout = async () => {
    setSigningOut(true);
    await authClient.signOut();
    router.replace("/");
  };

  return (
    <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
      <SiteHeader />

      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10 flex-1">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline">
            ← Back to tools
          </Link>
          <span className="text-xs text-slate-400">Account Dashboard</span>
        </div>

        {/* User Profile Card Header */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ProfileAvatar name={user.name} email={user.email} image={user.image} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {user.name || "Filevera User"}
                  </h1>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Active
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/pricing"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-sky-500 px-4 text-xs font-semibold text-white hover:bg-sky-600 transition-colors shadow-2xs"
              >
                Upgrade Plan
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {signingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* 1. Plan & Subscription Section */}
          <section id="plan" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Plan & Subscription</h2>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                {planConfig.name} Plan
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Tier:</span>
                <span className="font-semibold text-slate-900">{planConfig.name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Price:</span>
                <span className="font-semibold text-slate-900">{planConfig.price} {planConfig.period}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Max PDF Upload:</span>
                <span className="font-semibold text-slate-900">{planConfig.maxPdfSizeMB} MB</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Max Image Upload:</span>
                <span className="font-semibold text-slate-900">{planConfig.maxImageSizeMB} MB</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <Link
                href="/pricing"
                className="block text-center text-xs font-semibold text-sky-600 hover:underline"
              >
                View all plans & features →
              </Link>
            </div>
          </section>

          {/* 2. Usage & Credits Section */}
          <section id="usage" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Usage & Credits</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                Monthly Cycle
              </span>
            </div>

            <div className="mt-4">
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <p className="text-[11px] font-medium text-slate-500">Credits Remaining</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{credits}</p>
                <p className="mt-1 text-[11px] text-slate-500">Next renewal date: {resetDateString}</p>
              </div>

              <div className="mt-3.5 space-y-1.5 text-[11px] text-slate-500">
                <p>• Standard tool operation: 1 credit</p>
                <p>• Batch operations: 1 credit per file</p>
                <p>• Unused credits do not roll over past renewal</p>
              </div>
            </div>
          </section>

          {/* 3. Profile & Identity Section */}
          <section id="profile" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Profile & Identity</h2>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="block text-[11px] font-medium text-slate-500">Display Name</span>
                <span className="mt-0.5 block font-semibold text-slate-900">{user.name || "Not specified"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-slate-500">Account Email</span>
                <span className="mt-0.5 block font-semibold text-slate-900 truncate">{user.email}</span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-slate-500">Authentication Source</span>
                <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                  {user.image ? "Google OAuth" : "Email & Password"}
                </span>
              </div>
            </div>
          </section>

          {/* 4. Settings & Security Section */}
          <section id="settings" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Settings & Privacy</h2>
              </div>

              <div className="mt-4 space-y-2.5 text-xs text-slate-600">
                <p>All file uploads and processing jobs are encrypted and permanently deleted upon completion.</p>
                <div className="flex items-center gap-3 pt-2">
                  <Link href="/privacy" className="text-xs font-semibold text-sky-600 hover:underline">
                    Privacy Policy
                  </Link>
                  <span>•</span>
                  <Link href="/terms" className="text-xs font-semibold text-sky-600 hover:underline">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className="w-full rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
              >
                Log out of all sessions
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}