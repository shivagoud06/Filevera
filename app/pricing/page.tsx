"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "../components/site-header";
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

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function PricingContent() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");
  const [isProIntro, setIsProIntro] = useState<boolean>(true);
  const [isProPlusIntro, setIsProPlusIntro] = useState<boolean>(true);
  const [loadingPlan, setLoadingPlan] = useState<"pro" | "pro_plus" | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);



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
  }, [session]);

  // Pre-load Razorpay script
  useEffect(() => {
    void loadRazorpayScript();
  }, []);

  const handleStartCheckout = async (planId: "pro" | "pro_plus") => {
    setPaymentError(null);
    setPaymentSuccess(null);

    if (!session) {
      router.push(`/login?redirect=/pricing?plan=${planId}`);
      return;
    }

    if (planId === currentPlan) {
      return;
    }

    setLoadingPlan(planId);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPaymentError("Could not load secure checkout gateway. Please check your internet connection.");
        setLoadingPlan(null);
        return;
      }

      const res = await fetch("/api/payment/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || "Failed to initialize checkout.");
        setLoadingPlan(null);
        return;
      }

      if (!window.Razorpay) {
        setPaymentError("Razorpay SDK not ready. Please refresh the page and try again.");
        setLoadingPlan(null);
        return;
      }

      const options: Record<string, unknown> = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "Filevera",
        description: `${data.planName} Subscription`,
        image: "/favicon.ico",
        order_id: data.orderId || undefined,
        subscription_id: data.subscriptionId || undefined,
        prefill: {
          name: session.user.name || undefined,
          email: session.user.email,
        },
        theme: {
          color: "#0284c7",
        },
        modal: {
          ondismiss: () => {
            setLoadingPlan(null);
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id?: string;
          razorpay_subscription_id?: string;
          razorpay_signature?: string;
        }) => {
          setLoadingPlan(planId);
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
                plan: planId,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              setPaymentError(verifyData.error || "Payment verification could not be confirmed.");
              setLoadingPlan(null);
              return;
            }

            setPaymentSuccess(`Payment successful ✓ Welcome to Filevera ${planId === "pro_plus" ? "Pro Plus" : "Pro"}! Your plan is now active.`);
            setCurrentPlan(planId);
            setLoadingPlan(null);

            // Redirect to account page after 2 seconds
            setTimeout(() => {
              router.push("/account");
            }, 2000);
          } catch {
            setPaymentError("Network error during payment verification. If funds were deducted, your plan will activate automatically via webhook.");
            setLoadingPlan(null);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setPaymentError("Payment was not completed. Your current plan has not changed.");
        setLoadingPlan(null);
      });
      rzp.open();
    } catch {
      setPaymentError("An error occurred while launching secure checkout. Please try again.");
      setLoadingPlan(null);
    }
  };



  return (
    <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
      <SiteHeader />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 flex-1">
        {/* Status Alerts */}
        {paymentSuccess && (
          <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center text-xs sm:text-sm text-emerald-950 shadow-sm animate-fade-in" role="status">
            <p className="font-bold text-emerald-900">{paymentSuccess}</p>
            <p className="mt-1 text-xs text-emerald-700">Redirecting to your account dashboard...</p>
          </div>
        )}

        {paymentError && (
          <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-900 shadow-sm flex items-center justify-between" role="alert">
            <div>
              <p className="font-bold">Payment Notification</p>
              <p className="mt-0.5 text-xs text-red-700">{paymentError}</p>
            </div>
            <button
              type="button"
              onClick={() => setPaymentError(null)}
              className="ml-3 text-xs font-semibold text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
            Simple, Transparent Pricing in INR
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
            Supercharge your document workflow
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Start for free with monthly renewal credits, or upgrade to Pro for generous file limits and dedicated server capacity.
          </p>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8 items-stretch max-w-6xl mx-auto">
          {/* 1. FREE PLAN CARD */}
          <div className={`rounded-3xl border ${
            currentPlan === "free" ? "border-slate-400 bg-white" : "border-slate-200 bg-white"
          } p-6 sm:p-8 flex flex-col justify-between shadow-xs transition-all hover:shadow-md relative`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Free Tier</span>
                {currentPlan === "free" && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    Your Current Plan
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">Free</h2>
              <p className="mt-1 text-xs text-slate-500 min-h-[32px]">
                {PLANS.free.tagline}
              </p>

              {/* Price Display */}
              <div className="mt-5 border-y border-slate-100 py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">₹0</span>
                  <span className="text-xs font-medium text-slate-500">/ forever</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">100 starter credits on signup + 50/month</p>
              </div>

              {/* Features List */}
              <div className="mt-6 space-y-2.5 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">What&apos;s included:</p>
                {PLANS.free.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-sky-500 font-bold shrink-0">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100">
              {currentPlan === "free" ? (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 py-3 text-xs font-bold text-slate-600 cursor-default"
                >
                  ✓ Current Plan
                </button>
              ) : (
                <Link
                  href="/"
                  className="block w-full text-center rounded-2xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Use Free Tools
                </Link>
              )}
            </div>
          </div>

          {/* 2. PRO PLAN CARD (RECOMMENDED) */}
          <div className={`rounded-3xl border-2 ${
            currentPlan === "pro"
              ? "border-sky-500 bg-white ring-4 ring-sky-50"
              : "border-sky-500 bg-white ring-4 ring-sky-50/50 shadow-md"
          } p-6 sm:p-8 flex flex-col justify-between transition-all hover:shadow-lg relative`}>
            {/* Recommended Tag */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-3.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
              Recommended
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Monthly Pro</span>
                {currentPlan === "pro" ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    ✓ Active
                  </span>
                ) : isProIntro ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                    First-Time Offer
                  </span>
                ) : null}
              </div>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">Pro</h2>
              <p className="mt-1 text-xs text-slate-500 min-h-[32px]">
                {PLANS.pro.tagline}
              </p>

              {/* Price Display with Strict INR Breakdown */}
              <div className="mt-5 border-y border-slate-100 py-4">
                {isProIntro && currentPlan !== "pro" ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-slate-900">₹99</span>
                      <span className="text-xs font-medium text-slate-500">for first month</span>
                      <span className="text-xs line-through text-slate-400">₹149</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                      <span className="font-semibold text-emerald-700">Save ₹50</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">Then ₹149/month recurring</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-900">₹149</span>
                      <span className="text-xs font-medium text-slate-500">/ month</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Regular monthly billing</p>
                  </>
                )}
              </div>

              {/* Features List */}
              <div className="mt-6 space-y-2.5 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">Everything in Free, plus:</p>
                {PLANS.pro.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-sky-500 font-bold shrink-0">✓</span>
                    <span className={idx === 0 || idx === 1 ? "font-bold text-slate-900" : ""}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100">
              {currentPlan === "pro" ? (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-2xl border border-sky-300 bg-sky-50 py-3 text-xs font-bold text-sky-800 cursor-default"
                >
                  ✓ Current Plan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartCheckout("pro")}
                  disabled={loadingPlan !== null}
                  className="w-full rounded-2xl bg-sky-500 py-3 text-xs font-bold text-white hover:bg-sky-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingPlan === "pro" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Opening secure checkout...</span>
                    </>
                  ) : (
                    <span>{isProIntro ? "Get Pro for ₹99" : "Get Pro"}</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 3. PRO PLUS CARD (BEST VALUE) */}
          <div className={`rounded-3xl border ${
            currentPlan === "pro_plus"
              ? "border-purple-500 bg-white ring-4 ring-purple-50"
              : "border-purple-200 bg-white"
          } p-6 sm:p-8 flex flex-col justify-between shadow-xs transition-all hover:shadow-md relative`}>
            {/* Best Value Tag */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-3.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
              Best Value
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Annual Plan</span>
                {currentPlan === "pro_plus" ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    ✓ Active
                  </span>
                ) : isProPlusIntro ? (
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-800">
                    Save ₹289
                  </span>
                ) : null}
              </div>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">Pro Plus</h2>
              <p className="mt-1 text-xs text-slate-500 min-h-[32px]">
                {PLANS.pro_plus.tagline}
              </p>

              {/* Price Display */}
              <div className="mt-5 border-y border-slate-100 py-4">
                {isProPlusIntro && currentPlan !== "pro_plus" ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-slate-900">₹1,499</span>
                      <span className="text-xs font-medium text-slate-500">for first year</span>
                      <span className="text-xs line-through text-slate-400">₹1,788</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                      <span className="font-semibold text-emerald-700">~₹125/mo equivalent</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">Then ₹1,788/year</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-900">₹1,788</span>
                      <span className="text-xs font-medium text-slate-500">/ year</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">₹149/month billed annually</p>
                  </>
                )}
              </div>

              {/* Features List */}
              <div className="mt-6 space-y-2.5 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">Everything in Pro, plus:</p>
                {PLANS.pro_plus.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold shrink-0">✓</span>
                    <span className={idx === 0 || idx === 1 ? "font-bold text-slate-900" : ""}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100">
              {currentPlan === "pro_plus" ? (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-2xl border border-purple-300 bg-purple-50 py-3 text-xs font-bold text-purple-800 cursor-default"
                >
                  ✓ Current Plan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartCheckout("pro_plus")}
                  disabled={loadingPlan !== null}
                  className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-bold text-white hover:bg-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingPlan === "pro_plus" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Opening secure checkout...</span>
                    </>
                  ) : (
                    <span>
                      {currentPlan === "pro"
                        ? "Upgrade to Pro Plus"
                        : isProPlusIntro
                        ? "Get Pro Plus for ₹1,499"
                        : "Get Pro Plus"}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feature Comparison Matrix Table */}
        <div className="mt-16 mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 text-center">Detailed Plan Comparison</h2>
          <p className="mt-1 text-xs text-slate-500 text-center">Side-by-side feature and quota comparison across all tiers</p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-900 font-bold bg-slate-50/50">
                  <th className="p-3">Feature</th>
                  <th className="p-3 text-center">Free</th>
                  <th className="p-3 text-center text-sky-600">Pro (₹149/mo)</th>
                  <th className="p-3 text-center text-purple-600">Pro Plus (₹1,788/yr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">First-Time Introductory Offer</td>
                  <td className="p-3 text-center text-slate-500">—</td>
                  <td className="p-3 text-center font-bold text-sky-700">₹99 (1st month)</td>
                  <td className="p-3 text-center font-bold text-purple-700">₹1,499 (1st year)</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Monthly Processing Credits</td>
                  <td className="p-3 text-center">50 (100 starter)</td>
                  <td className="p-3 text-center font-bold text-sky-700">1,000 / month</td>
                  <td className="p-3 text-center font-bold text-purple-700">5,000 / month</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Max PDF File Size</td>
                  <td className="p-3 text-center">25 MB</td>
                  <td className="p-3 text-center font-semibold">100 MB</td>
                  <td className="p-3 text-center font-semibold">250 MB</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Max Image File Size</td>
                  <td className="p-3 text-center">10 MB</td>
                  <td className="p-3 text-center font-semibold">30 MB</td>
                  <td className="p-3 text-center font-semibold">50 MB</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Batch Processing Limit</td>
                  <td className="p-3 text-center">10 files</td>
                  <td className="p-3 text-center font-semibold">30 files</td>
                  <td className="p-3 text-center font-semibold">50 files</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Queue Priority</td>
                  <td className="p-3 text-center text-slate-500">Standard</td>
                  <td className="p-3 text-center font-semibold text-sky-700">Priority Queue</td>
                  <td className="p-3 text-center font-semibold text-purple-700">Dedicated Max Speed</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Customer Support</td>
                  <td className="p-3 text-center text-slate-500">Standard Email</td>
                  <td className="p-3 text-center">Priority Email</td>
                  <td className="p-3 text-center font-bold text-purple-700">Dedicated VIP Support</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & Payment Assurance */}
        <div className="mt-12 mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 text-center flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 font-bold">
              🛡️
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">256-Bit SSL Encrypted Checkout</p>
              <p className="text-[11px] text-slate-500">Powered by Razorpay. Supports UPI, Google Pay, Cards & Net Banking.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Cancel anytime from your account</span>
          </div>
        </div>
      </div>
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
            <span className="text-xs text-slate-500">Loading pricing...</span>
          </div>
        </main>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
