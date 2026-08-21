import ImageCompressorTool from "../image-compressor/tool";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/compress-image-to-100kb", "Compress Image to 100KB Online", "Reduce a JPG, PNG, or WebP image to a 100 KB target with an editable control.");

export default function CompressImageTo100KbPage() {
    return <ImageCompressorTool initialValue="100" initialUnit="KB" pageTitle="Compress Image to 100KB" />;
}