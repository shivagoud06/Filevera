import { NextResponse } from "next/server";
import {
    compressImageToTarget,
    createZip,
    MAX_IMAGE_BYTES,
    MAX_IMAGE_COUNT,
    MAX_TOTAL_IMAGE_BYTES,
    safeFilename,
} from "@/lib/image-compression";
import { bytesFromTargetSize, isTargetUnit } from "@/lib/target-size";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: string, status = 400) {
    return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const entries = formData.getAll("files");
        const targetValue = formData.get("targetValue");
        const targetUnit = formData.get("targetUnit");
        if (typeof targetValue !== "string" || !isTargetUnit(targetUnit)) return errorResponse("Choose a valid target size.");
        const targetBytes = bytesFromTargetSize(targetValue, targetUnit);
        if (!targetBytes) return errorResponse("Target size must be a positive number no larger than 100 MB.");
        if (entries.length === 0) return errorResponse("Choose at least one image.");
        if (entries.length > MAX_IMAGE_COUNT) return errorResponse(`Choose no more than ${MAX_IMAGE_COUNT} images.`);

        const files = entries.filter((entry): entry is File => entry instanceof File);
        if (files.length !== entries.length) return errorResponse("One or more uploaded items were not valid files.");
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        if (files.some((file) => file.size === 0)) return errorResponse("Empty image files cannot be compressed.");
        if (files.some((file) => file.size > MAX_IMAGE_BYTES)) return errorResponse(`Each image must be ${Math.floor(MAX_IMAGE_BYTES / 1024 / 1024)} MB or smaller.`, 413);
        if (totalSize > MAX_TOTAL_IMAGE_BYTES) return errorResponse(`All images together must be ${Math.floor(MAX_TOTAL_IMAGE_BYTES / 1024 / 1024)} MB or smaller.`, 413);

        const results = [];
        const zipFiles: { name: string; data: Buffer }[] = [];
        for (const file of files) {
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return errorResponse(`${file.name} is not a supported JPG, PNG, or WebP image.`, 415);
            const input = Buffer.from(await file.arrayBuffer());
            const result = await compressImageToTarget(input, file.type, targetBytes);
            const filename = safeFilename(file.name, result.format);
            zipFiles.push({ name: filename, data: result.output });
            results.push({ name: filename, originalName: file.name, originalSize: input.length, compressedSize: result.output.length, width: result.width, height: result.height, reachedTarget: result.reachedTarget, data: result.output.toString("base64") });
        }

        const zip = await createZip(zipFiles);
        return NextResponse.json({ results, zip: zip.toString("base64") }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        const message = error instanceof Error ? error.message : "IMAGE_PROCESSING_FAILED";
        if (message === "UNSUPPORTED_IMAGE") return errorResponse("Only JPG, PNG, and WebP images are supported.", 415);
        if (message === "IMAGE_DIMENSIONS_TOO_LARGE") return errorResponse("One image has too many pixels to process safely.", 413);
        console.error("compress-image failed", error);
        return errorResponse("We could not compress these images. One may be damaged or unsupported.", 500);
    }
}
