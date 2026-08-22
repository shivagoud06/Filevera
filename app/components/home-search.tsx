"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { IconSearch } from "./ui-icons";

interface ToolItem {
  name: string;
  href: string;
  category: "pdf" | "image";
  desc: string;
  tag?: string;
}

const ALL_TOOLS: ToolItem[] = [
  { name: "Compress PDF", href: "/compress-pdf", category: "pdf", desc: "Reduce PDF file size to target size", tag: "Popular" },
  { name: "Compress PDF to 1MB", href: "/compress-pdf-to-1mb", category: "pdf", desc: "Target 1MB file limit" },
  { name: "Compress PDF to 500KB", href: "/compress-pdf-to-500kb", category: "pdf", desc: "Target 500KB size" },
  { name: "Compress PDF to 2MB", href: "/compress-pdf-to-2mb", category: "pdf", desc: "Target 2MB size" },
  { name: "Merge PDF", href: "/merge-pdf", category: "pdf", desc: "Combine multiple PDF documents", tag: "Popular" },
  { name: "Split PDF", href: "/split-pdf", category: "pdf", desc: "Extract specific page ranges", tag: "Popular" },
  { name: "JPG to PDF", href: "/jpg-to-pdf", category: "pdf", desc: "Convert JPG/PNG images into a PDF", tag: "Popular" },
  { name: "PDF to JPG", href: "/pdf-to-jpg", category: "pdf", desc: "Convert PDF pages into JPG images", tag: "Popular" },
  { name: "Compress Image", href: "/image-compressor", category: "image", desc: "Reduce JPG, PNG, and WebP size", tag: "Popular" },
  { name: "Compress Image to 50KB", href: "/compress-image-to-50kb", category: "image", desc: "Exact 50KB compression target" },
  { name: "Compress Image to 100KB", href: "/compress-image-to-100kb", category: "image", desc: "Target 100KB compression" },
  { name: "Compress Image to 200KB", href: "/compress-image-to-200kb", category: "image", desc: "Target 200KB compression" },
  { name: "Compress Image to 500KB", href: "/compress-image-to-500kb", category: "image", desc: "Target 500KB compression" },
  { name: "Resize Image", href: "/image-resizer", category: "image", desc: "Change pixel dimensions or scale", tag: "Popular" },
];

export default function HomeSearch() {
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "pdf" | "image">("all");

  const filtered = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      const matchCat = selectedFilter === "all" || tool.category === selectedFilter;
      const matchQuery =
        !query.trim() ||
        tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.desc.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [query, selectedFilter]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Input Box */}
      <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm transition-all focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
        <div className="pl-3 text-slate-400">
          <IconSearch className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools (e.g. compress pdf, resize image, merge)..."
          className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="pr-2 text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setSelectedFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            selectedFilter === "all"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
          }`}
        >
          All Tools ({ALL_TOOLS.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter("pdf")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            selectedFilter === "pdf"
              ? "bg-sky-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
          }`}
        >
          PDF Tools (8)
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter("image")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            selectedFilter === "image"
              ? "bg-sky-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
          }`}
        >
          Image Tools (6)
        </button>
      </div>

      {/* Search results dropdown if searching */}
      {query.trim() && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2 shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-3 text-center text-xs text-slate-500">No matching tools found.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-sky-50 transition-colors text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{tool.name}</span>
                    <span className="ml-2 text-[11px] text-slate-500">{tool.desc}</span>
                  </div>
                  <span className="text-[11px] font-bold text-sky-600">Open →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
