"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import SiteHeader from "./site-header";
import Breadcrumbs from "./breadcrumbs";
import FeedbackModal from "./feedback-modal";
import { IconShield, IconBolt, IconFree, IconDevice, IconLock } from "./ui-icons";
import { SUPPORT_EMAIL } from "@/lib/config";

export interface FaqItem {
  question: string;
  answer: string;
}

interface ToolShellProps {
  category: "PDF" | "Images";
  title: string;
  badge?: string;
  description: string;
  howItWorksSteps?: [string, string, string];
  faqs?: FaqItem[];
  relatedTools?: Array<{ name: string; href: string }>;
  children: ReactNode;
}

const DEFAULT_STEPS: [string, string, string] = [
  "Select or drop your file into the tool card above.",
  "Configure options if desired and click process.",
  "Save your processed file instantly to your device."
];

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: "Is this tool completely free to use?",
    answer: "Yes, all Filevera utilities are 100% free with no subscriptions, credit cards, or hidden limits."
  },
  {
    question: "Are my files secure and private?",
    answer: "Yes. Files are processed securely in temporary server containers and immediately deleted after your operation completes."
  },
  {
    question: "Do I need to install any software or extensions?",
    answer: "No software is needed. Filevera runs entirely in your browser across mobile, tablet, and desktop devices."
  }
];

export default function ToolShell({
  category,
  title,
  badge = `${category} Tools`,
  description,
  howItWorksSteps = DEFAULT_STEPS,
  faqs = DEFAULT_FAQS,
  relatedTools,
  children
}: ToolShellProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [feedbackVote, setFeedbackVote] = useState<"yes" | "no" | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
      <SiteHeader />
      <Breadcrumbs category={category} current={title} />

      <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-7 flex-1">
        {/* Header Title Section */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
            {badge}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl text-slate-900">{title}</h1>
          <p className="mt-1.5 text-xs sm:text-sm leading-5 text-slate-600">
            {description}
          </p>
        </div>

        {/* Compact Main Tool Process Card */}
        <div className="mt-5 mx-auto max-w-2xl">
          {children}
        </div>

        {/* Related Quick Links if provided */}
        {relatedTools && relatedTools.length > 0 && (
          <nav className="mt-5 mx-auto max-w-2xl flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600" aria-label="Related tools">
            <span className="text-xs text-slate-400 font-medium py-1">Related:</span>
            {relatedTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 font-medium hover:border-sky-300 hover:text-sky-600 transition-colors shadow-2xs"
              >
                {tool.name}
              </Link>
            ))}
          </nav>
        )}

        {/* 4 Compact Benefits Chips */}
        <div className="mt-10 mx-auto max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <IconFree className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">100% Free</p>
              <p className="text-[11px] text-slate-500">No hidden fees</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <IconShield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">100% Secure</p>
              <p className="text-[11px] text-slate-500">Auto-deleted</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <IconBolt className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Super Fast</p>
              <p className="text-[11px] text-slate-500">Instant output</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <IconDevice className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Any Device</p>
              <p className="text-[11px] text-slate-500">Mobile & desktop</p>
            </div>
          </div>
        </div>

        {/* How It Works 3-Step Guide */}
        <section className="mt-8 mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs" aria-labelledby="how-it-works-title">
          <h2 id="how-it-works-title" className="text-sm sm:text-base font-bold text-slate-900 text-center">
            How to use {title}
          </h2>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-xs">
                1
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-900">Upload</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">{howItWorksSteps[0]}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-xs">
                2
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-900">Process</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">{howItWorksSteps[1]}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-xs">
                3
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-900">Download</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">{howItWorksSteps[2]}</p>
            </div>
          </div>
        </section>

        {/* Security / Privacy Guarantee Banner */}
        <section className="mt-6 mx-auto max-w-3xl rounded-2xl border border-sky-200 bg-sky-50/70 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-3.5 shadow-2xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white">
            <IconLock className="h-5 w-5" />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-sky-950">Your files are private & safe</h3>
            <p className="mt-0.5 text-[11px] sm:text-xs text-sky-800 leading-4">
              All uploads are encrypted in transit, processed in isolated temporary containers, and permanently removed immediately after completion.
            </p>
          </div>
          <Link href="/privacy" className="shrink-0 text-xs font-semibold text-sky-700 hover:text-sky-950 underline underline-offset-2">
            Privacy Policy →
          </Link>
        </section>

        {/* Subtle Tool Feedback Prompt */}
        <section className="mt-5 mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white px-4 py-3 text-center flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-2xs">
          <p className="text-xs text-slate-600">
            {feedbackVote === null
              ? `Was ${title} useful for your file?`
              : feedbackVote === "yes"
              ? "Glad we could help! Want to share a quick review?"
              : "Sorry to hear that! Help us improve:"}
          </p>

          <div className="flex items-center gap-2">
            {feedbackVote === null ? (
              <>
                <button
                  type="button"
                  onClick={() => setFeedbackVote("yes")}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  👍 Yes
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackVote("no")}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  👎 No
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="text-xs font-semibold text-sky-600 hover:underline"
              >
                Tell us what you think →
              </button>
            )}
          </div>
        </section>

        {/* Tool FAQs Accordion */}
        {faqs && faqs.length > 0 && (
          <section className="mt-5 mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs" aria-labelledby="faq-title">
            <h2 id="faq-title" className="text-sm sm:text-base font-bold text-slate-900 text-center">
              Frequently Asked Questions
            </h2>
            <div className="mt-4 divide-y divide-slate-100">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={faq.question} className="py-2.5 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between text-left text-xs font-semibold text-slate-900 hover:text-sky-600 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span>{faq.question}</span>
                      <span className="ml-2 text-slate-400 font-bold text-base">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <p className="mt-1.5 text-xs text-slate-600 leading-5 pr-4">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Subtle Bottom Support Line */}
        <div className="mt-7 text-center text-xs text-slate-500">
          <span>Having trouble with this tool? Contact support: </span>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-bold text-slate-800 hover:text-sky-500 transition-colors underline underline-offset-2 decoration-sky-300 hover:decoration-sky-500 break-all"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>

      <FeedbackModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTool={title}
      />
    </main>
  );
}
