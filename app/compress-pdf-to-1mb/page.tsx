import CompressPdfToSizeTool from "../compress-pdf-to-size/tool";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/compress-pdf-to-1mb", "Compress PDF to 1MB Online", "Reduce a PDF to 1 MB with real server-side compression and an editable target.");

export default function CompressPdfTo1MbPage() {
    return <CompressPdfToSizeTool initialTarget="1mb" />;
}
