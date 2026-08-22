"use client";

import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import TargetSizeInput from "@/app/components/target-size-input";
import ToolShell from "@/app/components/tool-shell";
import { bytesFromTargetSize, formatFileSize, TargetUnit } from "@/lib/target-size";
import { trackToolEvent } from "@/lib/analytics";

const ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
const MAX_IMAGES = 20;

type Result = {
  name: string;
  originalName: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  reachedTarget: boolean;
  data: string;
};

function reduction(original: number, compressed: number) {
  if (original <= 0) return "0.0";
  return Math.max(0, ((original - compressed) / original) * 100).toFixed(1);
}

export default function ImageCompressorTool({
  initialValue = "1",
  initialUnit = "MB",
  pageTitle = "Image Compressor"
}: {
  initialValue?: string;
  initialUnit?: TargetUnit;
  pageTitle?: string;
}) {
  const [items, setItems] = useState<File[]>([]);
  const [targetValue, setTargetValue] = useState(initialValue);
  const [targetUnit, setTargetUnit] = useState<TargetUnit>(initialUnit);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [zipUrl, setZipUrl] = useState("");
  const targetBytes = bytesFromTargetSize(targetValue, targetUnit);
  const targetError = !targetValue.trim() ? "Target size is required." : targetBytes ? "" : "Enter a positive number up to 100 MB.";

  const totalOriginal = useMemo(
    () => results.reduce((sum, item) => sum + item.originalSize, 0),
    [results],
  );
  const totalCompressed = useMemo(
    () => results.reduce((sum, item) => sum + item.compressedSize, 0),
    [results],
  );

  const addFiles = (incoming: FileList | File[]) => {
    const selected = Array.from(incoming);
    if (!selected.length) return;
    if (items.length + selected.length > MAX_IMAGES) {
      setError(`Choose no more than ${MAX_IMAGES} images.`);
      return;
    }

    const invalid = selected.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name));
    if (invalid) {
      setError(`${invalid.name} is not a supported JPG, PNG, or WebP image.`);
      return;
    }

    setItems((current) => [...current, ...selected]);
    trackToolEvent("upload_started", "compress-image");
    setError("");
    setResults([]);
    if (zipUrl) {
      URL.revokeObjectURL(zipUrl);
      setZipUrl("");
    }
  };

  const removeItem = (name: string) => {
    setItems((current) => current.filter((file) => file.name !== name));
    setResults([]);
  };

  const handleChoose = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addFiles(event.target.files);
      event.target.value = "";
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const compress = async () => {
    if (!items.length || processing) return;
    setProcessing(true);
    trackToolEvent("processing_started", "compress-image");
    setError("");
    try {
      const form = new FormData();
      items.forEach((file) => form.append("files", file));
      form.append("targetValue", targetValue);
      form.append("targetUnit", targetUnit);

      const response = await fetch("/api/compress-image", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as { error?: string; results?: Result[]; zip?: string };
      if (!response.ok || !payload.results || !payload.zip) {
        throw new Error(payload.error || "Image compression failed.");
      }

      const binary = atob(payload.zip);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      setResults(payload.results);
      setZipUrl(URL.createObjectURL(new Blob([bytes], { type: "application/zip" })));
      trackToolEvent("processing_success", "compress-image");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Image compression failed.");
      trackToolEvent("processing_failure", "compress-image");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolShell
      category="Images"
      title={pageTitle}
      badge="Image Tools"
      description="Compress JPG, PNG, and WebP images to your desired target file size without losing sharpness."
      howItWorksSteps={[
        "Upload one or more JPG, PNG, or WebP images.",
        "Set your target size limit (e.g. 50KB, 100KB, 500KB).",
        "Download your compressed images or a consolidated ZIP archive."
      ]}
      faqs={[
        {
          question: "Can I compress multiple images simultaneously?",
          answer: "Yes, you can batch compress up to 20 images in a single step."
        },
        {
          question: "Which image formats are supported?",
          answer: "Filevera supports JPG, JPEG, PNG, and modern WebP formats."
        },
        {
          question: "How does Filevera maintain image clarity?",
          answer: "Our pipeline uses Sharp's native mozjpeg, libpng, and libwebp compression algorithms to strip non-visual metadata and optimize color quantization."
        }
      ]}
      relatedTools={[
        { name: "50KB Target", href: "/compress-image-to-50kb" },
        { name: "100KB Target", href: "/compress-image-to-100kb" },
        { name: "Image Resizer", href: "/image-resizer" },
        { name: "JPG to PDF", href: "/jpg-to-pdf" }
      ]}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed py-5 px-4 text-center transition sm:py-6 sm:px-5 ${dragging ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-slate-50/60"}`}
        >
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-xs font-bold text-sky-700" aria-hidden="true">IMG</div>
          <h2 className="mt-2 text-sm sm:text-base font-semibold text-slate-900">Drop images here</h2>
          <p className="mt-0.5 text-xs text-slate-500">JPG, PNG, or WebP · up to {MAX_IMAGES} images</p>
          <label className="mt-2.5 inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-sky-500 px-4 text-xs font-semibold text-white hover:bg-sky-600 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-400 shadow-2xs">
            Choose Images
            <input type="file" multiple accept={ACCEPT} className="sr-only" onChange={handleChoose} />
          </label>
          <p className="mt-1.5 text-[11px] text-slate-400">Multiple image compression supported</p>
        </div>

        <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-3.5">
          <TargetSizeInput id="image-target-size" label="Reduce image to" value={targetValue} unit={targetUnit} onValueChange={setTargetValue} onUnitChange={setTargetUnit} disabled={processing} error={targetError} />
        </div>

        {items.length > 0 && (
          <div className="mt-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Selected images ({items.length})</span>
              <button type="button" onClick={() => setItems([])} className="text-red-600 hover:underline">
                Clear all
              </button>
            </div>

            <div className="grid gap-1.5 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1">
              {items.map((file) => (
                <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-xs">
                  <div className="min-w-0 flex-1 truncate">
                    <p className="truncate font-medium text-slate-900">{file.name}</p>
                    <p className="text-[11px] text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button type="button" onClick={() => removeItem(file.name)} className="ml-2 rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50 transition-colors">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center pt-1.5">
              <button
                type="button"
                onClick={compress}
                disabled={processing || !items.length || !targetBytes}
                className="flex h-11 w-full sm:w-auto sm:min-w-[220px] items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-wait disabled:bg-slate-300 shadow-2xs"
              >
                {processing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />}
                {processing ? "Compressing images..." : `Compress ${items.length} image${items.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700" role="alert">
            {error}
          </p>
        )}

        {results.length > 0 && (
          <div className="mt-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-emerald-800 text-xs font-bold">✓</span>
              <h2 className="text-xs sm:text-sm font-semibold text-emerald-950">
                {results.every((result) => result.reachedTarget) ? "Target reached" : "Best achievable compression ready"}
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-emerald-900">Target limit: {targetValue} {targetUnit}</p>

            <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 rounded-lg bg-white/90 p-2.5 border border-emerald-100">
              <div>
                <p className="text-slate-500">Original</p>
                <p className="font-semibold text-slate-900">{formatFileSize(totalOriginal)}</p>
              </div>
              <div>
                <p className="text-slate-500">Compressed</p>
                <p className="font-semibold text-emerald-700">{formatFileSize(totalCompressed)}</p>
              </div>
              <div>
                <p className="text-slate-500">Savings</p>
                <p className="font-semibold text-emerald-700">{reduction(totalOriginal, totalCompressed)}%</p>
              </div>
              <div>
                <p className="text-slate-500">Files</p>
                <p className="font-semibold text-slate-900">{results.length}</p>
              </div>
            </div>

            <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2 max-h-40 overflow-y-auto pr-1">
              {results.map((result) => (
                <div key={result.name} className="rounded-lg border border-emerald-200 bg-white p-2 text-xs">
                  <p className="truncate font-semibold text-slate-900">{result.name}</p>
                  <p className="mt-0.5 text-slate-500">
                    {formatFileSize(result.originalSize)} → <span className="font-medium text-emerald-700">{formatFileSize(result.compressedSize)}</span>
                  </p>
                </div>
              ))}
            </div>

            {zipUrl && (
              <div className="mt-3 flex flex-col sm:flex-row items-center gap-2.5">
                <a href={zipUrl} download="compressed-images.zip" onClick={() => trackToolEvent("download", "compress-image")} className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-xl bg-emerald-600 px-5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs">
                  Download ZIP
                </a>
                <button
                  type="button"
                  onClick={() => { setItems([]); setResults([]); if (zipUrl) { URL.revokeObjectURL(zipUrl); setZipUrl(""); } }}
                  className="text-xs font-medium text-emerald-800 underline underline-offset-4 hover:text-emerald-950"
                >
                  Compress more images
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
