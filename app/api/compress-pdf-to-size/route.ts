import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { auth } from "@/lib/auth";
import {
    checkPlanLimits,
    commitCreditUsage,
    ensureUserUsage,
    refundReservedCredits,
    reserveAndDeductCredits,
} from "@/lib/credits";
import {
    compressToTarget,
    hasPdfSignature,
} from "@/lib/pdf-compression";
import { bytesFromTargetSize, isTargetUnit } from "@/lib/target-size";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status: number, extra: Record<string, unknown> = {}) {
    return NextResponse.json({ error: message, ...extra }, { status });
}

export async function POST(request: Request) {
    let reservedUserId: string | null = null;
    let reservedCredits = 0;

    try {
        const reqHeaders = await nextHeaders();
        const session = await auth.api.getSession({ headers: reqHeaders });
        if (!session) {
            return errorResponse("Authentication required. Please log in to process files.", 401, {
                code: "AUTH_REQUIRED",
            });
        }

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
        if (!targetBytes) return errorResponse("Target size must be a positive number no larger than 250 MB.", 400);
        if (entry.size === 0) {
            return errorResponse("The selected file is empty.", 400);
        }

        // Server-side plan limit verification
        const usage = await ensureUserUsage(session.user.id);
        const limitCheck = checkPlanLimits(usage.plan, {
            fileBytes: entry.size,
            fileType: "pdf",
        });
        if (!limitCheck.valid) {
            return errorResponse(limitCheck.error || "File exceeds your plan size limit.", 413, {
                code: "LIMIT_EXCEEDED",
            });
        }

        const input = Buffer.from(await entry.arrayBuffer());
        if (!hasPdfSignature(input)) {
            return errorResponse("This file does not appear to be a valid PDF.", 415);
        }

        // Reserve & deduct credits server-side (5 credits for compress_pdf)
        const deduction = await reserveAndDeductCredits(session.user.id, "compress_pdf");
        if (!deduction.success) {
            return errorResponse(deduction.error || "Not enough credits for this operation.", 402, {
                code: "INSUFFICIENT_CREDITS",
                required: deduction.required,
                available: deduction.remaining,
            });
        }

        reservedUserId = session.user.id;
        reservedCredits = deduction.required;

        const result = await compressToTarget(input, targetBytes);
        const filename = `${entry.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.pdf$/i, "") || "compressed"}-compressed.pdf`;

        // Commit usage to history on success
        await commitCreditUsage(session.user.id, "compress_pdf", deduction.required, deduction.remaining);

        const responseHeaders = new Headers({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": String(result.output.length),
            "Cache-Control": "no-store",
            "X-Original-Size": String(input.length),
            "X-Compressed-Size": String(result.output.length),
            "X-Target-Reached": String(result.reachedTarget),
            "X-Compression-Preset": result.preset,
            "X-Credits-Used": String(deduction.required),
            "X-Credits-Remaining": String(deduction.remaining),
        });

        return new Response(new Uint8Array(result.output), { headers: responseHeaders });
    } catch (error) {
        if (reservedUserId && reservedCredits > 0) {
            await refundReservedCredits(reservedUserId, reservedCredits);
        }

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
