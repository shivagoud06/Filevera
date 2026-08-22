import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/app/components/site-header";
import { pageMetadata } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/config";

export const metadata: Metadata = pageMetadata("/contact", "Contact & Support | Filevera", "Get help with Filevera file-processing tools, accounts, and privacy requests.");

export default function ContactPage() {
  return (
    <main className="bg-slate-50 text-slate-900 flex-1">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline">
          ← Back to Filevera
        </Link>
        <div className="mt-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
          <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
            Support & Help
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl text-slate-900">Need help?</h1>
          <p className="mt-1.5 text-xs sm:text-sm leading-5 text-slate-600">
            For any issues with Filevera, file processing, accounts, or general support, contact us at:
          </p>

          {/* Primary Support Email Callout */}
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs sm:text-sm text-slate-800">
            <p className="font-semibold text-slate-900">Contact Support Email:</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-1 inline-block text-sm sm:text-base font-bold text-slate-900 hover:text-sky-500 transition-colors underline underline-offset-2 decoration-sky-300 hover:decoration-sky-500 break-all"
            >
              {SUPPORT_EMAIL}
            </a>
            <p className="mt-1 text-[11px] text-slate-500">
              We respond to inquiries regarding tool processing, limits, account access, and privacy requests.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["General questions", "Ask about supported formats, limits, or using our file processing utilities."],
              ["Bug reports", "Include the tool name and an error description. Do not send confidential files."],
              ["Account help", "Get help with signing in, password reset, or managing your Filevera account."],
              ["Privacy requests", "Inquire about data processing, temporary storage, or account data deletion."]
            ].map(([heading, text]) => (
              <div key={heading} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">{heading}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm text-slate-700">
            <div>
              <p className="font-semibold text-slate-900">Prefer to submit an online ticket?</p>
              <p className="text-xs text-slate-500">
                Use our interactive support form to send detailed information.
              </p>
            </div>
            <Link
              href="/support"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-sky-500 px-4 text-xs font-semibold text-white hover:bg-sky-600 shadow-2xs transition-colors shrink-0"
            >
              Open Support Center →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
