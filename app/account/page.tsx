"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "../components/site-header";
import ProfileAvatar from "../components/profile-avatar";
import { authClient } from "../auth-client";
import { PLANS, PlanId } from "@/lib/plans";
import { OPERATION_COSTS, OPERATION_LABELS, OperationType } from "@/lib/credit-constants";

interface UserUsageData {
  plan: PlanId;
  planName: string;
  credits: number;
  creditsResetAt: number;
  subscriptionStatus: string;
  subscriptionId?: string | null;
  provider?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number | null;
  billingInterval?: string;
  monthlyAllowance?: number;
  creditsUsedThisCycle?: number;
}

function AccountOverviewContent() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const [usage, setUsage] = useState<UserUsageData | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

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
    setLogoutModalOpen(false);
    await authClient.signOut();
    router.replace("/");
  };

  const handleConfirmCancel = async () => {
    setFeedbackError(null);
    setLoadingCancel(true);
    try {
      const res = await fetch("/api/payment/cancel-subscription", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackError(data.error || "Unable to cancel subscription.");
        return;
      }
      setCancelModalOpen(false);
      setFeedbackNotice("Subscription scheduled for cancellation at the end of the billing period.");
      setUsage((prev) => (prev ? { ...prev, cancelAtPeriodEnd: true } : prev));
    } catch {
      setFeedbackError("Network error while connecting to subscription service.");
    } finally {
      setLoadingCancel(false);
    }
  };

  const costEntries = Object.entries(OPERATION_COSTS) as [OperationType, number][];

  return (
    <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
      <SiteHeader />

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 flex-1">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs font-semibold text-sky-600 hover:underline">
              ← Back to tools
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-medium text-slate-500">Account Overview</span>
          </div>
          <span className="text-xs text-slate-400">Filevera SaaS</span>
        </div>

        {/* Feedback Alerts */}
        {feedbackNotice && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-900 shadow-2xs flex items-center justify-between animate-fade-in">
            <p className="font-semibold">{feedbackNotice}</p>
            <button
              type="button"
              onClick={() => setFeedbackNotice(null)}
              className="text-xs font-bold text-emerald-800 underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {usage?.cancelAtPeriodEnd && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-900 shadow-2xs">
            <p className="font-semibold">Cancellation Scheduled</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Your subscription is scheduled to end on {resetDateString}. Your paid benefits and remaining credits will remain active until then.
            </p>
          </div>
        )}

        {feedbackError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 shadow-2xs flex items-center justify-between">
            <p className="font-semibold">{feedbackError}</p>
            <button
              type="button"
              onClick={() => setFeedbackError(null)}
              className="text-xs text-red-700 underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* User Profile Header Card */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ProfileAvatar name={user.name} email={user.email} image={user.image} size="lg" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {user.name || "Filevera User"}
                  </h1>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    isPaidUser ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {planId === "pro_plus" ? "PRO PLUS" : planId === "pro" ? "PRO PLAN" : "FREE PLAN"}
                  </span>
                  {isPaidUser && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      ✓ Active
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {isPaidUser ? (
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Manage Subscription
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-sky-500 px-3.5 text-xs font-semibold text-white hover:bg-sky-600 transition-colors shadow-2xs"
                >
                  Upgrade Plan
                </Link>
              )}

              <button
                type="button"
                onClick={() => setLogoutModalOpen(true)}
                disabled={signingOut}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-red-50/70 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                Log out
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Overview Cards */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 animate-fade-in">
          {/* 1. Plan & Subscription Summary */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
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
                  <span className="font-semibold text-slate-900">
                    {planId === "pro_plus" ? "PRO PLUS" : planId === "pro" ? "PRO PLAN" : "FREE PLAN"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Price / Billing:</span>
                  <span className="font-semibold text-slate-900">
                    {planId === "pro_plus" ? "₹1,788/year" : planId === "pro" ? "₹149/month" : "₹0 Forever"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Monthly Allowance:</span>
                  <span className="font-semibold text-slate-900">{allowance.toLocaleString()} credits/month</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Status:</span>
                  <span className={`font-semibold capitalize ${
                    subStatus === "active" ? "text-emerald-700" : "text-amber-700"
                  }`}>
                    {subStatus === "active" ? "✓ Active" : subStatus}
                  </span>
                </div>
                {usage?.subscriptionId && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Reference ID:</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-800">{usage.subscriptionId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-600">
                  <span>Next Renewal:</span>
                  <span className="font-semibold text-slate-900">{resetDateString}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              {isPaidUser ? (
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                >
                  Manage / Cancel Subscription →
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

          {/* 2. Credits & Quick Links */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Credits Balance</h2>
                <Link href="/account/usage" className="text-xs font-semibold text-sky-600 hover:underline">
                  Full History →
                </Link>
              </div>

              <div className="mt-4">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Available Credits</p>
                      <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">{credits.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium text-slate-500">Cycle Allowance</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">{allowance.toLocaleString()} credits</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-between text-[11px] text-slate-600">
                    <span>Renewal Date: {resetDateString}</span>
                    <span className="text-emerald-700 font-semibold">Active</span>
                  </div>
                </div>

                <div className="mt-3.5 space-y-1 text-[11px] text-slate-500">
                  <p>• Credits refresh automatically every 30 days.</p>
                  <p>• Fast, private server processing for PDF & image tools.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/account/usage"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
              >
                View Usage Log
              </Link>
              <Link
                href="/account/settings"
                className="text-xs font-semibold text-sky-600 hover:underline"
              >
                Account Settings →
              </Link>
            </div>
          </section>
        </div>

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
      </div>

      {/* 1. Log Out Confirmation Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in" role="dialog">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl font-bold">
              🚪
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Log out of Filevera?</h3>
            <p className="mt-1.5 text-xs text-slate-600">
              You will need to sign in again to access your account, subscription, and credits.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 shadow-xs"
              >
                {signingOut ? "Logging out..." : "Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Cancel Subscription Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in" role="dialog">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Manage Subscription</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Are you sure you want to cancel your {planConfig.name} subscription? Your paid features and remaining credits will remain active until <strong>{resetDateString}</strong>. You will not be billed again after this period.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={loadingCancel}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep Plan
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={loadingCancel}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 shadow-xs"
              >
                {loadingCancel ? "Processing..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center p-8">
            <span className="text-xs text-slate-500">Loading account...</span>
          </div>
        </main>
      }
    >
      <AccountOverviewContent />
    </Suspense>
  );
}