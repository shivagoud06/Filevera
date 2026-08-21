import { pageMetadata } from "@/lib/seo";
import type { ReactNode } from "react";
export const metadata = pageMetadata("/pdf-to-jpg", "PDF to JPG Converter Online", "Convert PDF pages into JPG images and download the generated files.");
export default function PdfToJpgLayout({ children }: { children: ReactNode }) { return children; }