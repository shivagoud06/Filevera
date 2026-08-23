"use client";

import { ChangeEvent, DragEvent, useEffect, useState } from "react";
import TargetSizeInput from "@/app/components/target-size-input";
import ToolShell from "@/app/components/tool-shell";
import { bytesFromTargetSize, formatFileSize, TargetUnit } from "@/lib/target-size";
import { trackToolEvent } from "@/lib/analytics";
import { validatePdfFile } from "@/lib/file-validation";

const PRESET_VALUES = { "500kb": ["500", "KB"], "1mb": ["1", "MB"], "2mb": ["2", "MB"], "5mb": ["5", "MB"] } as const;

type Result = {
    originalSize: number;
    compressedSize: number;
    targetBytes: number;
    reachedTarget: boolean;
    downloadUrl: string;
    creditsUsed?: number;
    creditsRemaining?: number;
};

async function looksLikePdf(file: File) {
    const sample = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
    const text = new TextDecoder("ascii").decode(sample);
    return text.includes("%PDF-");
}

function reduction(original: number, compressed: number) {
    return Math.max(0, ((original - compressed) / original) * 100).toFixed(1);
}

export default function CompressPdfToSizeTool({ initialTarget = "1mb" }: { initialTarget?: keyof typeof PRESET_VALUES }) {
    const [file, setFile] = useState<File | null>(null);
    const [targetValue, setTargetValue] = useState<string>(PRESET_VALUES[initialTarget][0]);
    const [targetUnit, setTargetUnit] = useState<TargetUnit>(PRESET_VALUES[initialTarget][1]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<Result | null>(null);
    const targetBytes = bytesFromTargetSize(targetValue, targetUnit);
    const targetError = !targetValue.trim() ? "Target size is required." : targetBytes ? "" : "Enter a positive number up to 50 MB.";
    const downloadName = file ? `${file.name.replace(/\.pdf$/i, "") || "compressed"}-compressed.pdf` : "compressed.pdf";

    useEffect(() => () => {
        if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
    }, [result]);

    const selectFile = async (selectedFile: File | undefined) => {
        setError("");
        setResult(null);
        if (!selectedFile) return;

        const val = validatePdfFile(selectedFile);
        if (!val.valid) {
            setFile(null);
            setError(`${val.error}${val.errorDetail ? ": " + val.errorDetail : ""}`);
            return;
        }

        if (!(await looksLikePdf(selectedFile))) {
            setFile(null);
            setError("This file does not appear to be a valid PDF.");
            return;
        }
        setFile(selectedFile);
        trackToolEvent("upload_started", "compress-pdf");
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        void selectFile(event.dataTransfer.files[0]);
    };

    const handleChoose = (event: ChangeEvent<HTMLInputElement>) => {
        void selectFile(event.target.files?.[0]);
        event.target.value = "";
    };

    const removeFile = () => {
        setFile(null);
        setResult(null);
        setError("");
    };

    const compress = async () => {
        if (!file || isProcessing) return;
        setError("");
        setResult(null);
        setIsProcessing(true);
        trackToolEvent("processing_started", "compress-pdf");

        try {
            const body = new FormData();
            body.append("file", file);
            body.append("targetValue", targetValue);
            body.append("targetUnit", targetUnit);
            const response = await fetch("/api/compress-pdf-to-size", { method: "POST", body });
            if (!response.ok) {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                throw new Error(payload?.error || "We could not compress this PDF.");
            }
            const compressed = await response.blob();
            if (!targetBytes) throw new Error("Choose a valid target size.");
            const creditsUsed = Number(response.headers.get("X-Credits-Used")) || 5;
            const creditsRemaining = Number(response.headers.get("X-Credits-Remaining")) || 0;

            setResult({
                originalSize: Number(response.headers.get("X-Original-Size")) || file.size,
                compressedSize: Number(response.headers.get("X-Compressed-Size")) || compressed.size,
                targetBytes,
                reachedTarget: response.headers.get("X-Target-Reached") === "true",
                downloadUrl: URL.createObjectURL(compressed),
                creditsUsed,
                creditsRemaining,
            });
            trackToolEvent("processing_success", "compress-pdf");
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "We could not compress this PDF.");
            trackToolEvent("processing_failure", "compress-pdf");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolShell
            category="PDF"
            title="Compress PDF to Target Size"
            badge="PDF Tools"
            description="Select a target file size (e.g. 500KB, 1MB, 2MB) and our multi-pass compression engine will optimize your PDF with the highest possible visual clarity."
            howItWorksSteps={[
                "Upload any PDF document up to 25 MB.",
                "Specify your target size limit in KB or MB.",
                "Download the compressed PDF instantly."
            ]}
            faqs={[
                {
                    question: "How does target size compression work?",
                    answer: "Our backend tests multiple Ghostscript compression parameters (DPI downsampling, image stream compression, and font subsetting) to reach your target file size without excessive degradation."
                },
                {
                    question: "What if the PDF cannot reach the exact target?",
                    answer: "If the requested target is lower than what is achievable without extreme distortion, Filevera automatically delivers the maximum compression possible and notifies you with clear metrics."
                },
                {
                    question: "Are my compressed PDFs stored on your server?",
                    answer: "No. Files are processed in isolated memory directories and permanently wiped immediately after download generation."
                }
            ]}
            relatedTools={[
                { name: "Compress to 1MB", href: "/compress-pdf-to-1mb" },
                { name: "Compress to 500KB", href: "/compress-pdf-to-500kb" },
                { name: "Merge PDF", href: "/merge-pdf" },
                { name: "Split PDF", href: "/split-pdf" },
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
                                <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={handleChoose} />
                            </label>
                            <p className="mt-1.5 text-[11px] text-slate-400">PDF up to 25 MB</p>
                        </>
                    ) : (
                        <div className="text-left">
                            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-3 border border-slate-200 shadow-xs">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs sm:text-sm font-semibold text-slate-900">{file.name}</p>
                                    <p className="text-[11px] text-slate-500">Original size: {formatFileSize(file.size)}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    disabled={isProcessing}
                                    className="self-start rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 sm:self-auto"
                                >
                                    Remove file
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {!result && (
                    <div className="mt-4 space-y-3.5">
                        <fieldset disabled={isProcessing} className="min-w-0">
                            <TargetSizeInput
                                id="pdf-target-size"
                                label="Target size"
                                value={targetValue}
                                unit={targetUnit}
                                onValueChange={setTargetValue}
                                onUnitChange={setTargetUnit}
                                disabled={isProcessing}
                                error={targetError}
                            />
                        </fieldset>

                        <div className="flex flex-col items-center pt-1">
                            <button
                                type="button"
                                onClick={compress}
                                disabled={isProcessing || !file || !targetBytes}
                                className="flex h-11 w-full sm:w-auto sm:min-w-[220px] items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-2xs"
                            >
                                {isProcessing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />}
                                {isProcessing ? "Compressing PDF..." : "Compress PDF"}
                            </button>
                            {isProcessing && (
                                <p className="mt-1.5 text-center text-xs text-slate-500" role="status">
                                    Testing multi-pass compression settings...
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {result && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 sm:p-4" role="status">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-emerald-800 text-xs font-bold">✓</span>
                                <h2 className="text-xs sm:text-sm font-semibold text-emerald-950">
                                    {result.reachedTarget ? "Target size achieved" : "Best achievable compression ready"}
                                </h2>
                            </div>
                            {typeof result.creditsUsed === "number" && (
                                <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                                    ✓ {result.creditsUsed} credits used {typeof result.creditsRemaining === "number" ? `• ${result.creditsRemaining} remaining` : ""}
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-xs text-emerald-900">
                            {result.reachedTarget
                                ? "Your PDF has been compressed to the requested target size."
                                : "Quality limit reached; best valid file size generated."}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5 rounded-lg bg-white/90 p-2.5 border border-emerald-100">
                            <div><p className="text-slate-500">Original</p><p className="font-semibold text-slate-900">{formatFileSize(result.originalSize)}</p></div>
                            <div><p className="text-slate-500">Target</p><p className="font-semibold text-slate-900">{formatFileSize(result.targetBytes)}</p></div>
                            <div><p className="text-slate-500">Final</p><p className="font-semibold text-emerald-700">{formatFileSize(result.compressedSize)}</p></div>
                            <div><p className="text-slate-500">Saved</p><p className="font-semibold text-emerald-700">{formatFileSize(Math.max(0, result.originalSize - result.compressedSize))}</p></div>
                            <div><p className="text-slate-500">Reduction</p><p className="font-semibold text-emerald-700">{reduction(result.originalSize, result.compressedSize)}%</p></div>
                        </div>
                        <div className="mt-3 flex flex-col sm:flex-row items-center gap-2.5">
                            <a
                                href={result.downloadUrl}
                                download={downloadName}
                                onClick={() => trackToolEvent("download", "compress-pdf")}
                                className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-xl bg-emerald-600 px-5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                            >
                                Download
                            </a>
                            <button
                                type="button"
                                onClick={removeFile}
                                className="text-xs font-medium text-emerald-800 underline underline-offset-4 hover:text-emerald-950"
                            >
                                Compress another PDF
                            </button>
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
            </div>
        </ToolShell>
    );
}
