import ImageCompressorTool from "../image-compressor/tool";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/compress-image-to-500kb", "Compress Image to 500KB Online", "Reduce a JPG, PNG, or WebP image to a 500 KB target with an editable control.");

export default function CompressImageTo500KbPage() {
    return <ImageCompressorTool initialValue="500" initialUnit="KB" pageTitle="Compress Image to 500KB" />;
}