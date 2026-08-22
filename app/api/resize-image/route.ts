import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import {
    checkPlanLimits,
    commitCreditUsage,
    ensureUserUsage,
    refundReservedCredits,
    reserveAndDeductCredits,
} from "@/lib/credits";
import {
    createZip,
    MAX_IMAGE_PIXELS,
} from "@/lib/image-compression";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DIMENSION = Number(process.env.MAX_RESIZE_DIMENSION ?? 8000);
const FORMATS = ["original", "jpeg", "png", "webp"] as const;
const MODES = ["fit", "exact", "percentage"] as const;
type OutputFormat = typeof FORMATS[number];
type ResizeMode = typeof MODES[number];

function errorResponse(message: string, status = 400, extra: Record<string, unknown> = {}) {
    return NextResponse.json({ error: message, ...extra }, { status });
}
function numberField(form: FormData, name: string) {
    const value = Number(form.get(name));
    return Number.isFinite(value) && value > 0 ? value : null;
}
function safeName(name: string, extension: string) {
    return `${name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_") || "image"}-resized.${extension}`;
}

export async function POST(request: Request) {
    let reservedUserId: string | null = null;
    let reservedCredits = 0;

    try {
        const reqHeaders = await nextHeaders();
        const session = await auth.api.getSession({ headers: reqHeaders });
        if (!session) {
            return errorResponse("Authentication required. Please log in to resize images.", 401, {
                code: "AUTH_REQUIRED",
            });
        }

        const form = await request.formData();
        const entries = form.getAll("files");
        const mode = form.get("mode");
        const format = form.get("format");
        const keepRatio = form.get("keepRatio") === "true";
        if (!entries.length) return errorResponse("Choose at least one image.");

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

        if (typeof mode !== "string" || !MODES.includes(mode as ResizeMode)) return errorResponse("Choose a valid resize mode.");
        if (typeof format !== "string" || !FORMATS.includes(format as OutputFormat)) return errorResponse("Choose a valid output format.");

        const width = mode === "percentage" ? null : numberField(form, "width");
        const height = mode === "percentage" ? null : numberField(form, "height");
        const percentage = mode === "percentage" ? numberField(form, "percentage") : null;
        if (mode === "percentage" && (!percentage || percentage > 100)) return errorResponse("Enter a percentage from 1 to 100.");
        if (mode !== "percentage" && (!width || !height)) return errorResponse("Enter valid width and height values.");
        if ((width && width > MAX_DIMENSION) || (height && height > MAX_DIMENSION)) return errorResponse(`Dimensions must be ${MAX_DIMENSION}px or smaller.`);

        if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) return errorResponse("Only JPG, PNG, and WebP images are supported.", 415);
        if (files.some((file) => file.size === 0)) return errorResponse("Empty image files cannot be resized.");

        // Reserve & deduct credits (3 credits for resize_image)
        const deduction = await reserveAndDeductCredits(session.user.id, "resize_image");
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
            const input = Buffer.from(await file.arrayBuffer());
            const source = sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, sequentialRead: true });
            const metadata = await source.metadata();
            if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
                await refundReservedCredits(session.user.id, deduction.required);
                return errorResponse("An image exceeds the safe pixel limit.", 413);
            }
            let targetWidth: number;
            let targetHeight: number;
            if (mode === "percentage") {
                targetWidth = Math.max(1, Math.round(metadata.width * (percentage as number) / 100));
                targetHeight = Math.max(1, Math.round(metadata.height * (percentage as number) / 100));
            } else {
                targetWidth = Math.round(width as number);
                targetHeight = Math.round(height as number);
                if (keepRatio) {
                    const scale = Math.min(targetWidth / metadata.width, targetHeight / metadata.height);
                    targetWidth = Math.max(1, Math.round(metadata.width * scale));
                    targetHeight = Math.max(1, Math.round(metadata.height * scale));
                }
            }
            if (targetWidth * targetHeight > MAX_IMAGE_PIXELS || targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
                await refundReservedCredits(session.user.id, deduction.required);
                return errorResponse("The requested output dimensions are too large.", 413);
            }
            const outputFormat = format === "original" ? (metadata.format === "jpeg" ? "jpeg" : metadata.format === "png" ? "png" : "webp") : format;
            const pipeline = sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, sequentialRead: true }).resize({
                width: targetWidth,
                height: targetHeight,
                fit: mode === "exact" && !keepRatio ? "fill" : "fill",
                kernel: sharp.kernel.lanczos3,
            });
            if (outputFormat === "jpeg") pipeline.jpeg({ quality: 90, progressive: true, mozjpeg: true });
            if (outputFormat === "png") pipeline.png({ compressionLevel: 9, adaptiveFiltering: true, effort: 7 });
            if (outputFormat === "webp") pipeline.webp({ quality: 90, effort: 6 });
            const output = await pipeline.toBuffer();
            const name = safeName(file.name, outputFormat === "jpeg" ? "jpg" : outputFormat);
            zipFiles.push({ name, data: output });
            results.push({
                name,
                originalName: file.name,
                originalWidth: metadata.width,
                originalHeight: metadata.height,
                width: targetWidth,
                height: targetHeight,
                originalSize: input.length,
                resizedSize: output.length,
                data: output.toString("base64"),
            });
        }

        const zip = await createZip(zipFiles);

        // Commit usage record
        await commitCreditUsage(session.user.id, "resize_image", deduction.required, deduction.remaining);

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
        console.error("resize-image failed", error);
        return errorResponse("We could not resize these images. One may be damaged or unsupported.", 500);
    }
}
