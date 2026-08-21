"use client";

import { ChangeEvent, useState } from "react";
import SiteHeader from "@/app/components/site-header";

export default function JpgToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const addFiles = (incoming: FileList | File[]) => {
    const selected = Array.from(incoming);
    if (!selected.length) return;
    const invalid = selected.find((file) => !["image/jpeg", "image/png"].includes(file.type) && !/\.(jpe?g|png)$/i.test(file.name));
    if (invalid) {
      setError(`${invalid.name} is not a valid JPG or PNG image.`);
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

  const convert = async () => {
    if (!files.length || processing) return;
    setProcessing(true);
    setError("");
    try {
      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      const response = await fetch("/api/jpg-to-pdf", { method: "POST", body: form });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Could not convert images to PDF.");
      }
      const blob = await response.blob();
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not convert images to PDF.");
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
            <h1 className="mt-3 text-4xl font-bold tracking-tight">JPG to PDF</h1>
          </div>
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <label className="inline-flex cursor-pointer rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500">
              Choose images
              <input type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" multiple className="sr-only" onChange={handleChoose} />
            </label>
            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                {files.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="rounded-xl border border-slate-200 p-3 text-sm font-medium">{file.name}</div>
                ))}
              </div>
            )}
            <button type="button" disabled={processing || files.length === 0} onClick={convert} className="mt-6 w-full rounded-xl bg-blue-700 px-6 py-4 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400">
              {processing ? "Converting…" : "Convert to PDF"}
            </button>
            {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
            {downloadUrl && <a href={downloadUrl} download="images.pdf" className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800">Download PDF</a>}
          </div>
        </div>
      </section>
    </main>
  );
}
