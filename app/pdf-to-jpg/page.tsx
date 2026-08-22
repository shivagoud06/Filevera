"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import ToolShell from "@/app/components/tool-shell";

export default function PdfToJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (selected: File | undefined) => {
    if (!selected) return;
    if (!/\.pdf$/i.test(selected.name) && selected.type !== "application/pdf") {
      setError("Please choose a valid PDF file.");
      return;
    }
    setFile(selected);
    setError("");
    setDownloadUrl("");
  };

  const handleChoose = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
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
    <ToolShell
      category="PDF"
      title="Convert PDF to JPG"
      badge="PDF Tools"
      description="Extract every page of your PDF document into crisp, high-resolution JPG images."
      howItWorksSteps={[
        "Upload any PDF document.",
        "Click Convert to JPG to process all pages.",
        "Download your JPG images as an organized ZIP archive."
      ]}
      faqs={[
        {
          question: "Will every page of the PDF be extracted?",
          answer: "Yes, our server extracts each page as an individual full-resolution JPG image."
        },
        {
          question: "How are the images delivered?",
          answer: "All converted JPG images are automatically compressed into a single, clean ZIP download."
        },
        {
          question: "Is there any watermark on the output images?",
          answer: "Never. All Filevera outputs are 100% watermark-free."
        }
      ]}
      relatedTools={[
        { name: "JPG to PDF", href: "/jpg-to-pdf" },
        { name: "Compress PDF", href: "/compress-pdf" },
        { name: "Split PDF", href: "/split-pdf" },
        { name: "Image Resizer", href: "/image-resizer" }
      ]}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed py-5 px-4 text-center transition sm:py-6 sm:px-5 ${isDragging ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-slate-50/60"}`}
        >
          {!file ? (
            <>
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-xs font-bold text-sky-700" aria-hidden="true">PDF</div>
              <h2 className="mt-2 text-sm sm:text-base font-semibold text-slate-900">Drop your PDF here</h2>
              <p className="mt-0.5 text-xs text-slate-500">or choose a file from your device</p>
              <label className="mt-2.5 inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-sky-500 px-4 text-xs font-semibold text-white hover:bg-sky-600 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-400 shadow-2xs">
                Choose PDF
                <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={handleChoose} />
              </label>
              <p className="mt-1.5 text-[11px] text-slate-400">PDF up to 25 MB</p>
            </>
          ) : (
            <div className="text-left">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-3 border border-slate-200 shadow-xs">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-semibold text-slate-900">{file.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">Ready to convert to JPG</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setDownloadUrl(""); }}
                  className="self-start rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 sm:self-auto"
                >
                  Change file
                </button>
              </div>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-3.5 flex flex-col items-center pt-1">
            <button
              type="button"
              disabled={processing || !file}
              onClick={convert}
              className="flex h-11 w-full sm:w-auto sm:min-w-[220px] items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-2xs"
            >
              {processing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />}
              {processing ? "Converting to JPG…" : "Convert to JPG"}
            </button>
          </div>
        )}

        {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700" role="alert">{error}</p>}

        {downloadUrl && (
          <div className="mt-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center sm:text-left">
            <h2 className="text-xs sm:text-sm font-semibold text-emerald-950">JPG images ready</h2>
            <p className="mt-0.5 text-xs text-emerald-900">Your PDF pages have been converted to JPG and compressed into a ZIP archive.</p>
            <div className="mt-2.5 flex flex-col sm:flex-row items-center gap-2.5">
              <a
                href={downloadUrl}
                download="pages.zip"
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-xl bg-emerald-600 px-5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                Download ZIP
              </a>
              <button
                type="button"
                onClick={() => { setFile(null); setDownloadUrl(""); }}
                className="text-xs font-medium text-emerald-800 underline underline-offset-4 hover:text-emerald-950"
              >
                Convert another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
