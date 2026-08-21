import ImageResizerTool from "./tool";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/image-resizer", "Resize Images Online - JPG, PNG & WebP", "Resize JPG, PNG, and WebP images to precise dimensions or percentages.");

export default function ImageResizerPage() { return <ImageResizerTool />; }
