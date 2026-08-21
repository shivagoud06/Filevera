"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, useEffect, useState } from "react";
import TargetSizeInput from "@/app/components/target-size-input";
import SiteHeader from "@/app/components/site-header";
import Breadcrumbs from "@/app/components/breadcrumbs";
import { bytesFromTargetSize, formatFileSize, TargetUnit } from "@/lib/target-size";
import { trackToolEvent } from "@/lib/analytics";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const PRESET_VALUES = { "500kb": ["500", "KB"], "1mb": ["1", "MB"], "2mb": ["2", "MB"], "5mb": ["5", "MB"] } as const;

type Result = {
    originalSize: number;
    compressedSize: number;
    targetBytes: number;
    reachedTarget: boolean;
    downloadUrl: string;
};

function reduction(original: number, compressed: number) {
    return Math.max(0, ((original - compressed) / original) * 100).toFixed(1);
}

async function looksLikePdf(file: File) {
    const sample = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
    const text = new TextDecoder("ascii").decode(sample);
    return text.includes("%PDF-");
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
    const targetError = !targetValue.trim() ? "Target size is required." : targetBytes ? "" : "Enter a positive number up to 100 MB.";
    const downloadName = file ? `${file.name.replace(/\.pdf$/i, "") || "compressed"}-compressed.pdf` : "compressed.pdf";

    useEffect(() => () => {
        if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
    }, [result]);

    const selectFile = async (selectedFile: File | undefined) => {
        setError("");
        setResult(null);
        if (!selectedFile) return;
        if (!selectedFile.name.toLowerCase().endsWith(".pdf") || selectedFile.type !== "application/pdf") {
            setFile(null);
            setError("Please choose a PDF file with a .pdf extension.");
            return;
        }
        if (selectedFile.size === 0) {
            setFile(null);
            setError("The selected file is empty.");
            return;
        }
        if (selectedFile.size > MAX_UPLOAD_BYTES) {
            setFile(null);
            setError("Files must be 25 MB or smaller.");
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
            setResult({
                originalSize: Number(response.headers.get("X-Original-Size")) || file.size,
                compressedSize: Number(response.headers.get("X-Compressed-Size")) || compressed.size,
                targetBytes,
                reachedTarget: response.headers.get("X-Target-Reached") === "true",
                downloadUrl: URL.createObjectURL(compressed),
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
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <SiteHeader />
            <Breadcrumbs category="PDF" current="Compress PDF" />

            <section className="px-5 py-12 sm:px-8 sm:py-16">
                <div className="mx-auto max-w-3xl">
                    <div className="text-center">
                        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">PDF tools</p>
                        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Compress PDF to Target Size</h1>
                        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">Choose a maximum file size and we will try several real compression settings to get your PDF there without sacrificing more quality than necessary.</p>
                    </div>

                    <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                        <div
                            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`rounded-2xl border-2 border-dashed p-8 text-center transition sm:p-12 ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50/70"}`}
                        >
                            {!file ? (
                                <>
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-700" aria-hidden="true">PDF</div>
                                    <h2 className="mt-5 text-xl font-semibold">Drop your PDF here</h2>
                                    <p className="mt-2 text-sm text-slate-500">or choose a file from your device</p>
                                    <label className="mt-6 inline-flex cursor-pointer rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
                                        Choose PDF
                                        <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={handleChoose} />
                                    </label>
                                    <p className="mt-4 text-xs text-slate-500">PDF only · Maximum 25 MB</p>
                                </>
                            ) : (
                                <div className="text-left">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-slate-900">{file.name}</p>
                                            <p className="mt-1 text-sm text-slate-500">Original size: {formatFileSize(file.size)}</p>
                                        </div>
                                        <button type="button" onClick={removeFile} disabled={isProcessing} className="self-start rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 sm:self-auto">Remove / replace</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!result && (
                            <div className="mt-7">
                                <fieldset disabled={isProcessing} className="min-w-0">
                                    <TargetSizeInput id="pdf-target-size" label="Target size" value={targetValue} unit={targetUnit} onValueChange={setTargetValue} onUnitChange={setTargetUnit} disabled={isProcessing} error={targetError} />
                                </fieldset>
                                <button type="button" onClick={compress} disabled={isProcessing || !file || !targetBytes} className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl bg-blue-700 px-6 py-4 font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400">
                                    {isProcessing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />}
                                    {isProcessing ? "Compressing and checking target..." : "Compress PDF"}
                                </button>
                                {isProcessing && <p className="mt-3 text-center text-sm text-slate-500" role="status">The server is testing multiple compression settings. This may take a moment.</p>}
                            </div>
                        )}

                        {result && (
                            <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="status">
                                <h2 className="text-lg font-semibold text-emerald-950">{result.reachedTarget ? "Target reached" : "Best achievable result"}</h2>
                                <p className="mt-2 text-sm leading-6 text-emerald-900">{result.reachedTarget ? "The requested target was reached." : "The requested target could not be reached without excessive quality loss. The best valid result is ready to download."}</p>
                                <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                                    <div><p className="text-emerald-700">Original</p><p className="mt-1 font-semibold">{formatFileSize(result.originalSize)}</p></div>
                                    <div><p className="text-emerald-700">Target</p><p className="mt-1 font-semibold">{formatFileSize(result.targetBytes)}</p></div>
                                    <div><p className="text-emerald-700">Final</p><p className="mt-1 font-semibold">{formatFileSize(result.compressedSize)}</p></div>
                                    <div><p className="text-emerald-700">Saved</p><p className="mt-1 font-semibold">{formatFileSize(Math.max(0, result.originalSize - result.compressedSize))}</p></div>
                                    <div><p className="text-emerald-700">Reduction</p><p className="mt-1 font-semibold">{reduction(result.originalSize, result.compressedSize)}%</p></div>
                                </div>
                                <a href={result.downloadUrl} download={downloadName} onClick={() => trackToolEvent("download", "compress-pdf")} className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:w-auto">Download compressed PDF</a>
                                <button type="button" onClick={removeFile} className="mt-3 block text-sm font-medium text-emerald-900 underline underline-offset-4 hover:text-emerald-700">Compress another PDF</button>
                            </div>
                        )}

                        {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800" role="alert">{error}</p>}
                    </div>

                    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
                        <div className="flex gap-4"><div className="text-sm font-bold text-blue-700" aria-hidden="true">INFO</div><div><h2 className="font-semibold">Temporary processing</h2><p className="mt-1 text-sm leading-6 text-slate-600">Uploads are kept in temporary server files while they are processed, then the processing directory is removed.</p></div></div>
                    </div>

                    <nav className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-blue-700" aria-label="Related PDF tools"><Link href="/compress-pdf-to-1mb" className="rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-blue-300">Compress PDF to 1MB</Link><Link href="/compress-pdf-to-500kb" className="rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-blue-300">Compress PDF to 500KB</Link><Link href="/merge-pdf" className="rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-blue-300">Merge PDF</Link><Link href="/split-pdf" className="rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-blue-300">Split PDF</Link></nav>
                    <section className="mt-14" aria-labelledby="how-to-heading">
                        <h2 id="how-to-heading" className="text-2xl font-bold">How to compress a PDF to a target size</h2>
                        <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            {[['01', 'Upload', 'Choose a PDF up to 25 MB.'], ['02', 'Set a limit', 'Enter any positive size in KB or MB.'], ['03', 'Download', 'We test settings and return the best result.']].map(([number, heading, copy]) => <div key={number} className="rounded-2xl bg-white p-5"><div className="font-bold text-blue-700">{number}</div><h3 className="mt-3 font-semibold">{heading}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></div>)}
                        </div>
                        <p className="mt-7 text-sm leading-7 text-slate-600">Target-size compression is useful for email attachments, online forms and portals with strict upload limits. Image-heavy PDFs may not reach the smallest targets without a visible quality tradeoff.</p>
                    </section>
                </div>
            </section>
        </main>
    );
}
