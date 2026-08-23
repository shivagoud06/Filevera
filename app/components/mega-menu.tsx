"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { IconPdf, IconImage, IconConvert } from "./ui-icons";

export interface MegaMenuItem {
  name: string;
  href: string;
  desc: string;
  tag?: string;
  tagColor?: string;
  available: boolean;
  icon: "pdf" | "image" | "convert";
}

export interface MegaMenuCategory {
  title: string;
  badge?: string;
  items: MegaMenuItem[];
}

export const MEGA_MENU_CATEGORIES: MegaMenuCategory[] = [
  {
    title: "PDF Tools",
    badge: "Core Suite",
    items: [
      {
        name: "Compress PDF",
        href: "/compress-pdf",
        desc: "Reduce PDF size with custom target limits",
        tag: "Popular",
        tagColor: "bg-sky-100 text-sky-800",
        available: true,
        icon: "pdf",
      },
      {
        name: "Compress PDF to Target Size",
        href: "/compress-pdf-to-size",
        desc: "Specify exact target KB or MB limit",
        available: true,
        icon: "pdf",
      },
      {
        name: "Merge PDF",
        href: "/merge-pdf",
        desc: "Combine multiple PDF documents into one",
        tag: "Top Utility",
        tagColor: "bg-blue-100 text-blue-800",
        available: true,
        icon: "pdf",
      },
      {
        name: "Split PDF",
        href: "/split-pdf",
        desc: "Extract specific page ranges or single pages",
        available: true,
        icon: "pdf",
      },
      {
        name: "Compress to 1 MB",
        href: "/compress-pdf-to-1mb",
        desc: "Fast 1MB optimization preset",
        available: true,
        icon: "pdf",
      },
      {
        name: "Compress to 500 KB",
        href: "/compress-pdf-to-500kb",
        desc: "Quick 500KB government / portal limit",
        available: true,
        icon: "pdf",
      },
    ],
  },
  {
    title: "PDF Conversion",
    badge: "Converters",
    items: [
      {
        name: "JPG to PDF",
        href: "/jpg-to-pdf",
        desc: "Convert photos and graphic images to PDF",
        tag: "Fast",
        tagColor: "bg-emerald-100 text-emerald-800",
        available: true,
        icon: "convert",
      },
      {
        name: "PDF to JPG",
        href: "/pdf-to-jpg",
        desc: "Extract every page as a high-res JPG image",
        tag: "Fast",
        tagColor: "bg-emerald-100 text-emerald-800",
        available: true,
        icon: "convert",
      },
      {
        name: "PDF to PNG",
        href: "/#pdf",
        desc: "High fidelity transparent page extraction",
        tag: "Coming soon",
        tagColor: "bg-slate-100 text-slate-500",
        available: false,
        icon: "convert",
      },
      {
        name: "PNG to PDF",
        href: "/#pdf",
        desc: "Convert transparent graphics into PDF",
        tag: "Coming soon",
        tagColor: "bg-slate-100 text-slate-500",
        available: false,
        icon: "convert",
      },
      {
        name: "PDF to Word",
        href: "/#pdf",
        desc: "Extract editable text and documents",
        tag: "Coming soon",
        tagColor: "bg-slate-100 text-slate-500",
        available: false,
        icon: "convert",
      },
    ],
  },
  {
    title: "Image Tools",
    badge: "Optimization",
    items: [
      {
        name: "Compress Image",
        href: "/image-compressor",
        desc: "Compress JPG, PNG, and WebP to target size",
        tag: "Top Utility",
        tagColor: "bg-sky-100 text-sky-800",
        available: true,
        icon: "image",
      },
      {
        name: "Resize Image",
        href: "/image-resizer",
        desc: "Custom pixel dimensions or scaling percentage",
        tag: "Precision",
        tagColor: "bg-purple-100 text-purple-800",
        available: true,
        icon: "image",
      },
      {
        name: "Compress to 50 KB",
        href: "/compress-image-to-50kb",
        desc: "Strict target for passport/job portals",
        available: true,
        icon: "image",
      },
      {
        name: "Compress to 100 KB",
        href: "/compress-image-to-100kb",
        desc: "Popular image target limit preset",
        available: true,
        icon: "image",
      },
      {
        name: "Compress to 200 KB",
        href: "/compress-image-to-200kb",
        desc: "Medium size web asset optimization",
        available: true,
        icon: "image",
      },
      {
        name: "Compress to 500 KB",
        href: "/compress-image-to-500kb",
        desc: "High clarity image optimization",
        available: true,
        icon: "image",
      },
    ],
  },
];

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderIcon = (iconType: "pdf" | "image" | "convert") => {
    switch (iconType) {
      case "pdf":
        return <IconPdf className="h-4 w-4 text-sky-600" />;
      case "image":
        return <IconImage className="h-4 w-4 text-purple-600" />;
      case "convert":
        return <IconConvert className="h-4 w-4 text-emerald-600" />;
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute left-1/2 -translate-x-1/2 top-full z-40 mt-2 w-[calc(100vw-32px)] max-w-5xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl animate-fade-in"
      role="region"
      aria-label="All File Tools Mega Menu"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-700 text-xs font-bold">
            ⚡
          </span>
          <h2 className="text-sm font-bold text-slate-900">All Filevera Tools</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            16 Available Tools
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Close tools menu"
        >
          ✕
        </button>
      </div>

      {/* 3-Column Tool Matrix */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {MEGA_MENU_CATEGORIES.map((category) => (
          <div key={category.title} className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {category.title}
              </h3>
              {category.badge && (
                <span className="text-[10px] font-medium text-slate-400">{category.badge}</span>
              )}
            </div>

            <div className="space-y-1">
              {category.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onClose()}
                  className={`group flex items-start gap-2.5 rounded-xl p-2 transition-all ${
                    item.available
                      ? "hover:bg-slate-50 hover:shadow-2xs"
                      : "opacity-60 cursor-not-allowed hover:bg-transparent"
                  }`}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-sky-50 transition-colors">
                    {renderIcon(item.icon)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">
                        {item.name}
                      </span>
                      {item.tag && (
                        <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${item.tagColor}`}>
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-3.5 line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Quick-Action Bar */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>🔒 256-bit TLS Encrypted</span>
          <span>•</span>
          <span>⚡ Instant Server Processing</span>
          <span>•</span>
          <span>🗑️ Zero Data Retention</span>
        </div>

        <Link
          href="/#pdf"
          onClick={() => onClose()}
          className="font-bold text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center gap-1"
        >
          <span>View all tools on Homepage</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
