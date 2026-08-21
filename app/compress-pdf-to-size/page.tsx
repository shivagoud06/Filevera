import CompressPdfToSizeTool from "./tool";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/compress-pdf-to-size", "Compress PDF to a Custom Size", "Set a custom PDF target in KB or MB and get the smallest readable result possible.");

export default function CompressPdfToSizePage() {
    return <CompressPdfToSizeTool />;
}
