import Link from "next/link";
import SiteHeader from "./components/site-header";
import { IconPdf, IconImage, IconArrowRight } from "./components/ui-icons";

export default function NotFound() {
  return (
    <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
      <SiteHeader />

      <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16 text-center flex-1 flex flex-col justify-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 text-sky-600 text-2xl font-black shadow-xs">
          404
        </div>

        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Page not found
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          The page or tool you are looking for does not exist, has been moved, or the link may be outdated.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-500 px-5 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 shadow-2xs transition-colors"
          >
            ← Back to Filevera Home
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            View Plans & Pricing
          </Link>
        </div>

        {/* Quick links to popular tools */}
        <div className="mt-10 pt-8 border-t border-slate-200 text-left">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider text-center sm:text-left">
            Popular File Tools
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Link
              href="/compress-pdf"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs hover:border-sky-300 hover:shadow-2xs transition-all"
            >
              <div className="flex items-center gap-2">
                <IconPdf className="h-4 w-4 text-sky-600" />
                <span className="font-semibold text-slate-800">Compress PDF</span>
              </div>
              <IconArrowRight className="h-3 w-3 text-slate-400" />
            </Link>

            <Link
              href="/merge-pdf"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs hover:border-sky-300 hover:shadow-2xs transition-all"
            >
              <div className="flex items-center gap-2">
                <IconPdf className="h-4 w-4 text-sky-600" />
                <span className="font-semibold text-slate-800">Merge PDF</span>
              </div>
              <IconArrowRight className="h-3 w-3 text-slate-400" />
            </Link>

            <Link
              href="/image-compressor"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs hover:border-sky-300 hover:shadow-2xs transition-all"
            >
              <div className="flex items-center gap-2">
                <IconImage className="h-4 w-4 text-sky-600" />
                <span className="font-semibold text-slate-800">Compress Image</span>
              </div>
              <IconArrowRight className="h-3 w-3 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
