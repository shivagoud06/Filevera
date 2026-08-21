import { pageMetadata } from "@/lib/seo";
import type { ReactNode } from "react";
export const metadata = pageMetadata("/split-pdf", "Split PDF Pages Online", "Extract selected page ranges from a PDF and download the result as a ZIP.");
export default function SplitPdfLayout({ children }: { children: ReactNode }) { return children; }