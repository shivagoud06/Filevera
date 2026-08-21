import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/app/components/site-header";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/contact", "Contact | Filevera", "Get help with Filevera file-processing tools, accounts, and privacy requests.");
const contact = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900"><SiteHeader /><section className="mx-auto max-w-3xl px-5 py-12 sm:px-8"><Link href="/" className="text-sm font-semibold text-blue-700">← Back to Filevera</Link><div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Support</p><h1 className="mt-3 text-4xl font-bold">How can we help?</h1><p className="mt-4 leading-7 text-slate-600">Reach out about a tool issue, account question, bug report, or privacy request.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{[["General questions", "Ask about supported formats, limits, or using a tool."], ["Bug reports", "Include the tool name and a short description. Do not send sensitive file contents."], ["Account help", "Get help with signing in or managing your account."], ["Privacy requests", "Ask about account information or uploaded-file processing."]].map(([heading, text]) => <div key={heading} className="rounded-xl border border-slate-200 p-5"><h2 className="font-bold">{heading}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>)}</div><div className="mt-8 rounded-xl bg-slate-50 p-5 text-sm">{contact ? <>Email us at <a href={`mailto:${contact}`} className="font-semibold text-blue-700 hover:underline">{contact}</a>.</> : "Support email is not configured yet. Set NEXT_PUBLIC_SUPPORT_EMAIL before publishing a support address."}</div></div></section></main>
  );
}
