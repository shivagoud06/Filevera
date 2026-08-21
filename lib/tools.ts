export type ToolCategory = "PDF" | "Images" | "Documents" | "Video" | "Audio" | "Archives" | "Utilities";

export type ToolDefinition = {
    href: string;
    title: string;
    description: string;
    category: ToolCategory;
};

export const toolCategories: ToolCategory[] = ["PDF", "Images", "Documents", "Video", "Audio", "Archives", "Utilities"];

export const tools: ToolDefinition[] = [
    { href: "/compress-pdf", title: "Compress PDF", description: "Reduce PDF size with real server-side compression.", category: "PDF" },
    { href: "/compress-pdf-to-size", title: "Compress PDF to target size", description: "Set any custom PDF limit in KB or MB.", category: "PDF" },
    { href: "/merge-pdf", title: "Merge PDF", description: "Combine multiple PDF files into one document.", category: "PDF" },
    { href: "/split-pdf", title: "Split PDF", description: "Extract page ranges and individual pages.", category: "PDF" },
    { href: "/jpg-to-pdf", title: "JPG to PDF", description: "Turn selected images into a single PDF.", category: "PDF" },
    { href: "/pdf-to-jpg", title: "PDF to JPG", description: "Convert PDF pages to JPG images.", category: "PDF" },
    { href: "/image-compressor", title: "Compress Image", description: "Reduce JPG, PNG and WebP files to a custom target.", category: "Images" },
    { href: "/image-resizer", title: "Resize Image", description: "Resize images to exact dimensions or percentages.", category: "Images" },
];

export function toolsInCategory(category: ToolCategory) {
    return tools.filter((tool) => tool.category === category);
}