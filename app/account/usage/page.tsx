"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "../../components/site-header";
import ProfileAvatar from "../../components/profile-avatar";
import { authClient } from "../../auth-client";
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
  subscriptionId?: string | null;
  provider?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number | null;
  billingInterval?: string;
  monthlyAllowance?: number;
  creditsUsedThisCycle?: number;
  recentUsage?: CreditUsageHistoryItem[];
}

function AccountUsageContent() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
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
            <span>Loading usage & credits...</span>
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

  const nextRenewalTimestamp = usage?.currentPeriodEnd || usage?.creditsResetAt;
  const resetDateString = nextRenewalTimestamp
    ? new Date(nextRenewalTimestamp).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Every 30 days";

  const costEntries = Object.entries(OPERATION_COSTS) as [OperationType, number][];

  return (
    <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
      <SiteHeader />

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 flex-1">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Link href="/account" className="text-xs font-semibold text-sky-600 hover:underline">
              ← Account Overview
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-medium text-slate-500">Usage & Credits</span>
          </div>
          <span className="text-xs text-slate-400">Monthly Allowance</span>
        </div>

        {/* Header Profile Summary */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ProfileAvatar name={user.name} email={user.email} image={user.image} size="lg" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Usage & Processing Credits
                  </h1>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    isPaidUser ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {planId === "pro_plus" ? "PRO PLUS" : planId === "pro" ? "PRO PLAN" : "FREE PLAN"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            <Link
              href="/pricing"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-sky-500 px-4 text-xs font-bold text-white hover:bg-sky-600 transition-colors shadow-2xs"
            >
              Get More Credits
            </Link>
          </div>
        </div>

        {/* Credits Balance Summary */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Current Balance & Allocation</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
              Active Cycle
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-[11px] font-medium text-slate-500">Remaining Credits</p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">{credits.toLocaleString()}</p>
              <p className="mt-1 text-[10px] text-emerald-700 font-semibold">Ready to use</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-[11px] font-medium text-slate-500">Monthly Allowance</p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-700">{allowance.toLocaleString()}</p>
              <p className="mt-1 text-[10px] text-slate-500">Total per billing cycle</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-[11px] font-medium text-slate-500">Credits Used This Cycle</p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-amber-700">{creditsUsed.toLocaleString()}</p>
              <p className="mt-1 text-[10px] text-slate-500">Resets on {resetDateString}</p>
            </div>
          </div>
        </div>

        {/* Recent Usage History Table */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Usage Activity</h2>
              <p className="text-xs text-slate-500">Live transaction records from PostgreSQL</p>
            </div>
            <span className="text-xs font-medium text-slate-400">Database Log</span>
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
            <p className="text-xs text-slate-500">Credit deduction per processed document or image</p>
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
    </main>
  );
}

export default function AccountUsagePage() {
  return (
    <Suspense
      fallback={
        <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center p-8">
            <span className="text-xs text-slate-500">Loading usage...</span>
          </div>
        </main>
      }
    >
      <AccountUsageContent />
    </Suspense>
  );
}
