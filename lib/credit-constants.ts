export type OperationType =
  | "compress_pdf"
  | "merge_pdf"
  | "split_pdf"
  | "pdf_to_jpg"
  | "jpg_to_pdf"
  | "pdf_to_word"
  | "pdf_to_excel"
  | "pdf_to_ppt"
  | "ocr_pdf"
  | "remove_pdf_pages"
  | "rotate_pdf"
  | "add_watermark"
  | "protect_pdf"
  | "unlock_pdf"
  | "compress_image"
  | "resize_image";

export const OPERATION_COSTS: Record<OperationType, number> = {
  compress_pdf: 5,
  merge_pdf: 5,
  split_pdf: 5,
  pdf_to_jpg: 5,
  jpg_to_pdf: 5,
  pdf_to_word: 10,
  pdf_to_excel: 10,
  pdf_to_ppt: 10,
  ocr_pdf: 15,
  remove_pdf_pages: 3,
  rotate_pdf: 3,
  add_watermark: 3,
  protect_pdf: 3,
  unlock_pdf: 5,
  compress_image: 5,
  resize_image: 3,
};

export const OPERATION_LABELS: Record<OperationType, string> = {
  compress_pdf: "Compress PDF",
  merge_pdf: "Merge PDFs",
  split_pdf: "Split PDF",
  pdf_to_jpg: "PDF to JPG",
  jpg_to_pdf: "JPG to PDF",
  pdf_to_word: "PDF to Word",
  pdf_to_excel: "PDF to Excel",
  pdf_to_ppt: "PDF to PPT",
  ocr_pdf: "OCR PDF",
  remove_pdf_pages: "Remove PDF Pages",
  rotate_pdf: "Rotate PDF",
  add_watermark: "Add Watermark",
  protect_pdf: "Protect PDF",
  unlock_pdf: "Unlock PDF",
  compress_image: "Compress Image",
  resize_image: "Resize Image",
};

export function getOperationCost(operation: OperationType): number {
  return OPERATION_COSTS[operation] ?? 5;
}

export function getOperationLabel(operation: string): string {
  return OPERATION_LABELS[operation as OperationType] || operation.replace(/_/g, " ");
}
