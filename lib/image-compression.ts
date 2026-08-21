import sharp from "sharp";
import JSZip from "jszip";
import { MAX_TARGET_BYTES } from "./target-size";

export const MAX_IMAGE_COUNT = Number(process.env.MAX_IMAGE_COUNT ?? 20);
export const MAX_IMAGE_BYTES = Number(process.env.MAX_IMAGE_BYTES ?? 10 * 1024 * 1024);
export const MAX_TOTAL_IMAGE_BYTES = Number(process.env.MAX_TOTAL_IMAGE_BYTES ?? 50 * 1024 * 1024);
export const MAX_IMAGE_PIXELS = Number(process.env.MAX_IMAGE_PIXELS ?? 40_000_000);

export const LEVELS = {
    balanced: { jpeg: 82, webp: 82, png: 8 },
    high: { jpeg: 68, webp: 68, png: 9 },
    maximum: { jpeg: 48, webp: 48, png: 9 },
} as const;

export type CompressionLevel = keyof typeof LEVELS;
export type SupportedFormat = "jpeg" | "png" | "webp";

export function isCompressionLevel(value: FormDataEntryValue | null): value is CompressionLevel {
    return typeof value === "string" && value in LEVELS;
}

export function safeFilename(name: string, extension: SupportedFormat): string {
    const base = name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_") || "image";
    return `${base}-compressed.${extension}`;
}

function formatForMime(mime: string): SupportedFormat | null {
    if (mime === "image/jpeg") return "jpeg";
    if (mime === "image/png") return "png";
    if (mime === "image/webp") return "webp";
    return null;
}

export async function compressImage(input: Buffer, mime: string, level: CompressionLevel): Promise<{
    output: Buffer;
    format: SupportedFormat;
    width: number;
    height: number;
    usedOriginal: boolean;
}> {
    const format = formatForMime(mime);
    if (!format) throw new Error("UNSUPPORTED_IMAGE");
    const source = sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, sequentialRead: true });
    const metadata = await source.metadata();
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
        throw new Error("IMAGE_DIMENSIONS_TOO_LARGE");
    }

    const settings = LEVELS[level];
    const pipeline = sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, sequentialRead: true }).rotate();
    if (format === "jpeg") pipeline.jpeg({ quality: settings.jpeg, progressive: true, mozjpeg: true });
    if (format === "webp") pipeline.webp({ quality: settings.webp, effort: 6 });
    if (format === "png") pipeline.png({ compressionLevel: settings.png, adaptiveFiltering: true, effort: 7 });
    const compressed = await pipeline.toBuffer();
    const usedOriginal = compressed.length >= input.length;

    return {
        output: usedOriginal ? input : compressed,
        format,
        width: metadata.width,
        height: metadata.height,
        usedOriginal,
    };
}

export async function compressImageToTarget(input: Buffer, mime: string, targetBytes: number): Promise<{
    output: Buffer;
    format: SupportedFormat;
    width: number;
    height: number;
    reachedTarget: boolean;
}> {
    if (!Number.isSafeInteger(targetBytes) || targetBytes <= 0 || targetBytes > MAX_TARGET_BYTES) throw new Error("INVALID_TARGET_SIZE");
    const format = formatForMime(mime);
    if (!format) throw new Error("UNSUPPORTED_IMAGE");
    const source = sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, sequentialRead: true });
    const metadata = await source.metadata();
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) throw new Error("IMAGE_DIMENSIONS_TOO_LARGE");

    const candidates: Buffer[] = [];
    const qualities = format === "png" ? [9] : [88, 76, 64, 52, 40, 30];
    const scales = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4];
    for (const scale of scales) {
        for (const quality of qualities) {
            const pipeline = sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, sequentialRead: true }).rotate();
            if (scale < 1) pipeline.resize({ width: Math.max(1, Math.round(metadata.width * scale)), height: Math.max(1, Math.round(metadata.height * scale)), fit: "inside", withoutEnlargement: true });
            if (format === "jpeg") pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
            if (format === "webp") pipeline.webp({ quality, effort: 6 });
            if (format === "png") pipeline.png({ compressionLevel: quality, adaptiveFiltering: true, effort: 7 });
            candidates.push(await pipeline.toBuffer());
        }
    }
    const valid = candidates.filter((candidate) => candidate.length <= targetBytes);
    const output = (valid.length ? valid : candidates).reduce((smallest, candidate) => candidate.length < smallest.length ? candidate : smallest);
    return { output, format, width: metadata.width, height: metadata.height, reachedTarget: output.length <= targetBytes };
}

export async function createZip(files: { name: string; data: Buffer }[]): Promise<Buffer> {
    const zip = new JSZip();
    for (const file of files) zip.file(file.name, file.data);
    return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
