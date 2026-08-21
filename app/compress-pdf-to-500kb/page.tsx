import CompressPdfToSizeTool from "../compress-pdf-to-size/tool";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/compress-pdf-to-500kb", "Compress PDF to 500KB Online", "Reduce a PDF to 500 KB with real server-side compression and an editable target.");

export default function CompressPdfTo500KbPage() {
    return <CompressPdfToSizeTool initialTarget="500kb" />;
}
