import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const MAX_UPLOAD_BYTES = Number(process.env.MAX_PDF_UPLOAD_BYTES ?? 25 * 1024 * 1024);
export const MAX_COMPRESSION_ATTEMPTS = 5;
export const PROCESS_TIMEOUT_MS = 60_000;

type CompressionPreset = {
    name: string;
    setting: "screen" | "ebook" | "printer" | "prepress";
};

const PRESETS: CompressionPreset[] = [
    { name: "balanced", setting: "ebook" },
    { name: "strong", setting: "screen" },
    { name: "print", setting: "printer" },
    { name: "high-quality", setting: "prepress" },
];

export function hasPdfSignature(buffer: Buffer): boolean {
    const start = buffer.subarray(0, 1024).toString("ascii");
    const end = buffer.subarray(Math.max(0, buffer.length - 2048)).toString("ascii");
    return start.includes("%PDF-") && end.includes("%%EOF");
}

function ghostscriptBinary(): string {
    return process.env.GHOSTSCRIPT_PATH || (process.platform === "win32" ? "gswin64c.exe" : "gs");
}

async function runGhostscript(inputPath: string, outputPath: string, setting: CompressionPreset["setting"]): Promise<void> {
    try {
        await execFileAsync(
            ghostscriptBinary(),
            [
                "-q",
                "-dSAFER",
                "-dBATCH",
                "-dNOPAUSE",
                "-sDEVICE=pdfwrite",
                `-dPDFSETTINGS=/${setting}`,
                "-dAutoRotatePages=/None",
                `-sOutputFile=${outputPath}`,
                inputPath,
            ],
            { windowsHide: true, timeout: PROCESS_TIMEOUT_MS, maxBuffer: 1024 * 1024 },
        );
    } catch (error) {
        const cause = error as NodeJS.ErrnoException & { killed?: boolean; stderr?: string };
        if (cause.code === "ENOENT") {
            throw new Error("PDF_ENGINE_MISSING");
        }
        if (cause.killed) {
            throw new Error("PDF_PROCESSING_TIMEOUT");
        }
        throw new Error(cause.stderr?.trim() || "PDF_PROCESSING_FAILED");
    }
}

export async function compressToTarget(input: Buffer, targetBytes: number): Promise<{
    output: Buffer;
    preset: string;
    reachedTarget: boolean;
}> {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-tools-"));
    const inputPath = path.join(directory, `${randomUUID()}.pdf`);
    const outputPaths: string[] = [];

    try {
        await fs.writeFile(inputPath, input, { flag: "wx" });
        const results: { output: Buffer; preset: string }[] = [];

        for (const preset of PRESETS.slice(0, MAX_COMPRESSION_ATTEMPTS)) {
            const outputPath = path.join(directory, `${randomUUID()}.pdf`);
            outputPaths.push(outputPath);
            await runGhostscript(inputPath, outputPath, preset.setting);
            const output = await fs.readFile(outputPath);
            if (hasPdfSignature(output)) {
                results.push({ output, preset: preset.name });
            }
        }

        if (results.length === 0) {
            throw new Error("PDF_PROCESSING_FAILED");
        }

        const validResults = results.filter((result) => result.output.length <= targetBytes);
        const best = (validResults.length > 0 ? validResults : results).reduce((smallest, result) =>
            result.output.length < smallest.output.length ? result : smallest,
        );

        return {
            ...best,
            reachedTarget: validResults.length > 0,
        };
    } finally {
        await fs.rm(directory, { recursive: true, force: true });
    }
}
