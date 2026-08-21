import CompressPdfToSizeTool from "../compress-pdf-to-size/tool";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/compress-pdf-to-5mb", "Compress PDF to 5MB Online", "Reduce a PDF to 5 MB with real server-side compression and an editable target.");

export default function CompressPdfTo5MbPage() {
  return <CompressPdfToSizeTool initialTarget="5mb" />;
}
