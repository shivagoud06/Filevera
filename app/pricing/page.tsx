"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import SiteHeader from "../components/site-header";
import ProfileAvatar from "../components/profile-avatar";
import { PLANS, PlanId } from "@/lib/plans";
import { authClient } from "../auth-client";

interface UserUsageData {
  plan: PlanId;
  planName: string;
  credits: number;
  creditsResetAt: number;
  subscriptionStatus: string;
  isProIntroEligible?: boolean;
  isProPlusIntroEligible?: boolean;
}

function PricingContent() {
  const { data: session } = authClient.useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");
  const [isProIntro, setIsProIntro] = useState<boolean>(true);
  const [isProPlusIntro, setIsProPlusIntro] = useState<boolean>(true);

  const isSuccess = searchParams.get("success") === "true";
  const isCanceled = searchParams.get("canceled") === "true";
  const planQuery = searchParams.get("plan");

  const [checkoutPlan, setCheckoutPlan] = useState<"pro" | "pro_plus" | null>(() => {
    if (planQuery === "pro" || planQuery === "pro_plus") {
      return planQuery;
    }
    return null;
  });
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Fetch real user credits & subscription info
  useEffect(() => {
    if (session) {
      fetch("/api/user/credits")
        .then((res) => (res.ok ? res.json() : null))
        .then((data: UserUsageData | null) => {
          if (data) {
            if (data.plan) setCurrentPlan(data.plan);
            if (typeof data.isProIntroEligible === "boolean") {
              setIsProIntro(data.isProIntroEligible);
            }
            if (typeof data.isProPlusIntroEligible === "boolean") {
              setIsProPlusIntro(data.isProPlusIntroEligible);
            }
          }
        })
        .catch(() => {});
    }
  }, [session, isSuccess]);

  const handlePlanClick = (planId: PlanId) => {
    setCheckoutError(null);

    if (planId === "free") {
      if (!session) {
        router.push("/signup");
      } else {
        router.push("/");
      }
      return;
    }

    if (planId === currentPlan) {
      return;
    }

    if (!session) {
      router.push(`/login?redirect=/pricing?plan=${planId}`);
      return;
    }

    setCheckoutPlan(planId);
  };

  const handleProceedToStripe = async () => {
    if (!checkoutPlan) return;
    setCheckoutError(null);
    setIsSubmittingCheckout(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: checkoutPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "STRIPE_NOT_CONFIGURED" || data.code === "PRICE_ID_MISSING") {
          setCheckoutError(
            "Payment integration is implemented, but live payment testing requires Stripe configuration in deployment environment."
          );
        } else {
          setCheckoutError(data.error || "Unable to start checkout. Please try again or contact Filevera Support.");
        }
        setIsSubmittingCheckout(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError("Unable to start checkout. Please try again or contact Filevera Support.");
        setIsSubmittingCheckout(false);
      }
    } catch {
      setCheckoutError("Unable to start checkout. Please try again or contact Filevera Support.");
      setIsSubmittingCheckout(false);
    }
  };

  return (
    <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
      <SiteHeader />

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 flex-1">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 shadow-2xs">
            Simple & Honest Pricing
          </span>
          <h1 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Fair, transparent plans for <span className="text-sky-500">every workload</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Start for free with zero credit card required. Upgrade anytime for higher file limits, 5,000 monthly credits, and priority processing.
          </p>
        </div>

        {/* Success Banner */}
        {isSuccess && (
          <div className="mt-6 mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-xs sm:text-sm text-emerald-900 shadow-2xs animate-fade-in">
            <div className="flex items-center justify-center gap-2 font-bold text-emerald-800 text-sm sm:text-base">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200 text-xs text-emerald-900 font-bold">✓</span>
              <span>Payment Successful!</span>
            </div>
            <p className="mt-2 text-emerald-800 font-medium">
              Your Filevera subscription is now active. Your credits and upgraded file quotas have been provisioned.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-block rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
              >
                Go to Filevera
              </Link>
              <Link
                href="/account"
                className="inline-block rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                View Account Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Canceled Banner */}
        {isCanceled && (
          <div className="mt-6 mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-xs sm:text-sm text-amber-900 shadow-2xs">
            <p className="font-semibold">Payment cancelled</p>
            <p className="mt-0.5 text-xs text-amber-700">Your current plan has not changed. You can try upgrading whenever you are ready.</p>
            <button
              type="button"
              onClick={() => router.replace("/pricing")}
              className="mt-2.5 inline-block rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              Back to Pricing
            </button>
          </div>
        )}

        {/* 3 Professional Pricing Cards */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 items-stretch">
          {/* 1. FREE PLAN CARD */}
          <div
            className={`relative flex flex-col justify-between rounded-2xl border bg-white p-5 sm:p-6 shadow-2xs transition-all ${
              currentPlan === "free" && session ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">FREE</h2>
                {currentPlan === "free" && session && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-4">{PLANS.free.tagline}</p>

              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹0</span>
                  <span className="text-xs text-slate-500 font-medium">Forever</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Zero credit card required</p>
              </div>

              <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">✓</span>
                  <span>100 starter credits</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">✓</span>
                  <span>50 monthly renewal credits</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">✓</span>
                  <span>25MB PDF limit</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">✓</span>
                  <span>10MB image limit</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">✓</span>
                  <span>Up to 10 batch files</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">✓</span>
                  <span>Standard processing</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-2">
              <button
                type="button"
                onClick={() => handlePlanClick("free")}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                {currentPlan === "free" && session ? "Current Plan" : "Get Started"}
              </button>
            </div>
          </div>

          {/* 2. PRO PLAN CARD */}
          <div
            className={`relative flex flex-col justify-between rounded-2xl border-2 bg-white p-5 sm:p-6 shadow-md transition-all ${
              currentPlan === "pro" && session ? "border-sky-500 ring-2 ring-sky-200" : "border-sky-500"
            }`}
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-sky-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
                Recommended
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">PRO</h2>
                {currentPlan === "pro" && session && (
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-4">{PLANS.pro.tagline}</p>

              <div className="mt-4">
                {isProIntro ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-400 line-through font-medium">₹149/month</span>
                      <span className="text-3xl font-black text-slate-900">₹99</span>
                      <span className="text-xs text-slate-500 font-medium">First month</span>
                    </div>
                    <p className="text-[11px] text-sky-700 font-medium mt-0.5">
                      After the first month: ₹149/month
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">₹149</span>
                      <span className="text-xs text-slate-500 font-medium">/month</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Standard monthly billing</p>
                  </>
                )}
              </div>

              <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">✓</span>
                  <span className="font-semibold text-slate-900">1,000 monthly credits</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">✓</span>
                  <span>100MB PDF upload</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">✓</span>
                  <span>30MB image upload</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">✓</span>
                  <span>Up to 30 batch files</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">✓</span>
                  <span>Priority processing</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">✓</span>
                  <span>Faster server allocation</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-2">
              <button
                type="button"
                disabled={currentPlan === "pro" && Boolean(session)}
                onClick={() => handlePlanClick("pro")}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-sky-500 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {currentPlan === "pro" && session ? "Current Plan" : "Get Pro"}
              </button>
            </div>
          </div>

          {/* 3. PRO PLUS PLAN CARD */}
          <div
            className={`relative flex flex-col justify-between rounded-2xl border bg-white p-5 sm:p-6 shadow-2xs transition-all ${
              currentPlan === "pro_plus" && session ? "border-purple-500 ring-2 ring-purple-200" : "border-slate-200"
            }`}
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-purple-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
                Best Value
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">PRO PLUS</h2>
                {currentPlan === "pro_plus" && session && (
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-800">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-4">{PLANS.pro_plus.tagline}</p>

              <div className="mt-4">
                {isProPlusIntro ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-400 line-through font-medium">Regular: ₹1,788/year</span>
                      <span className="text-3xl font-black text-slate-900">₹1,499</span>
                      <span className="text-xs text-slate-500 font-medium">First year</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        Savings: ₹289
                      </span>
                      <span className="text-[11px] text-slate-500">~₹125/mo equivalent</span>
                    </div>
                    <p className="text-[11px] text-purple-700 font-medium mt-1">
                      After the first year: ₹1,788/year
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">₹1,788</span>
                      <span className="text-xs text-slate-500 font-medium">/year</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">₹149/month billed annually</p>
                  </>
                )}
              </div>

              <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">✓</span>
                  <span className="font-semibold text-slate-900">5,000 monthly credits</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">✓</span>
                  <span>250MB PDF upload</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">✓</span>
                  <span>50MB image upload</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">✓</span>
                  <span>Up to 50 batch files</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">✓</span>
                  <span>Priority processing</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">✓</span>
                  <span>VIP support</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">✓</span>
                  <span>Higher usage limits</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-2">
              <button
                type="button"
                disabled={currentPlan === "pro_plus" && Boolean(session)}
                onClick={() => handlePlanClick("pro_plus")}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {currentPlan === "pro_plus" && session ? "Current Plan" : "Get Pro Plus"}
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
            <p className="mt-1 text-xs text-slate-500">Every feature and quota side-by-side</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-3.5 sm:p-4 font-bold text-slate-900">Feature</th>
                  <th className="p-3.5 sm:p-4 font-bold text-slate-900">Free</th>
                  <th className="p-3.5 sm:p-4 font-bold text-sky-600">Pro</th>
                  <th className="p-3.5 sm:p-4 font-bold text-purple-700">Pro Plus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Introductory Price</td>
                  <td className="p-3.5 sm:p-4 font-semibold">₹0</td>
                  <td className="p-3.5 sm:p-4 font-semibold text-sky-600">₹99 first mo</td>
                  <td className="p-3.5 sm:p-4 font-semibold text-purple-700">₹1,499 first yr</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Regular Renewal Price</td>
                  <td className="p-3.5 sm:p-4">₹0 forever</td>
                  <td className="p-3.5 sm:p-4">₹149 / month</td>
                  <td className="p-3.5 sm:p-4">₹1,788 / year</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Monthly Processing Credits</td>
                  <td className="p-3.5 sm:p-4">50 renewal</td>
                  <td className="p-3.5 sm:p-4 font-semibold text-sky-600">1,000</td>
                  <td className="p-3.5 sm:p-4 font-semibold text-purple-700">5,000</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Max PDF File Size</td>
                  <td className="p-3.5 sm:p-4">25 MB</td>
                  <td className="p-3.5 sm:p-4">100 MB</td>
                  <td className="p-3.5 sm:p-4">250 MB</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Max Image Upload Size</td>
                  <td className="p-3.5 sm:p-4">10 MB</td>
                  <td className="p-3.5 sm:p-4">30 MB</td>
                  <td className="p-3.5 sm:p-4">50 MB</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Batch File Upload Limit</td>
                  <td className="p-3.5 sm:p-4">Up to 10 files</td>
                  <td className="p-3.5 sm:p-4 font-medium text-sky-600">Up to 30 files</td>
                  <td className="p-3.5 sm:p-4 font-medium text-purple-700">Up to 50 files</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Priority Queue</td>
                  <td className="p-3.5 sm:p-4 text-slate-400">Standard</td>
                  <td className="p-3.5 sm:p-4 text-emerald-600 font-semibold">✓ Priority</td>
                  <td className="p-3.5 sm:p-4 text-emerald-600 font-semibold">✓ Highest VIP</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium">Customer Support</td>
                  <td className="p-3.5 sm:p-4">Community</td>
                  <td className="p-3.5 sm:p-4">Priority Email</td>
                  <td className="p-3.5 sm:p-4">Dedicated VIP Support</td>
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
              <h3 className="font-semibold text-slate-900">How do introductory offers work?</h3>
              <p className="mt-1 text-slate-500 leading-5">
                First-time subscribers get Pro for ₹99 for their first month (regularly ₹149/mo) and Pro Plus for ₹1,499 for their first year (regularly ₹1,788/yr). After the introductory period, subscriptions automatically renew at the standard price.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">How do processing credits work?</h3>
              <p className="mt-1 text-slate-500 leading-5">
                Every file operation consumes 1 credit. Batch operations consume 1 credit per file. Free users receive 100 starter credits and 50 monthly credits. Pro users receive 1,000 monthly credits, and Pro Plus users receive 5,000 monthly credits.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Can I cancel anytime?</h3>
              <p className="mt-1 text-slate-500 leading-5">
                Yes! You can manage or cancel your subscription at any time directly from your Account Dashboard. Your paid benefits remain active until the end of your current billing period.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* =============================================================== */}
      {/* PROFESSIONAL CHECKOUT MODAL                                    */}
      {/* =============================================================== */}
      {checkoutPlan && session && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900 my-8">
            {/* Top Modal Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-sky-500">
                  File<span className="text-slate-900">vera</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  256-bit Secure Checkout
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCheckoutPlan(null);
                  setCheckoutError(null);
                }}
                disabled={isSubmittingCheckout}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors disabled:opacity-50"
                aria-label="Close checkout"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Header Title */}
              <div>
                <h3 id="checkout-title" className="text-xl font-bold text-slate-900">
                  Complete your purchase
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {checkoutPlan === "pro"
                    ? "Filevera Pro • Monthly Subscription"
                    : "Filevera Pro Plus • Yearly Subscription"}
                </p>
              </div>

              {/* Customer Account info */}
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ProfileAvatar name={session.user.name} email={session.user.email} image={session.user.image} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{session.user.name || "Filevera Member"}</p>
                    <p className="text-[11px] text-slate-500 truncate">{session.user.email}</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Verified
                </span>
              </div>

              {/* Plan Pricing Breakdown */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-white">
                {checkoutPlan === "pro" ? (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Filevera Pro</h4>
                        <p className="text-xs text-slate-500">
                          {isProIntro ? "First month offer" : "Standard Monthly Plan"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-slate-900">
                          {isProIntro ? "₹99.00" : "₹149.00"}
                        </span>
                        <span className="text-xs text-slate-500 block">/ month</span>
                      </div>
                    </div>

                    {isProIntro && (
                      <div className="space-y-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Regular price:</span>
                          <span className="text-slate-500 line-through">₹149.00/month</span>
                        </div>
                        <div className="flex justify-between text-sky-700 font-medium">
                          <span>After first month:</span>
                          <span>₹149.00/month</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Billing:</span>
                          <span>Monthly</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Filevera Pro Plus</h4>
                        <p className="text-xs text-slate-500">
                          {isProPlusIntro ? "First-year offer" : "Standard Annual Plan"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-slate-900">
                          {isProPlusIntro ? "₹1,499.00" : "₹1,788.00"}
                        </span>
                        <span className="text-xs text-slate-500 block">/ year</span>
                      </div>
                    </div>

                    {isProPlusIntro && (
                      <div className="space-y-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Regular price:</span>
                          <span className="text-slate-500 line-through">₹1,788.00/year</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Savings:</span>
                          <span>₹289.00 off</span>
                        </div>
                        <div className="flex justify-between text-purple-700 font-medium">
                          <span>After first year:</span>
                          <span>₹1,788.00/year</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Billing:</span>
                          <span>Yearly</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Total Line */}
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Total today:</span>
                  <span className="text-xl font-black text-slate-900">
                    {checkoutPlan === "pro"
                      ? isProIntro
                        ? "₹99.00"
                        : "₹149.00"
                      : isProPlusIntro
                      ? "₹1,499.00"
                      : "₹1,788.00"}
                  </span>
                </div>
              </div>

              {/* Payment Methods Info */}
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700 font-semibold">
                  <span>Add payment method</span>
                  <span className="text-[11px] font-normal text-slate-500">Secured by Stripe</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="rounded bg-white px-2 py-1 border border-slate-200 text-[11px] font-bold text-slate-700 shadow-2xs">
                    Google Pay
                  </span>
                  <span className="rounded bg-white px-2 py-1 border border-slate-200 text-[11px] font-bold text-slate-700 shadow-2xs">
                    UPI
                  </span>
                  <span className="rounded bg-white px-2 py-1 border border-slate-200 text-[11px] font-bold text-slate-700 shadow-2xs">
                    Cards (Visa, MC, RuPay)
                  </span>
                  <span className="rounded bg-white px-2 py-1 border border-slate-200 text-[11px] font-bold text-slate-700 shadow-2xs">
                    Net Banking
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-4 pt-1">
                  You will be securely connected to complete payment with instant automated plan activation.
                </p>
              </div>

              {/* Error Notice */}
              {checkoutError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 space-y-2">
                  <p className="font-semibold">{checkoutError}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleProceedToStripe}
                      className="rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-700"
                    >
                      Try Again
                    </button>
                    <Link
                      href="/support"
                      className="rounded-lg border border-red-300 bg-white px-2.5 py-1 text-[11px] font-bold text-red-800 hover:bg-red-50"
                    >
                      Contact Support
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={isSubmittingCheckout}
                  onClick={handleProceedToStripe}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-sky-500 text-sm font-bold text-white hover:bg-sky-600 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingCheckout ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Preparing secure checkout...
                    </span>
                  ) : checkoutPlan === "pro" ? (
                    "Buy Pro"
                  ) : (
                    "Buy Pro Plus"
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSubmittingCheckout}
                  onClick={() => {
                    setCheckoutPlan(null);
                    setCheckoutError(null);
                  }}
                  className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 py-1.5 transition-colors"
                >
                  Cancel and return to plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              <span>Loading plans...</span>
            </div>
          </div>
        </main>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
