import CompressPdfToSizeTool from "../compress-pdf-to-size/tool";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/compress-pdf", "Compress PDF Online", "Reduce the size of a PDF with real server-side compression.");

export default function CompressPdfPage() {
    return <CompressPdfToSizeTool initialTarget="1mb" />;
}
