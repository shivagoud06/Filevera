"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "../components/site-header";
import ProfileAvatar from "../components/profile-avatar";
import { authClient } from "../auth-client";
import { PLANS, PlanId } from "@/lib/plans";
import { OPERATION_COSTS, OPERATION_LABELS, OperationType } from "@/lib/credit-constants";

interface CreditUsageHistoryItem {
  id: string;
  operation: string;
  operationLabel: string;
  creditsUsed: number;
  balanceAfter: number;
  createdAt: number;
}

interface UserUsageData {
  plan: PlanId;
  planName: string;
  credits: number;
  creditsResetAt: number;
  subscriptionStatus: string;
  hasStripeCustomer?: boolean;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number | null;
  billingInterval?: string;
  monthlyAllowance?: number;
  creditsUsedThisCycle?: number;
  recentUsage?: CreditUsageHistoryItem[];
}

export default function AccountPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
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
  const isPaidUser = planId === "pro" || planId === "pro_plus";
  const planConfig = PLANS[planId] || PLANS.free;
  const credits = usage ? usage.credits : planConfig.starterCredits;
  const allowance = usage?.monthlyAllowance || planConfig.monthlyCredits;
  const creditsUsed = usage?.creditsUsedThisCycle ?? Math.max(0, allowance - credits);
  const subStatus = usage?.subscriptionStatus || "active";

  const nextRenewalTimestamp = usage?.currentPeriodEnd || usage?.creditsResetAt;
  const resetDateString = nextRenewalTimestamp
    ? new Date(nextRenewalTimestamp).toLocaleDateString(undefined, {
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

  const handleManageSubscription = async () => {
    setPortalError(null);
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/customer-portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setPortalError(data.error || "Unable to open Stripe customer billing portal.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setPortalError("Network error while connecting to billing portal.");
    } finally {
      setLoadingPortal(false);
    }
  };

  const costEntries = Object.entries(OPERATION_COSTS) as [OperationType, number][];

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

        {/* Payment/Status Alerts */}
        {subStatus === "past_due" && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-900 shadow-2xs">
            <p className="font-bold">Payment Past Due</p>
            <p className="mt-0.5 text-xs text-red-700">
              Your latest subscription renewal payment could not be processed. Please update your payment method to keep paid benefits active.
            </p>
            {usage?.hasStripeCustomer && (
              <button
                type="button"
                onClick={handleManageSubscription}
                disabled={loadingPortal}
                className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Update Payment Method
              </button>
            )}
          </div>
        )}

        {usage?.cancelAtPeriodEnd && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-900 shadow-2xs">
            <p className="font-semibold">Cancellation Scheduled</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Your subscription is scheduled to end on {resetDateString}. Your paid benefits will remain active until then.
            </p>
          </div>
        )}

        {portalError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 shadow-2xs">
            <p className="font-semibold">{portalError}</p>
            <button
              type="button"
              onClick={() => setPortalError(null)}
              className="mt-1 text-xs text-red-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}

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
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isPaidUser ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {planConfig.name} Plan
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isPaidUser ? (
                <button
                  type="button"
                  onClick={handleManageSubscription}
                  disabled={loadingPortal}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
                >
                  {loadingPortal ? "Opening portal..." : "Manage Subscription"}
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-sky-500 px-4 text-xs font-semibold text-white hover:bg-sky-600 transition-colors shadow-2xs"
                >
                  Upgrade Plan
                </Link>
              )}
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
          <section id="plan" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Plan & Subscription</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  isPaidUser ? "bg-purple-100 text-purple-800" : "bg-sky-100 text-sky-800"
                }`}>
                  {planConfig.name} Plan
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Current Tier:</span>
                  <span className="font-semibold text-slate-900">{planConfig.name}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Price / Billing:</span>
                  <span className="font-semibold text-slate-900">
                    {planId === "pro_plus" ? "₹1,788/year" : planId === "pro" ? "₹149/month" : "₹0 Forever"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Status:</span>
                  <span className={`font-semibold capitalize ${
                    subStatus === "active" ? "text-emerald-700" : "text-amber-700"
                  }`}>
                    {subStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Max PDF Upload:</span>
                  <span className="font-semibold text-slate-900">{planConfig.maxPdfSizeMB} MB</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Max Image Upload:</span>
                  <span className="font-semibold text-slate-900">{planConfig.maxImageSizeMB} MB</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Batch Processing:</span>
                  <span className="font-semibold text-slate-900">Up to {planConfig.maxBatchCount} files</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              {isPaidUser ? (
                <button
                  type="button"
                  onClick={handleManageSubscription}
                  disabled={loadingPortal}
                  className="text-xs font-semibold text-sky-600 hover:underline"
                >
                  Manage billing & invoices →
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="text-xs font-semibold text-sky-600 hover:underline"
                >
                  View upgrade options →
                </Link>
              )}
            </div>
          </section>

          {/* 2. Usage & Credits Summary Section */}
          <section id="usage" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Usage & Credits</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                  Monthly Cycle
                </span>
              </div>

              <div className="mt-4">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Credits Remaining</p>
                      <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">{credits}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium text-slate-500">Monthly Allowance</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">{credits} / {allowance}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-between text-[11px] text-slate-600">
                    <span>{creditsUsed} credits used this cycle</span>
                    <span>Next reset: {resetDateString}</span>
                  </div>
                </div>

                <div className="mt-3.5 space-y-1 text-[11px] text-slate-500">
                  <p>• Credits refresh automatically every 30 days / billing cycle.</p>
                  <p>• Unused credits do not roll over past renewal.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href="/pricing"
                className="text-xs font-semibold text-sky-600 hover:underline inline-flex items-center gap-1"
              >
                Need more credits? Upgrade plan →
              </Link>
            </div>
          </section>
        </div>

        {/* Recent Usage History */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Usage History</h2>
              <p className="text-xs text-slate-500">Your recent file operations and credit activity</p>
            </div>
            <span className="text-xs font-medium text-slate-400">PostgreSQL Log</span>
          </div>

          {usage?.recentUsage && usage.recentUsage.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                    <th className="p-2.5 sm:p-3 font-semibold">Date</th>
                    <th className="p-2.5 sm:p-3 font-semibold">Operation</th>
                    <th className="p-2.5 sm:p-3 font-semibold text-right">Credits Used</th>
                    <th className="p-2.5 sm:p-3 font-semibold text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {usage.recentUsage.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 sm:p-3 whitespace-nowrap text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-2.5 sm:p-3 font-medium text-slate-900">
                        {item.operationLabel || item.operation}
                      </td>
                      <td className="p-2.5 sm:p-3 text-right font-semibold text-amber-700">
                        -{item.creditsUsed}
                      </td>
                      <td className="p-2.5 sm:p-3 text-right text-slate-900 font-medium">
                        {item.balanceAfter}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500">
              <p className="font-semibold text-slate-700">No operations processed yet</p>
              <p className="mt-1">When you compress, merge, or convert files, your usage log will appear here.</p>
              <Link
                href="/"
                className="mt-3 inline-block rounded-xl bg-sky-500 px-3 py-1.5 font-semibold text-white hover:bg-sky-600"
              >
                Browse Tools
              </Link>
            </div>
          )}
        </section>

        {/* Credit Costs Reference Table */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Operation Credit Costs</h2>
            <p className="text-xs text-slate-500">Standard server credit deduction schedule per operation</p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {costEntries.map(([opKey, cost]) => (
              <div key={opKey} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs">
                <span className="font-medium text-slate-700">{OPERATION_LABELS[opKey]}</span>
                <span className="rounded-lg bg-sky-100 px-2 py-0.5 font-bold text-sky-800 text-[11px]">
                  {cost} credits
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Profile, Identity & Settings */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Profile & Identity Section */}
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

          {/* Settings & Privacy Section */}
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
                  <span>•</span>
                  <Link href="/support" className="text-xs font-semibold text-sky-600 hover:underline">
                    Support
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