import { pageMetadata } from "@/lib/seo";
import type { ReactNode } from "react";
export const metadata = pageMetadata("/jpg-to-pdf", "JPG to PDF Converter Online", "Convert JPG and PNG images into a single PDF document.");
export default function JpgToPdfLayout({ children }: { children: ReactNode }) { return children; }