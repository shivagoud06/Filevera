export const TARGET_UNITS = ["KB", "MB"] as const;
export type TargetUnit = (typeof TARGET_UNITS)[number];

export const MAX_TARGET_BYTES = 100 * 1024 * 1024;

export function isTargetUnit(value: unknown): value is TargetUnit {
    return typeof value === "string" && TARGET_UNITS.includes(value as TargetUnit);
}

export function bytesFromTargetSize(value: number | string, unit: TargetUnit): number | null {
    if (!isTargetUnit(unit)) return null;
    if (typeof value === "string" && !/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
    const numericValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) return null;
    const bytes = numericValue * (unit === "MB" ? 1024 * 1024 : 1024);
    if (!Number.isSafeInteger(Math.round(bytes)) || bytes > MAX_TARGET_BYTES) return null;
    return Math.round(bytes);
}

export function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 1024) return `${Math.max(0, Math.round(bytes))} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}