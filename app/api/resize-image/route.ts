import { NextResponse } from "next/server";
import sharp from "sharp";
import {
    createZip,
    MAX_IMAGE_BYTES,
    MAX_IMAGE_COUNT,
    MAX_IMAGE_PIXELS,
    MAX_TOTAL_IMAGE_BYTES,
} from "@/lib/image-compression";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DIMENSION = Number(process.env.MAX_RESIZE_DIMENSION ?? 8000);
const FORMATS = ["original", "jpeg", "png", "webp"] as const;
const MODES = ["fit", "exact", "percentage"] as const;
type OutputFormat = typeof FORMATS[number];
type ResizeMode = typeof MODES[number];

function errorResponse(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }
function numberField(form: FormData, name: string) { const value = Number(form.get(name)); return Number.isFinite(value) && value > 0 ? value : null; }
function safeName(name: string, extension: string) { return `${name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_") || "image"}-resized.${extension}`; }

export async function POST(request: Request) {
    try {
        const form = await request.formData();
        const entries = form.getAll("files");
        const mode = form.get("mode");
        const format = form.get("format");
        const keepRatio = form.get("keepRatio") === "true";
        if (!entries.length) return errorResponse("Choose at least one image.");
        if (entries.length > MAX_IMAGE_COUNT) return errorResponse(`Choose no more than ${MAX_IMAGE_COUNT} images.`);
        if (typeof mode !== "string" || !MODES.includes(mode as ResizeMode)) return errorResponse("Choose a valid resize mode.");
        if (typeof format !== "string" || !FORMATS.includes(format as OutputFormat)) return errorResponse("Choose a valid output format.");

        const width = mode === "percentage" ? null : numberField(form, "width");
        const height = mode === "percentage" ? null : numberField(form, "height");
        const percentage = mode === "percentage" ? numberField(form, "percentage") : null;
        if (mode === "percentage" && (!percentage || percentage > 100)) return errorResponse("Enter a percentage from 1 to 100.");
        if (mode !== "percentage" && (!width || !height)) return errorResponse("Enter valid width and height values.");
        if ((width && width > MAX_DIMENSION) || (height && height > MAX_DIMENSION)) return errorResponse(`Dimensions must be ${MAX_DIMENSION}px or smaller.`);

        const files = entries.filter((entry): entry is File => entry instanceof File);
        if (files.length !== entries.length) return errorResponse("One or more uploaded items were not valid files.");
        const total = files.reduce((sum, file) => sum + file.size, 0);
        if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) return errorResponse("Only JPG, PNG, and WebP images are supported.", 415);
        if (files.some((file) => file.size === 0)) return errorResponse("Empty image files cannot be resized.");
        if (files.some((file) => file.size > MAX_IMAGE_BYTES)) return errorResponse("Each image must be 10 MB or smaller.", 413);
        if (total > MAX_TOTAL_IMAGE_BYTES) return errorResponse("All images together must be 50 MB or smaller.", 413);

        const results = [];
        const zipFiles: { name: string; data: Buffer }[] = [];
        for (const file of files) {
            const input = Buffer.from(await file.arrayBuffer());
            const source = sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, sequentialRead: true });
            const metadata = await source.metadata();
            if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) return errorResponse("An image exceeds the safe pixel limit.", 413);
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
            if (targetWidth * targetHeight > MAX_IMAGE_PIXELS || targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) return errorResponse("The requested output dimensions are too large.", 413);
            const outputFormat = format === "original" ? (metadata.format === "jpeg" ? "jpeg" : metadata.format === "png" ? "png" : "webp") : format;
            const pipeline = sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, sequentialRead: true }).resize({ width: targetWidth, height: targetHeight, fit: mode === "exact" && !keepRatio ? "fill" : "fill", kernel: sharp.kernel.lanczos3 });
            if (outputFormat === "jpeg") pipeline.jpeg({ quality: 90, progressive: true, mozjpeg: true });
            if (outputFormat === "png") pipeline.png({ compressionLevel: 9, adaptiveFiltering: true, effort: 7 });
            if (outputFormat === "webp") pipeline.webp({ quality: 90, effort: 6 });
            const output = await pipeline.toBuffer();
            const name = safeName(file.name, outputFormat === "jpeg" ? "jpg" : outputFormat);
            zipFiles.push({ name, data: output });
            results.push({ name, originalName: file.name, originalWidth: metadata.width, originalHeight: metadata.height, width: targetWidth, height: targetHeight, originalSize: input.length, resizedSize: output.length, data: output.toString("base64") });
        }
        const zip = await createZip(zipFiles);
        return NextResponse.json({ results, zip: zip.toString("base64") }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        console.error("resize-image failed", error);
        return errorResponse("We could not resize these images. One may be damaged or unsupported.", 500);
    }
}
