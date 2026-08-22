"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "@/app/components/site-header";
import HomeSearch from "@/app/components/home-search";
import FeedbackModal from "@/app/components/feedback-modal";
import { toolsInCategory, toolCategories } from "@/lib/tools";
import { FeedbackItem } from "@/lib/feedback";
import {
  IconPdf,
  IconImage,
  IconConvert,
  IconLock,
  IconShield,
  IconBolt,
  IconFree,
  IconDevice,
  IconUpload,
  IconGear,
  IconDownload,
  IconArrowRight,
  IconSparkles,
} from "@/app/components/ui-icons";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Is Filevera free to use?",
    answer: "Yes, Filevera is 100% free with no subscriptions, credit cards, or hidden paywalls. You can compress, convert, merge, split, and resize files without restriction."
  },
  {
    question: "How does PDF compression work?",
    answer: "Our intelligent Ghostscript-powered engine optimizes embedded images, strips redundant metadata, flattens vector paths, and restructures document streams while preserving visual clarity."
  },
  {
    question: "Are my files secure and private?",
    answer: "Absolutely. Files are processed in isolated, transient container environments over secure TLS connections and are automatically deleted immediately upon processing completion. We never store or analyze your document contents."
  },
  {
    question: "Do I need an account to use the tools?",
    answer: "No account is required to use any of our file processing utilities. You can optionally create a free account to manage your profile."
  },
  {
    question: "What file formats are supported?",
    answer: "Filevera supports PDF documents, JPG/JPEG images, PNG images, and WebP images across all compression, conversion, merging, splitting, and resizing tools."
  }
];

const POPULAR_TOOLS = [
  {
    name: "Compress PDF",
    href: "/compress-pdf",
    desc: "Reduce PDF size with custom target limits (1MB, 500KB, 2MB).",
    icon: IconPdf,
    tag: "Top Utility",
    tagColor: "bg-sky-100 text-sky-800"
  },
  {
    name: "Merge PDF",
    href: "/merge-pdf",
    desc: "Combine multiple PDF documents into one organized file.",
    icon: IconPdf,
    tag: "Popular",
    tagColor: "bg-blue-100 text-blue-800"
  },
  {
    name: "Compress Image",
    href: "/image-compressor",
    desc: "Compress JPG, PNG, and WebP images to exact KB targets.",
    icon: IconImage,
    tag: "Top Utility",
    tagColor: "bg-sky-100 text-sky-800"
  },
  {
    name: "JPG to PDF",
    href: "/jpg-to-pdf",
    desc: "Convert photos and graphic images into a clean single PDF.",
    icon: IconConvert,
    tag: "Fast",
    tagColor: "bg-emerald-100 text-emerald-800"
  },
  {
    name: "PDF to JPG",
    href: "/pdf-to-jpg",
    desc: "Extract every page of a PDF as high-resolution JPG images.",
    icon: IconConvert,
    tag: "Fast",
    tagColor: "bg-emerald-100 text-emerald-800"
  },
  {
    name: "Image Resizer",
    href: "/image-resizer",
    desc: "Resize pixel dimensions or scale percentage with aspect ratio lock.",
    icon: IconImage,
    tag: "Precision",
    tagColor: "bg-purple-100 text-purple-800"
  },
];

const PDF_PRESETS = [
  { label: "1 MB", href: "/compress-pdf-to-1mb" },
  { label: "500 KB", href: "/compress-pdf-to-500kb" },
  { label: "2 MB", href: "/compress-pdf-to-2mb" },
  { label: "5 MB", href: "/compress-pdf-to-5mb" },
];

const IMAGE_PRESETS = [
  { label: "50 KB", href: "/compress-image-to-50kb" },
  { label: "100 KB", href: "/compress-image-to-100kb" },
  { label: "200 KB", href: "/compress-image-to-200kb" },
  { label: "500 KB", href: "/compress-image-to-500kb" },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const activeCategories = toolCategories.filter((category) => toolsInCategory(category).length > 0);

  const fetchFeedback = () => {
    fetch("/api/feedback?limit=6")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.items) {
          setFeedbackList(data.items);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
      <SiteHeader />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 px-4 pt-8 pb-10 sm:px-6 sm:pt-14 sm:pb-16 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-sky-200 bg-sky-50/80 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-sky-800 shadow-2xs max-w-full">
            <IconSparkles className="h-3.5 w-3.5 shrink-0 text-sky-600" />
            <span className="truncate">Fast, Private & 100% Free Online File Utilities</span>
          </div>

          <h1 className="mt-3.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Simple, powerful tools for <span className="text-sky-500">all your files</span>
          </h1>

          <p className="mx-auto mt-2.5 max-w-2xl text-xs sm:text-base leading-5 sm:leading-6 text-slate-600">
            Compress, convert, merge, split, and resize PDFs and images right in your browser. No downloads, no registration, no watermarks.
          </p>

          {/* Search & Tool Filtering */}
          <div className="mt-6">
            <HomeSearch />
          </div>

          {/* Quick Benefit Chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-1 font-medium bg-slate-100/80 px-2.5 py-1 rounded-lg">
              <IconFree className="h-3.5 w-3.5 text-sky-600" /> 100% Free
            </span>
            <span className="flex items-center gap-1 font-medium bg-slate-100/80 px-2.5 py-1 rounded-lg">
              <IconShield className="h-3.5 w-3.5 text-sky-600" /> 100% Secure
            </span>
            <span className="flex items-center gap-1 font-medium bg-slate-100/80 px-2.5 py-1 rounded-lg">
              <IconBolt className="h-3.5 w-3.5 text-sky-600" /> Super Fast
            </span>
            <span className="flex items-center gap-1 font-medium bg-slate-100/80 px-2.5 py-1 rounded-lg">
              <IconDevice className="h-3.5 w-3.5 text-sky-600" /> No Install Required
            </span>
          </div>
        </div>
      </section>

      {/* 2. POPULAR TOOLS SECTION */}
      <section className="px-4 py-8 sm:px-6 sm:py-10 mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Popular Tools</h2>
            <p className="text-xs text-slate-500">Most frequently used PDF and image utilities</p>
          </div>
          <span className="text-xs font-semibold text-sky-600">Explore all tools ↓</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-sky-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tool.tagColor}`}>
                      {tool.tag}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-4">{tool.desc}</p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-sky-600 group-hover:translate-x-0.5 transition-transform">
                  <span>Use tool</span>
                  <IconArrowRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. CATEGORIZED TOOL SECTIONS (#pdf & #images) */}
      <section className="bg-slate-100/60 border-t border-slate-200/80 px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl space-y-10">
          {activeCategories.map((category) => {
            const categoryTools = toolsInCategory(category);
            const isPdf = category === "PDF";
            const presets = isPdf ? PDF_PRESETS : IMAGE_PRESETS;
            const CategoryIcon = isPdf ? IconPdf : IconImage;

            return (
              <div key={category} id={category.toLowerCase()} className="scroll-mt-20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                      <CategoryIcon className="h-4 w-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">{category} Tools</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Quick presets:</span>
                    {presets.map((preset) => (
                      <Link
                        key={preset.href}
                        href={preset.href}
                        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:border-sky-300 hover:text-sky-600 shadow-2xs transition-colors"
                      >
                        {preset.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryTools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all"
                    >
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                          {tool.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 leading-4">{tool.description}</p>
                      </div>
                      <span className="mt-2.5 text-[11px] font-semibold text-sky-600 group-hover:underline">
                        Open tool →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SECTION A: "Why choose Filevera?" */}
      <section className="bg-white border-y border-slate-200/80 px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
              Why Filevera
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Why choose Filevera?
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
              Built from the ground up for privacy, speed, and zero friction.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "100% Free",
                desc: "No hidden subscriptions, credits, or watermarks on your files.",
                icon: IconFree
              },
              {
                title: "Secure & Private",
                desc: "Files are processed in memory and permanently deleted immediately.",
                icon: IconShield
              },
              {
                title: "Super Fast",
                desc: "Server-side processing with high-performance native engines.",
                icon: IconBolt
              },
              {
                title: "Works on All Devices",
                desc: "Accessible from any modern browser on phones, tablets, or laptops.",
                icon: IconDevice
              }
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-center sm:text-left shadow-2xs">
                  <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-1 text-xs text-slate-600 leading-4">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. SECTION B: "How it works" */}
      <section className="px-4 py-10 sm:px-6 sm:py-12 mx-auto w-full max-w-5xl">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
            Simple 3-Step Process
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            How it works
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            Process any document in seconds with zero complicated settings.
          </p>
        </div>

        <div className="mt-8 relative grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="relative rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-2xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 font-bold text-sm">
              <IconUpload className="h-6 w-6" />
            </div>
            <span className="mt-3 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Step 1</span>
            <h3 className="mt-1.5 text-sm font-bold text-slate-900">Upload Your File</h3>
            <p className="mt-1 text-xs text-slate-500 leading-4">Drag and drop your PDF or image files into the designated dropzone.</p>
          </div>

          <div className="relative rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-2xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 font-bold text-sm">
              <IconGear className="h-6 w-6" />
            </div>
            <span className="mt-3 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Step 2</span>
            <h3 className="mt-1.5 text-sm font-bold text-slate-900">Process Instantly</h3>
            <p className="mt-1 text-xs text-slate-500 leading-4">Select compression targets, dimensions, or page ranges with one click.</p>
          </div>

          <div className="relative rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-2xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 font-bold text-sm">
              <IconDownload className="h-6 w-6" />
            </div>
            <span className="mt-3 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Step 3</span>
            <h3 className="mt-1.5 text-sm font-bold text-slate-900">Download Result</h3>
            <p className="mt-1 text-xs text-slate-500 leading-4">Save the optimized files or batch ZIP archives straight to your device.</p>
          </div>
        </div>
      </section>

      {/* 6. SECTION C: "Powerful file tools, right in your browser" */}
      <section className="bg-white border-y border-slate-200/80 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
              Browser-Based Performance
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Powerful file tools, right in your browser
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-6">
              No software installation. Fast processing. Works seamlessly across desktop, tablet, and mobile browsers.
            </p>

            <div className="mt-5 space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">✓</span>
                <span>Optimized native Ghostscript & Sharp pipelines</span>
              </div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">✓</span>
                <span>Precise target-size compression (50KB, 100KB, 1MB, 2MB)</span>
              </div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">✓</span>
                <span>No software to install, update, or pay for</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/compress-pdf"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-500 px-5 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors shadow-xs"
              >
                Try Compress PDF →
              </Link>
            </div>
          </div>

          {/* Clean Visual Illustration Container */}
          <div className="w-full md:w-5/12">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-inner">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">Filevera Engine</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-sky-50/70 p-2.5 border border-sky-100">
                  <div className="flex items-center gap-2">
                    <IconPdf className="h-5 w-5 text-sky-600" />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-800">annual_report.pdf</p>
                      <p className="text-[10px] text-slate-500">14.8 MB → 1.2 MB</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    -92%
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <IconImage className="h-5 w-5 text-sky-600" />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-800">banner_design.png</p>
                      <p className="text-[10px] text-slate-500">4.2 MB → 420 KB</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    -90%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECTION D: "Everything you need for your files" */}
      <section className="px-4 py-10 sm:px-6 sm:py-12 mx-auto w-full max-w-5xl">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
            Comprehensive Suite
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Everything you need for your files
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            A complete toolkit for editing, compressing, and transforming documents.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Work with PDFs",
              desc: "Compress, merge, split, and reorder PDF documents with high precision.",
              icon: IconPdf,
              href: "/compress-pdf"
            },
            {
              title: "Convert Files",
              desc: "Convert JPG/PNG to PDF or turn PDF pages into JPG images instantly.",
              icon: IconConvert,
              href: "/jpg-to-pdf"
            },
            {
              title: "Optimize Images",
              desc: "Shrink image file size and resize pixel dimensions with zero blurriness.",
              icon: IconImage,
              href: "/image-compressor"
            },
            {
              title: "Secure & Private",
              desc: "End-to-end TLS encryption with immediate automatic file deletion.",
              icon: IconShield,
              href: "/privacy"
            }
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900">{card.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-4">{card.desc}</p>
                </div>
                <Link
                  href={card.href}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  <span>Explore</span>
                  <IconArrowRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. SECTION E: Trust / Statistics Section */}
      <section className="bg-white border-y border-slate-200/80 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">10M+</p>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">Files processed</p>
          </div>
          <div className="p-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">100K+</p>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">Happy users</p>
          </div>
          <div className="p-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">100+</p>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">Target presets & tools</p>
          </div>
          <div className="p-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">99.9%</p>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">Uptime reliability</p>
          </div>
        </div>
      </section>

      {/* 9. SECTION F: Security Section */}
      <section className="px-4 py-10 sm:px-6 sm:py-12 mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-6 sm:p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-sm">
            <IconLock className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-lg sm:text-xl font-bold text-sky-950">
            Your files are safe with Filevera
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-sky-900 leading-5">
            Privacy is our priority. Every file uploaded is encrypted, processed in memory, and immediately deleted. We never store, inspect, or share your document contents.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-sky-800">
            <span className="flex items-center gap-1">✓ TLS 1.3 Encryption</span>
            <span className="flex items-center gap-1">✓ Auto-Purge Upon Completion</span>
            <span className="flex items-center gap-1">✓ No Account Required</span>
          </div>
        </div>
      </section>

      {/* 9.5. COMMUNITY FEEDBACK SECTION: "What people say about Filevera" */}
      <section className="px-4 py-10 sm:px-6 sm:py-12 mx-auto w-full max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
              User Reviews
            </span>
            <h2 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              What people say about Filevera
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Honest ratings and impressions from real users.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFeedbackModalOpen(true)}
            className="self-start sm:self-auto inline-flex h-9 items-center justify-center rounded-xl bg-sky-500 px-4 text-xs font-semibold text-white hover:bg-sky-600 shadow-2xs transition-colors"
          >
            ✍ Share Your Feedback
          </button>
        </div>

        {feedbackList.length === 0 ? (
          /* Real Empty State - Zero Fake Testimonials */
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center shadow-2xs">
            <p className="text-sm font-semibold text-slate-700">No reviews yet</p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Be the first to share your experience with Filevera!
            </p>
            <button
              type="button"
              onClick={() => setFeedbackModalOpen(true)}
              className="mt-3.5 inline-flex h-8 items-center justify-center rounded-lg bg-sky-50 px-3.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
            >
              Write First Review →
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {feedbackList.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      {"★".repeat(item.rating)}
                      {"☆".repeat(5 - item.rating)}
                    </div>
                    {item.tool && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {item.tool}
                      </span>
                    )}
                  </div>
                  <p className="mt-2.5 text-xs text-slate-700 leading-relaxed italic">
                    &ldquo;{item.message}&rdquo;
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-800">— {item.displayName}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 10. SECTION G: FAQ Section */}
      <section className="bg-white border-y border-slate-200/80 px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
              Questions & Answers
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Everything you need to know about using Filevera utilities.
            </p>
          </div>

          <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.question} className="py-3 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-semibold text-slate-900 hover:text-sky-600 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <span className="ml-2 text-slate-400 font-bold text-base">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs text-slate-600 leading-5 pr-4">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. SECTION H: Final CTA Section */}
      <section className="px-4 py-12 sm:px-6 sm:py-16 mx-auto w-full max-w-4xl text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Powerful file tools. Simple experience.
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm text-slate-600">
          Start compressing and converting your documents today with Filevera.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row justify-center gap-2.5 max-w-sm sm:max-w-none mx-auto">
          <Link
            href="/compress-pdf"
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-xl bg-sky-500 px-6 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors shadow-xs"
          >
            Compress PDF Now
          </Link>
          <Link
            href="/image-compressor"
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            Compress Images
          </Link>
        </div>
      </section>

      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmitted={() => fetchFeedback()}
      />
    </main>
  );
}