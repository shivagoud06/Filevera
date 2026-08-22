import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/app/components/site-header";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/terms", "Terms of Service | Filevera", "Terms for using Filevera online file-processing tools and accounts.");
const contact = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

export default function TermsPage() {
  return (
    <main className="bg-slate-50 text-slate-900 flex-1">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline">
          ← Back to Filevera
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl text-slate-900">Terms of Service</h1>
        <p className="mt-1 text-xs text-slate-500">Last updated: August 22, 2026</p>

        <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-xs sm:text-sm leading-6 shadow-xs sm:p-7 text-slate-700">
          {[
            ["1. Service", "Filevera provides online tools for compressing, converting, merging, splitting, and resizing files."],
            ["2. Eligibility", "You may use Filevera only if you can form a legally binding agreement and are permitted to use the service where you live."],
            ["3. Acceptable use", "Use the service only for lawful purposes and files you are authorized to process. Do not upload malware or automated denial-of-service payloads."],
            ["4. User files", "You retain full ownership and responsibility for your files. You grant Filevera only the temporary access needed to execute your requested file operation."],
            ["5. Processing limits", "Results depend on input file complexity, format constraints, and technical limits. No result is guaranteed to meet an arbitrary file size without visual quality trade-offs."],
            ["6. Availability", "The service is provided as-is and may be periodically updated, upgraded, or maintained."],
            ["7. Contact", contact ? `Questions regarding these terms can be directed to ${contact}.` : "Questions can be sent through the support page."]
          ].map(([heading, text], index) => (
            <section key={heading} className={index > 0 ? "border-t border-slate-100 pt-3.5" : ""}>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">{heading}</h2>
              <p className="mt-1">{text}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
