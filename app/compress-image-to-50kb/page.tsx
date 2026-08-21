import ImageCompressorTool from "../image-compressor/tool";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/compress-image-to-50kb", "Compress Image to 50KB Online", "Reduce a JPG, PNG, or WebP image to a 50 KB target with an editable control.");

export default function CompressImageTo50KbPage() {
    return <ImageCompressorTool initialValue="50" initialUnit="KB" pageTitle="Compress Image to 50KB" />;
}