"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "../components/site-header";
import { authClient } from "../auth-client";
import { SUPPORT_EMAIL } from "@/lib/config";

const CATEGORIES = [
  { id: "file-processing", label: "File processing problem", desc: "Issues converting, compressing, or resizing files" },
  { id: "account", label: "Account problem", desc: "Sign-in, password reset, or profile questions" },
  { id: "payment-plan", label: "Payment or plan question", desc: "Questions regarding Free, Pro, or credits" },
  { id: "bug-report", label: "Report a bug", desc: "Unexpected behavior or website error" },
  { id: "privacy-request", label: "Privacy request", desc: "Inquire about data deletion or privacy terms" },
  { id: "other", label: "Other inquiry", desc: "General feedback and partnership questions" }
];

export default function SupportPage() {
  const { data: session } = authClient.useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("file-processing");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const finalName = name.trim() || session?.user?.name || "";
      const finalEmail = email.trim() || session?.user?.email || "";

      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName,
          email: finalEmail,
          category,
          message: message.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit support request.");
      }

      setTicketId(data.ticketId);
      setMessage("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit support request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
      <SiteHeader />

      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 flex-1">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 shadow-2xs">
            Help Center & Customer Support
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Need help? We&apos;re here for <span className="text-sky-500">Filevera</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            For any issues with Filevera, file processing, accounts, or general support, contact us at:
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Left Column: Support Categories & Contact Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h2 className="text-sm font-bold text-slate-900">Need help?</h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                For any issues with Filevera, file processing, accounts, or general support, contact us at:
              </p>
              <div className="mt-3 rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs">
                <span className="text-slate-500">Support Email:</span>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="mt-0.5 block font-bold text-slate-900 hover:text-sky-500 transition-colors underline underline-offset-2 decoration-sky-300 hover:decoration-sky-500 break-all"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h2 className="text-sm font-bold text-slate-900">Common Topics</h2>
              <div className="mt-3 space-y-2 text-xs">
                <Link href="/pricing" className="block rounded-lg p-2 hover:bg-slate-50 text-slate-700 hover:text-sky-600">
                  • How plans and credits work →
                </Link>
                <Link href="/privacy" className="block rounded-lg p-2 hover:bg-slate-50 text-slate-700 hover:text-sky-600">
                  • File encryption & auto-deletion →
                </Link>
                <Link href="/feedback" className="block rounded-lg p-2 hover:bg-slate-50 text-slate-700 hover:text-sky-600">
                  • Community feedback & reviews →
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Support Form */}
          <div className="md:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              {ticketId ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-xs sm:text-sm text-emerald-900">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200 text-emerald-800 text-base font-bold">
                    ✓
                  </div>
                  <h2 className="mt-3 text-base font-bold text-emerald-950">Support Request Received</h2>
                  <p className="mt-1 text-xs text-emerald-800">
                    Your request has been logged. Our support team will review your message and reply to <span className="font-semibold">{email}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTicketId(null)}
                    className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Submit a Support Ticket</h2>
                    <p className="text-xs text-slate-500">Please provide details so we can resolve your issue quickly.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="sup-name" className="block text-xs font-semibold text-slate-700">
                        Your Name
                      </label>
                      <input
                        id="sup-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name"
                        className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="sup-email" className="block text-xs font-semibold text-slate-700">
                        Your Email
                      </label>
                      <input
                        id="sup-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sup-category" className="block text-xs font-semibold text-slate-700">
                      Inquiry Category
                    </label>
                    <select
                      id="sup-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="sup-message" className="block text-xs font-semibold text-slate-700">
                      Detailed Message
                    </label>
                    <textarea
                      id="sup-message"
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please describe the issue or question in detail..."
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 resize-none"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                      {error}
                    </p>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex h-11 w-full items-center justify-center rounded-xl bg-sky-500 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60"
                    >
                      {submitting ? "Sending Ticket..." : "Send Support Request"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
