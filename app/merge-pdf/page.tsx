"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import ToolShell from "@/app/components/tool-shell";

const MAX_FILES = 10;

export default function MergePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [creditInfo, setCreditInfo] = useState<{ used?: number; remaining?: number } | null>(null);

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
    setDownloadUrl("");
  };

  const handleChoose = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addFiles(event.target.files);
      event.target.value = "";
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files) {
      addFiles(event.dataTransfer.files);
    }
  };

  const removeFile = (name: string) => {
    setFiles((current) => current.filter((file) => `${file.name}-${file.size}` !== name));
    setDownloadUrl("");
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
      const creditsUsed = Number(response.headers.get("X-Credits-Used")) || 5;
      const creditsRemaining = Number(response.headers.get("X-Credits-Remaining"));
      setCreditInfo({ used: creditsUsed, remaining: isNaN(creditsRemaining) ? undefined : creditsRemaining });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not merge PDF files.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolShell
      category="PDF"
      title="Merge PDF Files"
      badge="PDF Tools"
      description="Combine multiple PDF documents into a single organized file in seconds."
      howItWorksSteps={[
        "Choose or drop multiple PDF files in your preferred order.",
        "Verify your uploaded documents and click Merge PDFs.",
        "Download your combined single PDF document instantly."
      ]}
      faqs={[
        {
          question: "Can I choose the order of the merged PDF?",
          answer: "Yes, files will be merged in the exact sequence they appear in your selected files list."
        },
        {
          question: "How many PDFs can I merge at once?",
          answer: "You can combine up to 10 PDF documents simultaneously in one operation."
        },
        {
          question: "Does merging PDFs reduce document quality?",
          answer: "No, merging preserves original vector lines, text, bookmarks, and image resolutions."
        }
      ]}
      relatedTools={[
        { name: "Split PDF", href: "/split-pdf" },
        { name: "Compress PDF", href: "/compress-pdf" },
        { name: "JPG to PDF", href: "/jpg-to-pdf" },
        { name: "PDF to JPG", href: "/pdf-to-jpg" }
      ]}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed py-5 px-4 text-center transition sm:py-6 sm:px-5 ${isDragging ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-slate-50/60"}`}
        >
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-xs font-bold text-sky-700" aria-hidden="true">PDF</div>
          <h2 className="mt-2 text-sm sm:text-base font-semibold text-slate-900">Drop your PDFs here</h2>
          <p className="mt-0.5 text-xs text-slate-500">or choose multiple files from your device</p>
          <label className="mt-2.5 inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-sky-500 px-4 text-xs font-semibold text-white hover:bg-sky-600 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-400 shadow-2xs">
            Choose PDFs
            <input type="file" accept="application/pdf,.pdf" multiple className="sr-only" onChange={handleChoose} />
          </label>
          <p className="mt-1.5 text-[11px] text-slate-400">Up to {MAX_FILES} PDFs</p>
        </div>

        {files.length > 0 && (
          <div className="mt-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Selected files ({files.length})</span>
              <button type="button" onClick={() => setFiles([])} className="text-red-600 hover:underline">Clear all</button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {files.map((file, idx) => (
                <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className="font-bold text-slate-400">{idx + 1}.</span>
                    <span className="truncate font-medium text-slate-800">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(`${file.name}-${file.size}`)}
                    className="ml-2 rounded px-2 py-0.5 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center pt-2">
              <button
                type="button"
                disabled={processing || files.length < 2}
                onClick={merge}
                className="flex h-11 w-full sm:w-auto sm:min-w-[220px] items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-2xs"
              >
                {processing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />}
                {processing ? "Merging PDFs…" : `Merge ${files.length} PDFs`}
              </button>
              {files.length < 2 && (
                <p className="mt-1.5 text-[11px] text-slate-500">Select at least 2 PDF files to merge</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
            <p className="font-semibold">{error}</p>
            {error.includes("credit") && (
              <div className="mt-2 flex items-center gap-2">
                <a
                  href="/pricing"
                  className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-600 shadow-2xs"
                >
                  Get Pro
                </a>
                <a
                  href="/pricing"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Upgrade Plan
                </a>
              </div>
            )}
            {error.includes("log in") && (
              <div className="mt-2">
                <a
                  href="/login"
                  className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 shadow-2xs"
                >
                  Log In to Filevera
                </a>
              </div>
            )}
          </div>
        )}

        {downloadUrl && (
          <div className="mt-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center sm:text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-semibold text-emerald-950">PDFs merged successfully</h2>
              {creditInfo && typeof creditInfo.used === "number" && (
                <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  ✓ {creditInfo.used} credits used {typeof creditInfo.remaining === "number" ? `• ${creditInfo.remaining} remaining` : ""}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-emerald-900">Your combined PDF is ready to download.</p>
            <div className="mt-2.5 flex flex-col sm:flex-row items-center gap-2.5">
              <a
                href={downloadUrl}
                download="merged.pdf"
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-xl bg-emerald-600 px-5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                Download Merged PDF
              </a>
              <button
                type="button"
                onClick={() => { setFiles([]); setDownloadUrl(""); }}
                className="text-xs font-medium text-emerald-800 underline underline-offset-4 hover:text-emerald-950"
              >
                Merge more files
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
