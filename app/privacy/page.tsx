import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/app/components/site-header";
import { pageMetadata } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/config";

export const metadata: Metadata = pageMetadata("/privacy", "Privacy Policy | Filevera", "How Filevera handles accounts, uploaded files, cookies, and service operations.");

export default function PrivacyPage() {
  return (
    <main className="bg-slate-50 text-slate-900 flex-1">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline">
          ← Back to Filevera
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl text-slate-900">Privacy Policy</h1>
        <p className="mt-1 text-xs text-slate-500">Last updated: August 22, 2026</p>

        <div className="mt-4 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 text-xs sm:text-sm leading-6 shadow-xs sm:p-7 text-slate-700">
          <section>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Information we may collect</h2>
            <p className="mt-1.5">Filevera may process an email address, name, and authentication records when you create an account. Basic technical information may be present in normal server logs. No document contents are used for advertising or user profiling.</p>
          </section>
          <section className="border-t border-slate-100 pt-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Uploaded files</h2>
            <p className="mt-1.5">Files are uploaded only to provide the operation you request. PDF and image processing uses temporary server files that are purged immediately upon operation completion.</p>
          </section>
          <section className="border-t border-slate-100 pt-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Accounts and cookies</h2>
            <p className="mt-1.5">Authentication uses session cookies managed by Better Auth. Account information is used exclusively to authenticate and maintain your account. We do not use advertising tracking cookies.</p>
          </section>
          <section className="border-t border-slate-100 pt-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Security and infrastructure</h2>
            <p className="mt-1.5">Passwords are securely hashed using modern cryptographic hashing. File processing is executed locally on dedicated container infrastructure.</p>
          </section>
          <section className="border-t border-slate-100 pt-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Contact</h2>
            <p className="mt-1.5">For privacy inquiries and data requests, contact our support team at <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-sky-600 hover:underline break-all">{SUPPORT_EMAIL}</a>.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
