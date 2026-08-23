"use client";

import { ChangeEvent, DragEvent, useEffect, useState } from "react";
import ToolShell from "@/app/components/tool-shell";
import { validateImageFile, deduplicateFiles } from "@/lib/file-validation";

const MAX_COUNT = 20;
const ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
type Mode = "fit" | "exact" | "percentage";
type Format = "original" | "jpeg" | "png" | "webp";
type Item = { id: string; file: File; preview: string };
type Result = { name: string; originalName: string; originalWidth: number; originalHeight: number; width: number; height: number; originalSize: number; resizedSize: number; data: string };

function size(value: number) {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function imageUrl(data: string, name: string) {
    const binary = atob(data);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const extension = name.split(".").pop();
    return URL.createObjectURL(new Blob([bytes], { type: extension === "jpg" ? "image/jpeg" : `image/${extension}` }));
}

export default function ImageResizerTool() {
    const [items, setItems] = useState<Item[]>([]);
    const [mode, setMode] = useState<Mode>("fit");
    const [format, setFormat] = useState<Format>("original");
    const [width, setWidth] = useState("1200");
    const [height, setHeight] = useState("1200");
    const [percentage, setPercentage] = useState("50");
    const [keepRatio, setKeepRatio] = useState(true);
    const [dragging, setDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [results, setResults] = useState<Result[]>([]);
    const [zipUrl, setZipUrl] = useState("");
    const [creditInfo, setCreditInfo] = useState<{ used?: number; remaining?: number } | null>(null);

    useEffect(() => () => {
        items.forEach((item) => URL.revokeObjectURL(item.preview));
        if (zipUrl) URL.revokeObjectURL(zipUrl);
    }, [items, zipUrl]);

    const add = (files: FileList | File[]) => {
        setError("");
        setResults([]);
        if (zipUrl) {
            URL.revokeObjectURL(zipUrl);
            setZipUrl("");
        }
        const selected = Array.from(files);
        if (!selected.length) return;

        for (const file of selected) {
            const val = validateImageFile(file);
            if (!val.valid) {
                setError(`${file.name} — ${val.error}: ${val.errorDetail || ""}`);
                return;
            }
        }

        const { unique, duplicatesCount } = deduplicateFiles(items.map((i) => i.file), selected);
        if (!unique.length && duplicatesCount > 0) {
            setError("The selected image(s) have already been added.");
            return;
        }

        if (items.length + unique.length > MAX_COUNT) {
            setError(`Choose no more than ${MAX_COUNT} images.`);
            return;
        }

        setItems((current) => [...current, ...unique.map((file) => ({ id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, file, preview: URL.createObjectURL(file) }))]);
    };

    const choose = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) add(event.target.files);
        event.target.value = "";
    };

    const drop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragging(false);
        add(event.dataTransfer.files);
    };

    const remove = (id: string) => {
        setItems((current) => {
            const item = current.find((entry) => entry.id === id);
            if (item) URL.revokeObjectURL(item.preview);
            return current.filter((entry) => entry.id !== id);
        });
        setResults([]);
    };

    const clear = () => {
        items.forEach((item) => URL.revokeObjectURL(item.preview));
        setItems([]);
        setResults([]);
        if (zipUrl) {
            URL.revokeObjectURL(zipUrl);
            setZipUrl("");
        }
    };

    const resize = async () => {
        if (!items.length || processing) return;
        setProcessing(true);
        setError("");
        try {
            const body = new FormData();
            items.forEach((item) => body.append("files", item.file));
            body.append("mode", mode);
            body.append("format", format);
            body.append("keepRatio", String(keepRatio));
            body.append("width", width);
            body.append("height", height);
            body.append("percentage", percentage);
            const response = await fetch("/api/resize-image", { method: "POST", body });
            const payload = await response.json() as { error?: string; results?: Result[]; zip?: string; creditsUsed?: number; creditsRemaining?: number };
            if (!response.ok || !payload.results || !payload.zip) throw new Error(payload.error || "Image resizing failed.");
            const creditsUsed = payload.creditsUsed ?? Number(response.headers.get("X-Credits-Used")) ?? 3;
            const creditsRemaining = payload.creditsRemaining ?? Number(response.headers.get("X-Credits-Remaining"));
            setCreditInfo({ used: creditsUsed, remaining: isNaN(creditsRemaining) ? undefined : creditsRemaining });
            setResults(payload.results);
            const binary = atob(payload.zip);
            const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
            setZipUrl(URL.createObjectURL(new Blob([bytes], { type: "application/zip" })));
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Image resizing failed.");
        } finally {
            setProcessing(false);
        }
    };

    const outputTotal = results.reduce((sum, result) => sum + result.resizedSize, 0);

    return (
        <ToolShell
            category="Images"
            title="Image Resizer"
            badge="Image Tools"
            description="Resize JPG, PNG, and WebP images to exact pixel dimensions or scaling percentages with aspect ratio lock."
            howItWorksSteps={[
                "Select one or more images from your device.",
                "Choose dimensions, scale percentage, and aspect ratio option.",
                "Download your resized image files or complete ZIP archive."
            ]}
            faqs={[
                {
                    question: "What is the difference between Fit and Exact mode?",
                    answer: "Fit scales the image to fit within the box without distorting proportions, while Exact forces both width and height."
                },
                {
                    question: "Can I convert format while resizing?",
                    answer: "Yes, you can convert to JPG, PNG, or WebP during the resize step."
                },
                {
                    question: "Are transparent PNGs supported?",
                    answer: "Yes, PNG and WebP transparency is fully preserved when resizing."
                }
            ]}
            relatedTools={[
                { name: "Image Compressor", href: "/image-compressor" },
                { name: "50KB Compressor", href: "/compress-image-to-50kb" },
                { name: "JPG to PDF", href: "/jpg-to-pdf" }
            ]}
        >
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
                <div
                    onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={drop}
                    className={`rounded-xl border-2 border-dashed py-5 px-4 text-center transition sm:py-6 sm:px-5 ${dragging ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-slate-50/60"}`}
                >
                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-xs font-bold text-sky-700" aria-hidden="true">IMG</div>
                    <h2 className="mt-2 text-sm sm:text-base font-semibold text-slate-900">Drop images here</h2>
                    <p className="mt-0.5 text-xs text-slate-500">JPG, PNG, or WebP · up to {MAX_COUNT} images</p>
                    <label className="mt-2.5 inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-sky-500 px-4 text-xs font-semibold text-white hover:bg-sky-600 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-400 shadow-2xs">
                        Choose Images
                        <input type="file" multiple accept={ACCEPT} className="sr-only" onChange={choose} />
                    </label>
                    <p className="mt-1.5 text-[11px] text-slate-400">Batch image resizing supported</p>
                </div>

                {items.length > 0 && (
                    <div className="mt-3.5 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                            <span>Selected images ({items.length})</span>
                            <button type="button" onClick={clear} disabled={processing} className="text-red-600 hover:underline disabled:opacity-50">
                                Clear all
                            </button>
                        </div>

                        <div className="grid gap-1.5 sm:grid-cols-2 max-h-40 overflow-y-auto pr-1">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-xs">
                                    <img src={item.preview} alt={`Preview of ${item.file.name}`} className="h-8 w-8 rounded object-cover flex-shrink-0" />
                                    <div className="min-w-0 flex-1 truncate">
                                        <p className="truncate font-medium text-slate-900">{index + 1}. {item.file.name}</p>
                                        <p className="text-[11px] text-slate-500">{size(item.file.size)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => remove(item.id)}
                                        disabled={processing}
                                        aria-label={`Remove ${item.file.name}`}
                                        className="rounded px-1 text-xs text-red-600 hover:bg-red-50"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        {!results.length && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
                                <div className="grid gap-2.5 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="resize-mode" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">Resize mode</label>
                                        <select
                                            id="resize-mode"
                                            value={mode}
                                            onChange={(event) => setMode(event.target.value as Mode)}
                                            disabled={processing}
                                            className="mt-1 h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                        >
                                            <option value="fit">Fit within dimensions</option>
                                            <option value="exact">Exact dimensions</option>
                                            <option value="percentage">Percentage scaling</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="output-format" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">Output format</label>
                                        <select
                                            id="output-format"
                                            value={format}
                                            onChange={(event) => setFormat(event.target.value as Format)}
                                            disabled={processing}
                                            className="mt-1 h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                        >
                                            <option value="original">Keep original format</option>
                                            <option value="jpeg">JPG</option>
                                            <option value="png">PNG</option>
                                            <option value="webp">WebP</option>
                                        </select>
                                    </div>
                                </div>

                                {mode === "percentage" ? (
                                    <div>
                                        <label htmlFor="percentage" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">Percentage (1-100%)</label>
                                        <input
                                            id="percentage"
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={percentage}
                                            onChange={(event) => setPercentage(event.target.value)}
                                            className="mt-1 h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="grid gap-2.5 sm:grid-cols-2">
                                            <div>
                                                <label htmlFor="width" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">Width (px)</label>
                                                <input
                                                    id="width"
                                                    type="number"
                                                    min="1"
                                                    max="8000"
                                                    value={width}
                                                    onChange={(event) => setWidth(event.target.value)}
                                                    className="mt-1 h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="height" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">Height (px)</label>
                                                <input
                                                    id="height"
                                                    type="number"
                                                    min="1"
                                                    max="8000"
                                                    value={height}
                                                    onChange={(event) => setHeight(event.target.value)}
                                                    className="mt-1 h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                                />
                                            </div>
                                        </div>
                                        <label className="flex items-center gap-1.5 pt-0.5 text-xs text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={keepRatio}
                                                onChange={(event) => setKeepRatio(event.target.checked)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            />
                                            <span>Maintain aspect ratio</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}

                        {!results.length && (
                            <div className="flex flex-col items-center pt-1">
                                <button
                                    type="button"
                                    onClick={resize}
                                    disabled={processing}
                                    aria-busy={processing}
                                    aria-label={processing ? "Resizing images" : `Resize ${items.length} images`}
                                    className="flex h-11 w-full sm:w-auto sm:min-w-[220px] items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-2xs"
                                >
                                    {processing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />}
                                    <span>{processing ? "Resizing images…" : `Resize ${items.length} image${items.length === 1 ? "" : "s"}`}</span>
                                </button>
                                <div className="mt-1.5 flex items-center gap-2">
                                    <span className="text-[11px] font-medium text-slate-500">
                                        <span className="text-amber-500 font-bold">⚡</span> 3 credits required
                                    </span>
                                </div>
                                {processing && (
                                    <p className="mt-1.5 text-center text-xs text-slate-500" role="status">
                                        Resampling dimensions and rendering output files…
                                    </p>
                                )}
                            </div>
                        )}
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

                {results.length > 0 && (
                    <div className="mt-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-emerald-800 text-xs font-bold">✓</span>
                                <h2 className="text-xs sm:text-sm font-semibold text-emerald-950">Images resized successfully</h2>
                            </div>
                            {creditInfo && typeof creditInfo.used === "number" && (
                                <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                                    ✓ {creditInfo.used} credits used {typeof creditInfo.remaining === "number" ? `• ${creditInfo.remaining} remaining` : ""}
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-xs text-emerald-900">{results.length} image{results.length === 1 ? "" : "s"} · Total output {size(outputTotal)}</p>

                        <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1">
                            {results.map((result) => {
                                const url = imageUrl(result.data, result.name);
                                return (
                                    <article key={result.name} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs">
                                        <img src={url} alt={`Resized preview of ${result.originalName}`} className="h-10 w-10 rounded bg-slate-100 object-contain flex-shrink-0" />
                                        <div className="min-w-0 flex-1 truncate">
                                            <h3 className="truncate font-semibold text-slate-900">{result.originalName}</h3>
                                            <p className="text-[11px] text-slate-500">{result.originalWidth}×{result.originalHeight} → <span className="text-emerald-700 font-medium">{result.width}×{result.height}</span></p>
                                        </div>
                                        <a href={url} download={result.name} className="rounded px-2 py-1 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-colors">
                                            Download
                                        </a>
                                    </article>
                                );
                            })}
                        </div>

                        <div className="mt-3 flex flex-col sm:flex-row items-center gap-2.5">
                            {results.length === 1 ? (
                                <a
                                    href={imageUrl(results[0].data, results[0].name)}
                                    download={results[0].name}
                                    className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-xl bg-emerald-600 px-5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                                >
                                    Download
                                </a>
                            ) : zipUrl ? (
                                <a
                                    href={zipUrl}
                                    download="resized-images.zip"
                                    className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-xl bg-emerald-600 px-5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                                >
                                    Download ZIP
                                </a>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => { setResults([]); if (zipUrl) { URL.revokeObjectURL(zipUrl); setZipUrl(""); } }}
                                className="text-xs font-medium text-emerald-800 underline underline-offset-4 hover:text-emerald-950"
                            >
                                Resize more images
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ToolShell>
    );
}
