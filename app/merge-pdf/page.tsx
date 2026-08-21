"use client";

import { ChangeEvent, useState } from "react";
import SiteHeader from "@/app/components/site-header";

const MAX_FILES = 10;

export default function MergePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const addFiles = (incoming: FileList | File[]) => {
    const selected = Array.from(incoming);
    if (!selected.length) return;
    if (files.length + selected.length > MAX_FILES) {
      setError(`Choose up to ${MAX_FILES} PDFs.`);
      return;
    }
    const invalid = selected.find((file) => !/\.pdf$/i.test(file.name) && file.type !== "application/pdf");
    if (invalid) {
      setError(`${invalid.name} is not a valid PDF file.`);
      return;
    }
    setFiles((current) => [...current, ...selected]);
    setError("");
  };

  const handleChoose = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addFiles(event.target.files);
      event.target.value = "";
    }
  };

  const removeFile = (name: string) => {
    setFiles((current) => current.filter((file) => `${file.name}-${file.size}` !== name));
  };

  const merge = async () => {
    if (files.length < 2 || processing) return;
    setProcessing(true);
    setError("");
    try {
      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      const response = await fetch("/api/merge-pdf", { method: "POST", body: form });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Could not merge PDF files.");
      }
      const blob = await response.blob();
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not merge PDF files.");
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
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Merge PDF</h1>
          </div>
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <label className="inline-flex cursor-pointer rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500">
              Choose PDFs
              <input type="file" accept="application/pdf,.pdf" multiple className="sr-only" onChange={handleChoose} />
            </label>
            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                {files.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <span className="truncate text-sm font-medium">{file.name}</span>
                    <button type="button" onClick={() => removeFile(`${file.name}-${file.size}`)} className="rounded-lg px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-50">Remove</button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" disabled={processing || files.length < 2} onClick={merge} className="mt-6 w-full rounded-xl bg-blue-700 px-6 py-4 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400">
              {processing ? "Merging…" : "Merge PDFs"}
            </button>
            {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
            {downloadUrl && <a href={downloadUrl} download="merged.pdf" className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800">Download merged PDF</a>}
          </div>
        </div>
      </section>
    </main>
  );
}
