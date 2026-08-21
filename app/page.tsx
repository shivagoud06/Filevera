import Link from "next/link";
import SiteHeader from "./components/site-header";
import { toolCategories, toolsInCategory } from "@/lib/tools";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/", "File Tools - Simple Tools for Everyday Files", "Compress, convert, merge, split and resize files online with straightforward tools.");

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Filevera</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Simple tools for all your files</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Compress, convert, merge, split and resize files online with straightforward tools for everyday work.
            </p>
          </div>

          <section className="mt-10" aria-labelledby="popular-heading"><h2 id="popular-heading" className="text-2xl font-bold">Popular tools</h2><div className="mt-4 grid gap-5 md:grid-cols-3">{toolsInCategory("PDF").slice(0, 3).map((tool) => <Link key={tool.href} href={tool.href} className="rounded-2xl border border-blue-100 bg-blue-50 p-5 hover:border-blue-300"><h3 className="text-lg font-bold">{tool.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p><span className="mt-4 block text-sm font-semibold text-blue-700">Open tool →</span></Link>)}</div></section>

          {toolCategories.filter((category) => toolsInCategory(category).length > 0).map((category) => (
            <section key={category} id={category.toLowerCase()} className="mt-10 scroll-mt-6" aria-labelledby={`${category.toLowerCase()}-heading`}>
              <h2 id={`${category.toLowerCase()}-heading`} className="text-2xl font-bold">{category} tools</h2>
              <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {toolsInCategory(category).map((tool) => <Link key={tool.href} href={tool.href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"><h3 className="text-xl font-bold text-slate-900">{tool.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p><div className="mt-5 text-sm font-semibold text-blue-700">Open tool →</div></Link>)}
              </div>
            </section>
          ))}

          <section className="mt-16 grid gap-5 border-t border-slate-200 pt-10 md:grid-cols-3" aria-labelledby="why-heading"><div><h2 id="why-heading" className="text-2xl font-bold">Why use Filevera?</h2><p className="mt-3 text-sm leading-6 text-slate-600">Clear controls, real generated files, and no account required for basic processing.</p></div><div><h3 className="font-bold">Use the tool you need</h3><p className="mt-2 text-sm leading-6 text-slate-600">Each operation opens directly so you can upload without extra steps.</p></div><div><h3 className="font-bold">Know what happens</h3><p className="mt-2 text-sm leading-6 text-slate-600">Results show actual output sizes and honest processing states.</p></div></section>
          <section className="mt-14" aria-labelledby="how-heading"><h2 id="how-heading" className="text-2xl font-bold">How it works</h2><div className="mt-5 grid gap-4 sm:grid-cols-3">{[["01", "Choose a tool", "Open the operation that matches your file task."], ["02", "Upload your file", "Use the file picker or drag and drop where supported."], ["03", "Download the result", "Process the file and download the actual generated output."]].map(([number, title, copy]) => <div key={number} className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-sm font-bold text-blue-700">{number}</span><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></div>)}</div></section>
          <section className="mt-14" aria-labelledby="faq-heading"><h2 id="faq-heading" className="text-2xl font-bold">Common questions</h2><div className="mt-5 space-y-3"><details className="rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer font-semibold">Do I need an account?</summary><p className="mt-3 text-sm leading-6 text-slate-600">No. Basic file tools remain available anonymously. An account is optional.</p></details><details className="rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer font-semibold">What happens to uploaded files?</summary><p className="mt-3 text-sm leading-6 text-slate-600">Files are used for the requested operation and processing code cleans its temporary working files afterward.</p></details></div></section>
        </div>
      </section>
    </main>
  );
}