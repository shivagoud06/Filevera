export type ValidationResult = {
  valid: boolean;
  error?: string;
  errorDetail?: string;
};

export const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/**
 * Validates a single PDF file
 */
export function validatePdfFile(file: File, maxBytes = MAX_PDF_BYTES): ValidationResult {
  if (file.size === 0) {
    return {
      valid: false,
      error: "The selected file is empty.",
      errorDetail: "Please select a valid PDF file with content.",
    };
  }

  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) {
    return {
      valid: false,
      error: "Unsupported file type",
      errorDetail: "Please select a supported file format.",
    };
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: "File is too large",
      errorDetail: `Maximum file size: ${formatBytes(maxBytes)}. Selected file is ${formatBytes(file.size)}.`,
    };
  }

  return { valid: true };
}

/**
 * Validates a single image file (JPG, PNG, WebP)
 */
export function validateImageFile(file: File, maxBytes = MAX_IMAGE_BYTES): ValidationResult {
  if (file.size === 0) {
    return {
      valid: false,
      error: "The selected file is empty.",
      errorDetail: "Please select a valid image file with content.",
    };
  }

  const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
  const isSupported =
    supportedTypes.includes(file.type) ||
    /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!isSupported) {
    return {
      valid: false,
      error: "Unsupported file type",
      errorDetail: "Please select a supported file format.",
    };
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: "File is too large",
      errorDetail: `Maximum file size: ${formatBytes(maxBytes)}. Selected image is ${formatBytes(file.size)}.`,
    };
  }

  return { valid: true };
}

/**
 * Deduplicates incoming files against existing selection
 */
export function deduplicateFiles(existing: File[], incoming: File[]): { unique: File[]; duplicatesCount: number } {
  const existingKeys = new Set(existing.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
  const unique: File[] = [];
  let duplicatesCount = 0;

  for (const file of incoming) {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (!existingKeys.has(key)) {
      existingKeys.add(key);
      unique.push(file);
    } else {
      duplicatesCount++;
    }
  }

  return { unique, duplicatesCount };
}
