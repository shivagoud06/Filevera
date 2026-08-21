"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import TargetSizeInput from "@/app/components/target-size-input";
import SiteHeader from "@/app/components/site-header";
import Breadcrumbs from "@/app/components/breadcrumbs";
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

export default function ImageCompressorTool({ initialValue = "1", initialUnit = "MB", pageTitle = "Image Compressor" }: { initialValue?: string; initialUnit?: TargetUnit; pageTitle?: string }) {
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
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader />
      <Breadcrumbs category="Images" current={pageTitle} />

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Image Tools</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{pageTitle}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Reduce the file size of JPG, PNG, and WebP images while keeping quality as high as possible.
            </p>
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-8 text-center transition sm:p-12 ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50/70"}`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-700" aria-hidden="true">IMG</div>
              <h2 className="mt-5 text-xl font-semibold">Drop images here</h2>
              <p className="mt-2 text-sm text-slate-500">JPG, PNG, or WebP · up to {MAX_IMAGES} images</p>
              <label className="mt-6 inline-flex cursor-pointer rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500">
                Choose Images
                <input type="file" multiple accept={ACCEPT} className="sr-only" onChange={handleChoose} />
              </label>
            </div>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <TargetSizeInput id="image-target-size" label="Reduce image to" value={targetValue} unit={targetUnit} onValueChange={setTargetValue} onUnitChange={setTargetUnit} disabled={processing} error={targetError} />
            </div>

            {items.length > 0 && (
              <div className="mt-7 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">Selected images ({items.length})</h2>
                  <button type="button" onClick={() => setItems([])} className="rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                    Clear
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((file) => (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                      </div>
                      <button type="button" onClick={() => removeItem(file.name)} className="rounded-lg px-2 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={compress}
                  disabled={processing || !items.length || !targetBytes}
                  className="w-full rounded-xl bg-blue-700 px-6 py-4 font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:bg-slate-400"
                >
                  {processing ? "Compressing..." : "Compress Image"}
                </button>
              </div>
            )}

            {error && (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800" role="alert">
                {error}
              </p>
            )}

            {results.length > 0 && (
              <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <h2 className="text-lg font-semibold text-emerald-950">{results.every((result) => result.reachedTarget) ? "Target reached" : "Best achievable results"}</h2>
                <p className="mt-2 text-sm text-emerald-900">Requested target: {targetValue} {targetUnit}</p>
                {!results.every((result) => result.reachedTarget) && <p className="mt-2 text-sm text-emerald-900">The requested target could not be reached without excessive quality loss. The best valid results are ready to download.</p>}
                <div className="mt-4 grid gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Original</p>
                    <p className="mt-1 font-semibold">{formatFileSize(totalOriginal)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Compressed</p>
                    <p className="mt-1 font-semibold">{formatFileSize(totalCompressed)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Savings</p>
                    <p className="mt-1 font-semibold">{reduction(totalOriginal, totalCompressed)}%</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Files</p>
                    <p className="mt-1 font-semibold">{results.length}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {results.map((result) => (
                    <div key={result.name} className="rounded-xl border border-emerald-200 bg-white p-3">
                      <p className="truncate text-sm font-semibold">{result.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatFileSize(result.originalSize)} → {formatFileSize(result.compressedSize)}
                      </p>
                      <p className="mt-1 text-xs text-emerald-700">{result.reachedTarget ? "Target reached" : "Requested target could not be reached without excessive quality loss."} · {reduction(result.originalSize, result.compressedSize)}% reduction</p>
                    </div>
                  ))}
                </div>

                {zipUrl && (
                  <a href={zipUrl} download="compressed-images.zip" onClick={() => trackToolEvent("download", "compress-image")} className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800 sm:w-auto">
                    Download ZIP
                  </a>
                )}
              </div>
            )}
            <nav className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-blue-700" aria-label="Related image tools"><Link href="/compress-image-to-50kb" className="rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-blue-300">Compress Image to 50KB</Link><Link href="/image-resizer" className="rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-blue-300">Resize Image</Link><Link href="/jpg-to-pdf" className="rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-blue-300">JPG to PDF</Link></nav>
          </div>
        </div>
      </section>
    </main>
  );
}
