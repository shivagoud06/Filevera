import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/app/components/site-header";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/contact", "Contact | Filevera", "Get help with Filevera file-processing tools, accounts, and privacy requests.");
const contact = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

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
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl text-slate-900">How can we help?</h1>
          <p className="mt-1.5 text-xs sm:text-sm leading-5 text-slate-600">
            Reach out about tool feedback, account questions, bug reports, or privacy inquiries.
          </p>

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

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs sm:text-sm text-slate-700">
            {contact ? (
              <>Email our support team directly at <a href={`mailto:${contact}`} className="font-semibold text-sky-600 hover:underline">{contact}</a>.</>
            ) : (
              "Support email is currently being configured for production."
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
