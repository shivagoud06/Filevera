"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import ToolShell from "@/app/components/tool-shell";
import { validatePdfFile } from "@/lib/file-validation";

export default function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState("1-2,4");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [creditInfo, setCreditInfo] = useState<{ used?: number; remaining?: number } | null>(null);

  const handleFile = (selected: File | undefined) => {
    if (!selected) return;
    const val = validatePdfFile(selected);
    if (!val.valid) {
      setError(`${val.error}: ${val.errorDetail || ""}`);
      return;
    }
    setFile(selected);
    setError("");
    setDownloadUrl("");
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const [downloadFilename, setDownloadFilename] = useState<string>("split-pages.zip");
  const [isZipResult, setIsZipResult] = useState<boolean>(true);

  const split = async () => {
    if (!file || processing) return;
    setProcessing(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("ranges", ranges);
      const response = await fetch("/api/split-pdf", { method: "POST", body: form });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Could not split the PDF.");
      }
      const creditsUsed = Number(response.headers.get("X-Credits-Used")) || 5;
      const creditsRemaining = Number(response.headers.get("X-Credits-Remaining"));
      setCreditInfo({ used: creditsUsed, remaining: isNaN(creditsRemaining) ? undefined : creditsRemaining });

      const contentType = response.headers.get("Content-Type") || "";
      const disposition = response.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch ? filenameMatch[1] : (contentType.includes("zip") ? "split-pages.zip" : "page.pdf");
      const isZip = contentType.includes("zip") || filename.endsWith(".zip");

      setDownloadFilename(filename);
      setIsZipResult(isZip);
      const blob = await response.blob();
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not split the PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolShell
      category="PDF"
      title="Split PDF Pages"
      badge="PDF Tools"
      description="Extract specific page ranges or split a large PDF into individual documents in seconds."
      howItWorksSteps={[
        "Upload your PDF document.",
        "Specify the pages or page ranges you wish to extract.",
        "Download your extracted PDF or ZIP archive immediately."
      ]}
      faqs={[
        {
          question: "How do I format the page ranges?",
          answer: "Use commas for single pages (e.g. 1, 3, 5) and hyphens for consecutive ranges (e.g. 1-4, 8-12)."
        },
        {
          question: "Can I extract pages from password-protected PDFs?",
          answer: "For security reasons, password-protected files must have their encryption removed prior to splitting."
        },
        {
          question: "Is there a limit on how many pages I can split?",
          answer: "You can split documents of any page count within the 25 MB file upload limit."
        }
      ]}
      relatedTools={[
        { name: "Merge PDF", href: "/merge-pdf" },
        { name: "Compress PDF", href: "/compress-pdf" },
        { name: "PDF to JPG", href: "/pdf-to-jpg" },
        { name: "JPG to PDF", href: "/jpg-to-pdf" }
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
                <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event: ChangeEvent<HTMLInputElement>) => handleFile(event.target.files?.[0])} />
              </label>
              <p className="mt-1.5 text-[11px] text-slate-400">PDF up to 25 MB</p>
            </>
          ) : (
            <div className="text-left">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-3 border border-slate-200 shadow-xs">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-semibold text-slate-900">{file.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">Ready to split</p>
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
          <div className="mt-3.5 space-y-3.5">
            <div>
              <label htmlFor="ranges" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Pages to export
              </label>
              <input
                id="ranges"
                value={ranges}
                onChange={(event) => setRanges(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                placeholder="Example: 1-3, 5, 8-10"
              />
              <p className="mt-1 text-[11px] text-slate-500">Specify single pages or comma-separated ranges.</p>
            </div>

            <div className="flex flex-col items-center pt-1">
              <button
                type="button"
                disabled={processing || !file}
                onClick={split}
                aria-busy={processing}
                aria-label={processing ? "Splitting PDF" : "Split PDF"}
                className="flex h-11 w-full sm:w-auto sm:min-w-[220px] items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-2xs"
              >
                {processing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />}
                <span>{processing ? "Splitting PDF…" : "Split PDF"}</span>
              </button>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">
                  <span className="text-amber-500 font-bold">⚡</span> 5 credits required
                </span>
              </div>
              {processing && (
                <p className="mt-1.5 text-center text-xs text-slate-500" role="status">
                  Extracting requested pages from document…
                </p>
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
              <h2 className="text-xs sm:text-sm font-semibold text-emerald-950">Pages extracted successfully</h2>
              {creditInfo && typeof creditInfo.used === "number" && (
                <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  ✓ {creditInfo.used} credits used {typeof creditInfo.remaining === "number" ? `• ${creditInfo.remaining} remaining` : ""}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-emerald-900">Your requested pages are ready for download.</p>
            <div className="mt-2.5 flex flex-col sm:flex-row items-center gap-2.5">
              <a
                href={downloadUrl}
                download={downloadFilename || (isZipResult ? "split-pages.zip" : "page.pdf")}
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-xl bg-emerald-600 px-5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                {isZipResult ? "Download ZIP" : "Download"}
              </a>
              <button
                type="button"
                onClick={() => { setFile(null); setDownloadUrl(""); }}
                className="text-xs font-medium text-emerald-800 underline underline-offset-4 hover:text-emerald-950"
              >
                Split another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
