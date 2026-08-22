"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import ToolShell from "@/app/components/tool-shell";

const ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";
const MAX_IMAGES = 20;

export default function JpgToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = (incoming: FileList | File[]) => {
    const selected = Array.from(incoming);
    if (!selected.length) return;
    if (files.length + selected.length > MAX_IMAGES) {
      setError(`Choose up to ${MAX_IMAGES} images.`);
      return;
    }
    const invalid = selected.find((file) => !["image/jpeg", "image/png"].includes(file.type) && !/\.(jpe?g|png)$/i.test(file.name));
    if (invalid) {
      setError(`${invalid.name} is not a valid JPG or PNG image.`);
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

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index));
    setDownloadUrl("");
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
    <ToolShell
      category="PDF"
      title="Convert JPG to PDF"
      badge="PDF Tools"
      description="Turn multiple JPG and PNG image files into a single, high-resolution PDF document."
      howItWorksSteps={[
        "Upload one or more JPG/PNG photos.",
        "Verify the selected list and click Convert to PDF.",
        "Download your compiled PDF document immediately."
      ]}
      faqs={[
        {
          question: "Can I combine both JPG and PNG files?",
          answer: "Yes, Filevera accepts mixed batches of JPG, JPEG, and PNG images in a single conversion."
        },
        {
          question: "What is the maximum number of images allowed?",
          answer: "You can convert up to 20 images at once."
        },
        {
          question: "Does conversion lower image sharpness?",
          answer: "No, images are embedded into the PDF with original dimensions and color accuracy intact."
        }
      ]}
      relatedTools={[
        { name: "PDF to JPG", href: "/pdf-to-jpg" },
        { name: "Compress PDF", href: "/compress-pdf" },
        { name: "Image Compressor", href: "/image-compressor" }
      ]}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed py-5 px-4 text-center transition sm:py-6 sm:px-5 ${isDragging ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-slate-50/60"}`}
        >
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-xs font-bold text-sky-700" aria-hidden="true">IMG</div>
          <h2 className="mt-2 text-sm sm:text-base font-semibold text-slate-900">Drop images here</h2>
          <p className="mt-0.5 text-xs text-slate-500">JPG or PNG · up to {MAX_IMAGES} images</p>
          <label className="mt-2.5 inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-sky-500 px-4 text-xs font-semibold text-white hover:bg-sky-600 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-400 shadow-2xs">
            Choose Images
            <input type="file" accept={ACCEPT} multiple className="sr-only" onChange={handleChoose} />
          </label>
          <p className="mt-1.5 text-[11px] text-slate-400">Multiple image selection supported</p>
        </div>

        {files.length > 0 && (
          <div className="mt-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Selected images ({files.length})</span>
              <button type="button" onClick={() => setFiles([])} className="text-red-600 hover:underline">Clear all</button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {files.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className="font-bold text-slate-400">{idx + 1}.</span>
                    <span className="truncate font-medium text-slate-800">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
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
                disabled={processing || files.length === 0}
                onClick={convert}
                className="flex h-11 w-full sm:w-auto sm:min-w-[220px] items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-2xs"
              >
                {processing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />}
                {processing ? "Converting to PDF…" : `Convert ${files.length} image${files.length === 1 ? "" : "s"} to PDF`}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700" role="alert">{error}</p>}

        {downloadUrl && (
          <div className="mt-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center sm:text-left">
            <h2 className="text-xs sm:text-sm font-semibold text-emerald-950">PDF is ready</h2>
            <p className="mt-0.5 text-xs text-emerald-900">Your images have been converted into a single PDF document.</p>
            <div className="mt-2.5 flex flex-col sm:flex-row items-center gap-2.5">
              <a
                href={downloadUrl}
                download="images.pdf"
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-xl bg-emerald-600 px-5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                Download PDF
              </a>
              <button
                type="button"
                onClick={() => { setFiles([]); setDownloadUrl(""); }}
                className="text-xs font-medium text-emerald-800 underline underline-offset-4 hover:text-emerald-950"
              >
                Convert more images
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
