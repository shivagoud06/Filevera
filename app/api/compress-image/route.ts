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
    compressImageToTarget,
    createZip,
    safeFilename,
} from "@/lib/image-compression";
import { bytesFromTargetSize, isTargetUnit } from "@/lib/target-size";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: string, status = 400, extra: Record<string, unknown> = {}) {
    return NextResponse.json({ error, ...extra }, { status });
}

export async function POST(request: Request) {
    let reservedUserId: string | null = null;
    let reservedCredits = 0;

    try {
        const reqHeaders = await nextHeaders();
        const session = await auth.api.getSession({ headers: reqHeaders });
        if (!session) {
            return errorResponse("Authentication required. Please log in to compress images.", 401, {
                code: "AUTH_REQUIRED",
            });
        }

        const formData = await request.formData();
        const entries = formData.getAll("files");
        const targetValue = formData.get("targetValue");
        const targetUnit = formData.get("targetUnit");
        if (typeof targetValue !== "string" || !isTargetUnit(targetUnit)) return errorResponse("Choose a valid target size.");
        const targetBytes = bytesFromTargetSize(targetValue, targetUnit);
        if (!targetBytes) return errorResponse("Target size must be a positive number no larger than 100 MB.");
        if (entries.length === 0) return errorResponse("Choose at least one image.");

        const files = entries.filter((entry): entry is File => entry instanceof File);
        if (files.length !== entries.length) return errorResponse("One or more uploaded items were not valid files.");

        // Check plan limits
        const usage = await ensureUserUsage(session.user.id);
        const limitCheck = checkPlanLimits(usage.plan, {
            batchCount: files.length,
        });
        if (!limitCheck.valid) {
            return errorResponse(limitCheck.error || "Batch size exceeds your plan limit.", 413, {
                code: "LIMIT_EXCEEDED",
            });
        }

        for (const file of files) {
            const fileCheck = checkPlanLimits(usage.plan, {
                fileBytes: file.size,
                fileType: "image",
            });
            if (!fileCheck.valid) {
                return errorResponse(fileCheck.error || "One of the images exceeds your plan size limit.", 413, {
                    code: "LIMIT_EXCEEDED",
                });
            }
        }

        // Reserve & deduct credits (5 credits for compress_image)
        const deduction = await reserveAndDeductCredits(session.user.id, "compress_image");
        if (!deduction.success) {
            return errorResponse(deduction.error || "Not enough credits for this operation.", 402, {
                code: "INSUFFICIENT_CREDITS",
                required: deduction.required,
                available: deduction.remaining,
            });
        }

        reservedUserId = session.user.id;
        reservedCredits = deduction.required;

        const results = [];
        const zipFiles: { name: string; data: Buffer }[] = [];
        for (const file of files) {
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                await refundReservedCredits(session.user.id, deduction.required);
                return errorResponse(`${file.name} is not a supported JPG, PNG, or WebP image.`, 415);
            }
            const input = Buffer.from(await file.arrayBuffer());
            const result = await compressImageToTarget(input, file.type, targetBytes);
            const filename = safeFilename(file.name, result.format);
            zipFiles.push({ name: filename, data: result.output });
            results.push({
                name: filename,
                originalName: file.name,
                originalSize: input.length,
                compressedSize: result.output.length,
                width: result.width,
                height: result.height,
                reachedTarget: result.reachedTarget,
                data: result.output.toString("base64"),
            });
        }

        const zip = await createZip(zipFiles);

        // Commit usage record
        await commitCreditUsage(session.user.id, "compress_image", deduction.required, deduction.remaining);

        return NextResponse.json(
            {
                results,
                zip: zip.toString("base64"),
                creditsUsed: deduction.required,
                creditsRemaining: deduction.remaining,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                    "X-Credits-Used": String(deduction.required),
                    "X-Credits-Remaining": String(deduction.remaining),
                },
            }
        );
    } catch (error) {
        if (reservedUserId && reservedCredits > 0) {
            await refundReservedCredits(reservedUserId, reservedCredits);
        }
        const message = error instanceof Error ? error.message : "IMAGE_PROCESSING_FAILED";
        if (message === "UNSUPPORTED_IMAGE") return errorResponse("Only JPG, PNG, and WebP images are supported.", 415);
        if (message === "IMAGE_DIMENSIONS_TOO_LARGE") return errorResponse("One image has too many pixels to process safely.", 413);
        console.error("compress-image failed", error);
        return errorResponse("We could not compress these images. One may be damaged or unsupported.", 500);
    }
}
