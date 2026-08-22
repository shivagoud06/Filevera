"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "../components/site-header";
import { PLANS, PlanId } from "@/lib/plans";
import { authClient } from "../auth-client";

export default function PricingPage() {
  const { data: session } = authClient.useSession();
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetch("/api/user/credits")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.plan) {
            setCurrentPlan(data.plan as PlanId);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const handleUpgradeClick = (planId: PlanId) => {
    if (planId === currentPlan) return;
    if (planId === "free") {
      setUpgradeNotice("You are already on the Free tier.");
      return;
    }
    setUpgradeNotice(
      `Stripe checkout for ${PLANS[planId].name} is coming soon. During our beta launch, all accounts enjoy starter credits!`
    );
  };

  return (
    <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
      <SiteHeader />

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 flex-1">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 shadow-2xs">
            Transparent Plans
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Simple, fair pricing for <span className="text-sky-500">every workload</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Start for free with zero credit card required. Upgrade anytime for higher limits and priority server slots.
          </p>
        </div>

        {upgradeNotice && (
          <div className="mt-6 mx-auto max-w-2xl rounded-xl border border-sky-200 bg-sky-50 p-4 text-center text-xs sm:text-sm text-sky-900 shadow-2xs">
            <p className="font-semibold">{upgradeNotice}</p>
            <button
              type="button"
              onClick={() => setUpgradeNotice(null)}
              className="mt-2 text-xs text-sky-700 underline hover:text-sky-950"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 3 Plan Cards */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 items-stretch">
          {/* 1. FREE PLAN */}
          <div
            className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-2xs ${
              currentPlan === "free" && session ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{PLANS.free.name}</h2>
                {currentPlan === "free" && session && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-4">{PLANS.free.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">{PLANS.free.price}</span>
                <span className="text-xs text-slate-500 font-medium">/{PLANS.free.period}</span>
              </div>

              <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-700">
                {PLANS.free.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-2">
              <Link
                href={session ? "/" : "/signup"}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                {session ? "Start Processing" : "Sign Up Free"}
              </Link>
            </div>
          </div>

          {/* 2. PRO PLAN (Popular) */}
          <div
            className={`relative flex flex-col justify-between rounded-2xl border-2 bg-white p-6 shadow-md ${
              currentPlan === "pro" && session ? "border-sky-500 ring-2 ring-sky-200" : "border-sky-500"
            }`}
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-sky-500 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-2xs">
                Recommended
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{PLANS.pro.name}</h2>
                {currentPlan === "pro" && session && (
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-4">{PLANS.pro.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">{PLANS.pro.price}</span>
                <span className="text-xs text-slate-500 font-medium">{PLANS.pro.period}</span>
              </div>

              <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-700">
                {PLANS.pro.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-2">
              <button
                type="button"
                onClick={() => handleUpgradeClick("pro")}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-sky-500 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {currentPlan === "pro" ? "Current Plan" : "Upgrade to Pro"}
              </button>
            </div>
          </div>

          {/* 3. PRO PLUS PLAN */}
          <div
            className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-2xs ${
              currentPlan === "pro_plus" && session ? "border-sky-500 ring-2 ring-sky-200" : "border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{PLANS.pro_plus.name}</h2>
                {currentPlan === "pro_plus" && session && (
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-4">{PLANS.pro_plus.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">{PLANS.pro_plus.price}</span>
                <span className="text-xs text-slate-500 font-medium">{PLANS.pro_plus.period}</span>
              </div>

              <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-700">
                {PLANS.pro_plus.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-2">
              <button
                type="button"
                onClick={() => handleUpgradeClick("pro_plus")}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {currentPlan === "pro_plus" ? "Current Plan" : "Upgrade to Pro Plus"}
              </button>
            </div>
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <section className="mt-14" aria-labelledby="comparison-title">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 id="comparison-title" className="text-xl sm:text-2xl font-bold text-slate-900">
              Detailed Plan Comparison
            </h2>
            <p className="mt-1 text-xs text-slate-500">Every feature side-by-side</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-3.5 sm:p-4 font-bold text-slate-900">Feature</th>
                  <th className="p-3.5 sm:p-4 font-bold text-slate-900">Free</th>
                  <th className="p-3.5 sm:p-4 font-bold text-sky-600">Pro</th>
                  <th className="p-3.5 sm:p-4 font-bold text-slate-900">Pro Plus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Starter Credits</td>
                  <td className="p-3.5 sm:p-4">100</td>
                  <td className="p-3.5 sm:p-4 font-semibold text-sky-600">1,000</td>
                  <td className="p-3.5 sm:p-4 font-semibold">5,000</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Monthly Renewal Credits</td>
                  <td className="p-3.5 sm:p-4">50</td>
                  <td className="p-3.5 sm:p-4 font-semibold text-sky-600">1,000</td>
                  <td className="p-3.5 sm:p-4 font-semibold">5,000</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Max PDF File Size</td>
                  <td className="p-3.5 sm:p-4">25 MB</td>
                  <td className="p-3.5 sm:p-4">100 MB</td>
                  <td className="p-3.5 sm:p-4">250 MB</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Max Image Size</td>
                  <td className="p-3.5 sm:p-4">10 MB</td>
                  <td className="p-3.5 sm:p-4">30 MB</td>
                  <td className="p-3.5 sm:p-4">50 MB</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Batch File Uploads</td>
                  <td className="p-3.5 sm:p-4">Up to 10 files</td>
                  <td className="p-3.5 sm:p-4 font-medium text-sky-600">Up to 30 files</td>
                  <td className="p-3.5 sm:p-4 font-medium">Up to 50 files</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Priority Server Slots</td>
                  <td className="p-3.5 sm:p-4 text-slate-400">Standard</td>
                  <td className="p-3.5 sm:p-4 text-emerald-600 font-semibold">✓ Priority</td>
                  <td className="p-3.5 sm:p-4 text-emerald-600 font-semibold">✓ Highest VIP</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Support Channel</td>
                  <td className="p-3.5 sm:p-4">Community</td>
                  <td className="p-3.5 sm:p-4">Priority Email</td>
                  <td className="p-3.5 sm:p-4">Dedicated Support</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing FAQs */}
        <section className="mt-14 mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xs">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 text-center">
            Frequently Asked Questions
          </h2>
          <div className="mt-5 space-y-4 text-xs sm:text-sm text-slate-700">
            <div>
              <h3 className="font-semibold text-slate-900">How do credits work?</h3>
              <p className="mt-1 text-slate-500 leading-5">
                Every file operation (such as compressing a PDF or resizing an image) uses 1 credit. Batch operations consume 1 credit per file.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Can I still use tools without an account?</h3>
              <p className="mt-1 text-slate-500 leading-5">
                Yes! Anonymous visitors can use all basic tools without creating an account or logging in.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">When do credits reset?</h3>
              <p className="mt-1 text-slate-500 leading-5">
                Credits automatically renew every 30 days from your sign-up date.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
