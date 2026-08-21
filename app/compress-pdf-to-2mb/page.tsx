import CompressPdfToSizeTool from "../compress-pdf-to-size/tool";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/compress-pdf-to-2mb", "Compress PDF to 2MB Online", "Reduce a PDF to 2 MB with real server-side compression and an editable target.");

export default function CompressPdfTo2MbPage() {
  return <CompressPdfToSizeTool initialTarget="2mb" />;
}
