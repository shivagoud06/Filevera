import { NextResponse } from "next/server";
import {
    compressToTarget,
    hasPdfSignature,
    MAX_UPLOAD_BYTES,
} from "@/lib/pdf-compression";
import { bytesFromTargetSize, isTargetUnit } from "@/lib/target-size";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status: number) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const entry = formData.get("file");
        const targetValueEntry = formData.get("targetValue");
        const targetUnitEntry = formData.get("targetUnit");

        if (!(entry instanceof File)) {
            return errorResponse("Choose a PDF file to compress.", 400);
        }
        if (typeof targetValueEntry !== "string" || !isTargetUnit(targetUnitEntry)) {
            return errorResponse("Choose a valid target size.", 400);
        }
        const targetBytes = bytesFromTargetSize(targetValueEntry, targetUnitEntry);
        if (!targetBytes) return errorResponse("Target size must be a positive number no larger than 100 MB.", 400);
        if (entry.size === 0) {
            return errorResponse("The selected file is empty.", 400);
        }
        if (entry.size > MAX_UPLOAD_BYTES) {
            return errorResponse(`Files must be ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB or smaller.`, 413);
        }

        const input = Buffer.from(await entry.arrayBuffer());
        if (!hasPdfSignature(input)) {
            return errorResponse("This file does not appear to be a valid PDF.", 415);
        }

        const result = await compressToTarget(input, targetBytes);
        const filename = `${entry.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.pdf$/i, "") || "compressed"}-compressed.pdf`;
        const headers = new Headers({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": String(result.output.length),
            "Cache-Control": "no-store",
            "X-Original-Size": String(input.length),
            "X-Compressed-Size": String(result.output.length),
            "X-Target-Reached": String(result.reachedTarget),
            "X-Compression-Preset": result.preset,
        });

        return new Response(new Uint8Array(result.output), { headers });
    } catch (error) {
        const message = error instanceof Error ? error.message : "PDF processing failed.";
        if (message === "PDF_ENGINE_MISSING") {
            return errorResponse("PDF compression is not available yet. Install Ghostscript and set GHOSTSCRIPT_PATH if it is not on PATH.", 503);
        }
        if (message === "PDF_PROCESSING_TIMEOUT") {
            return errorResponse("PDF processing took too long. Try a smaller or simpler PDF.", 504);
        }
        console.error("compress-pdf-to-size failed", error);
        return errorResponse("We could not compress this PDF. The file may be damaged or unsupported.", 500);
    }
}
