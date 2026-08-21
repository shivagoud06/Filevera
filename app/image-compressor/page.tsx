import ImageCompressorTool from "./tool";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/image-compressor", "Compress Image Online - Reduce JPG, PNG & WebP Size", "Compress JPG, PNG, and WebP images to a custom target with real file-size results.");

export default function ImageCompressorPage() {
    return <ImageCompressorTool />;
}
