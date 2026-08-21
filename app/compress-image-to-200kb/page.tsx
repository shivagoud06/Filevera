import ImageCompressorTool from "../image-compressor/tool";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/compress-image-to-200kb", "Compress Image to 200KB Online", "Reduce a JPG, PNG, or WebP image to a 200 KB target with an editable control.");

export default function CompressImageTo200KbPage() {
    return <ImageCompressorTool initialValue="200" initialUnit="KB" pageTitle="Compress Image to 200KB" />;
}