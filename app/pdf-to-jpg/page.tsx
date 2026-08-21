"use client";

import { ChangeEvent, useState } from "react";
import SiteHeader from "@/app/components/site-header";

export default function PdfToJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleChoose = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!/\.pdf$/i.test(selected.name) && selected.type !== "application/pdf") {
      setError("Please choose a valid PDF file.");
      return;
    }
    setFile(selected);
    setError("");
    setDownloadUrl("");
    event.target.value = "";
  };

  const convert = async () => {
    if (!file || processing) return;
    setProcessing(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/pdf-to-jpg", { method: "POST", body: form });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Could not convert the PDF to JPG.");
      }
      const blob = await response.blob();
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not convert the PDF to JPG.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">PDF Tools</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">PDF to JPG</h1>
          </div>
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <label className="inline-flex cursor-pointer rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500">
              Choose PDF
              <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={handleChoose} />
            </label>
            {file && <p className="mt-4 text-sm font-medium text-slate-700">Selected: {file.name}</p>}
            <button type="button" disabled={processing || !file} onClick={convert} className="mt-6 w-full rounded-xl bg-blue-700 px-6 py-4 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400">
              {processing ? "Converting…" : "Convert to JPG"}
            </button>
            {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
            {downloadUrl && <a href={downloadUrl} download="pages.zip" className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800">Download ZIP</a>}
          </div>
        </div>
      </section>
    </main>
  );
}
