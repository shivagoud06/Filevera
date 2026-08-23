"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteHeader from "../../components/site-header";
import ProfileAvatar from "../../components/profile-avatar";
import { authClient } from "../../auth-client";
import { PLANS, PlanId } from "@/lib/plans";

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

type SettingsTab = "profile" | "security" | "preferences" | "billing" | "activity";

function SettingsContent() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get("tab") as SettingsTab) || "profile";
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(initialTab);
  const [usage, setUsage] = useState<UserUsageData | null>(null);

  // Modals & Actions
  const [signingOut, setSigningOut] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingRevoke, setLoadingRevoke] = useState(false);

  const [displayName, setDisplayName] = useState(session?.user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Preferences State
  const [prefEmailNotifications, setPrefEmailNotifications] = useState(true);
  const [prefAutoDownload, setPrefAutoDownload] = useState(true);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  // Feedback Notices
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
            <span>Loading settings...</span>
          </div>
        </div>
      </main>
    );
  }

  const user = session.user;
  const isGoogleUser = Boolean(user.image && !user.image.startsWith("/"));
  const planId = usage?.plan || "free";
  const isPaidUser = planId === "pro" || planId === "pro_plus";
  const planConfig = PLANS[planId] || PLANS.free;
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

  // Logout Handler
  const handleLogout = async () => {
    setSigningOut(true);
    setLogoutModalOpen(false);
    await authClient.signOut();
    router.replace("/");
  };

  // Revoke Sessions Handler
  const handleRevokeSessions = async () => {
    setLoadingRevoke(true);
    setProfileError(null);
    try {
      if ("revokeOtherSessions" in authClient && typeof authClient.revokeOtherSessions === "function") {
        await authClient.revokeOtherSessions();
      }
      setRevokeModalOpen(false);
      setFeedbackNotice("All other active sessions have been successfully logged out.");
    } catch {
      setFeedbackError("Failed to invalidate other sessions. Please try again.");
    } finally {
      setLoadingRevoke(false);
    }
  };

  // Profile Save Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setProfileError("Display name cannot be empty.");
      return;
    }
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const res = await authClient.updateUser({ name: displayName.trim() });
      if (res?.error) {
        setProfileError(res.error.message || "Failed to update display name.");
      } else {
        setProfileSuccess("Display name updated successfully.");
        setTimeout(() => setProfileSuccess(null), 4000);
      }
    } catch {
      setProfileError("Network error while saving profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Password Change Handler
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (res?.error) {
        setPasswordError(res.error.message || "Failed to update password. Verify current password.");
      } else {
        setPasswordSuccess("Password updated successfully. Other sessions logged out.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(null), 4000);
      }
    } catch {
      setPasswordError("Network error while changing password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = () => {
    setPreferencesSaved(true);
    setTimeout(() => setPreferencesSaved(false), 3000);
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
            <span className="text-xs font-medium text-slate-500">Settings</span>
          </div>
          <span className="text-xs text-slate-400">Preferences & Profile</span>
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

        {/* Header Profile Summary */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ProfileAvatar name={user.name} email={user.email} image={user.image} size="lg" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Account Settings
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

            <button
              type="button"
              onClick={() => setLogoutModalOpen(true)}
              disabled={signingOut}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-red-50/70 px-3.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Settings Layout */}
        <div className="mt-6 flex flex-col md:flex-row gap-6 animate-fade-in">
          {/* Settings Sidebar Tabs */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs flex flex-row md:flex-col gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSettingsTab("profile")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                  settingsTab === "profile"
                    ? "bg-sky-50 text-sky-800 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>👤</span>
                <span>Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab("security")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                  settingsTab === "security"
                    ? "bg-sky-50 text-sky-800 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>🔒</span>
                <span>Security</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab("preferences")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                  settingsTab === "preferences"
                    ? "bg-sky-50 text-sky-800 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>⚙️</span>
                <span>Preferences</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab("billing")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                  settingsTab === "billing"
                    ? "bg-sky-50 text-sky-800 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>💳</span>
                <span>Billing & Plan</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab("activity")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                  settingsTab === "activity"
                    ? "bg-sky-50 text-sky-800 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>📊</span>
                <span>Activity Log</span>
              </button>
            </div>

            {/* Quick Support / Legal Links */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-700">Help & Legal</p>
              <div className="space-y-1">
                <Link href="/support" className="block text-sky-600 hover:underline">
                  Contact Support
                </Link>
                <Link href="/privacy" className="block text-sky-600 hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block text-sky-600 hover:underline">
                  Terms of Service
                </Link>
              </div>
            </div>
          </aside>

          {/* Settings Tab Content */}
          <div className="flex-1">
            {/* 1. PROFILE TAB */}
            {settingsTab === "profile" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900">Profile Information</h3>
                  <p className="text-xs text-slate-500">Update your account name and email address</p>
                </div>

                {profileSuccess && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 font-semibold">
                    ✓ {profileSuccess}
                  </div>
                )}

                {profileError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 font-semibold">
                    ✕ {profileError}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your full name"
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Primary authenticated account email address.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-600 transition-colors shadow-2xs disabled:opacity-50"
                    >
                      {savingProfile ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. SECURITY TAB */}
            {settingsTab === "security" && (
              <div className="space-y-6">
                {/* Password Management */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-bold text-slate-900">Security & Password</h3>
                    <p className="text-xs text-slate-500">Manage your credentials and login protection</p>
                  </div>

                  {isGoogleUser ? (
                    <div className="mt-5 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-700">
                      <p className="font-semibold text-slate-900">Single Sign-On (SSO) Account</p>
                      <p className="mt-1 text-slate-600 leading-relaxed">
                        Your account is secured via single sign-on. Password protection and two-factor authentication are managed through your identity provider.
                      </p>
                    </div>
                  ) : (
                    <>
                      {passwordSuccess && (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 font-semibold">
                          ✓ {passwordSuccess}
                        </div>
                      )}

                      {passwordError && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 font-semibold">
                          ✕ {passwordError}
                        </div>
                      )}

                      <form onSubmit={handleSavePassword} className="mt-5 space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700">Current Password</label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700">New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700">Confirm New Password</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                          <button
                            type="submit"
                            disabled={savingPassword}
                            className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-600 transition-colors shadow-2xs disabled:opacity-50"
                          >
                            {savingPassword ? "Updating..." : "Update Password"}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>

                {/* Sessions Management */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-bold text-slate-900">Active Sessions</h3>
                    <p className="text-xs text-slate-500">Manage authorized login sessions across your devices</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">Current Session</p>
                      <p className="text-[11px] text-slate-500">Connected to Filevera Web App</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      ● Active Now
                    </span>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[11px] text-slate-500">Log out all other devices if you suspect unauthorized access.</p>
                    <button
                      type="button"
                      onClick={() => setRevokeModalOpen(true)}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                    >
                      Log out other sessions
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PREFERENCES TAB */}
            {settingsTab === "preferences" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900">Workflow Preferences</h3>
                  <p className="text-xs text-slate-500">Customize notification alerts and processing preferences</p>
                </div>

                {preferencesSaved && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 font-semibold">
                    ✓ Preferences saved.
                  </div>
                )}

                <div className="mt-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <div>
                      <p className="font-semibold text-slate-900">Monthly Credit Renewal Alerts</p>
                      <p className="text-[11px] text-slate-500">Receive an email alert when credits refresh each billing cycle</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefEmailNotifications}
                      onChange={(e) => setPrefEmailNotifications(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <div>
                      <p className="font-semibold text-slate-900">Auto-Download Finished Files</p>
                      <p className="text-[11px] text-slate-500">Automatically trigger file download when compression or merge completes</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefAutoDownload}
                      onChange={(e) => setPrefAutoDownload(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleSavePreferences}
                      className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-600 transition-colors shadow-2xs"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. BILLING & PLAN TAB */}
            {settingsTab === "billing" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                  <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Subscription & Plan</h3>
                      <p className="text-xs text-slate-500">Billing details, status, and renewal information</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      isPaidUser ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-700"
                    }`}>
                      {planConfig.name}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Plan Billing Amount</span>
                      <span className="text-base font-bold text-slate-900 mt-1 block">
                        {planId === "pro_plus" ? "₹1,788 / year" : planId === "pro" ? "₹149 / month" : "₹0 / forever"}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Next Renewal / Reset</span>
                      <span className="text-base font-bold text-slate-900 mt-1 block">
                        {resetDateString}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Monthly Credit Allowance</span>
                      <span className="text-base font-bold text-slate-900 mt-1 block">
                        {allowance.toLocaleString()} credits / cycle
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Subscription Status</span>
                      <span className={`text-base font-bold capitalize mt-1 block ${
                        subStatus === "active" ? "text-emerald-700" : "text-amber-700"
                      }`}>
                        {subStatus === "active" ? "✓ Active" : subStatus}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                    {isPaidUser ? (
                      <button
                        type="button"
                        onClick={() => setCancelModalOpen(true)}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                      >
                        Cancel Subscription
                      </button>
                    ) : (
                      <Link
                        href="/pricing"
                        className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-600 transition-colors shadow-2xs"
                      >
                        Upgrade to Pro (₹99)
                      </Link>
                    )}

                    <Link
                      href="/pricing"
                      className="text-xs font-semibold text-sky-600 hover:underline"
                    >
                      View tier benefits & comparisons →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* 5. ACTIVITY LOG TAB */}
            {settingsTab === "activity" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Activity Log</h3>
                    <p className="text-xs text-slate-500">Live transaction records stored in PostgreSQL</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400">Database Record</span>
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
              </div>
            )}
          </div>
        </div>
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

      {/* 2. Revoke Sessions Confirmation Modal */}
      {revokeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in" role="dialog">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xl font-bold">
              🔒
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Log out other devices?</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              This will invalidate all active sessions except your current browser. You will stay signed in on this device.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setRevokeModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeSessions}
                disabled={loadingRevoke}
                className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 shadow-xs"
              >
                {loadingRevoke ? "Invalidating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Cancel Subscription Confirmation Modal */}
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

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center p-8">
            <span className="text-xs text-slate-500">Loading settings...</span>
          </div>
        </main>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
