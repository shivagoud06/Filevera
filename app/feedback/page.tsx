"use client";

import { useState, useEffect } from "react";
import SiteHeader from "../components/site-header";
import FeedbackModal from "../components/feedback-modal";
import { FeedbackItem } from "@/lib/feedback";

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/feedback")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) {
          setFeedbackList(data.items || []);
          setTotal(data.total || 0);
          setAvgRating(data.avgRating || 0);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const refreshFeedback = () => {
    fetch("/api/feedback")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setFeedbackList(data.items || []);
          setTotal(data.total || 0);
          setAvgRating(data.avgRating || 0);
        }
      })
      .catch(() => {});
  };

  return (
    <main className="bg-slate-50 text-slate-900 flex-1 flex flex-col">
      <SiteHeader />

      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 shadow-2xs">
              Community Reviews
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              What People Say About Filevera
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Genuine user feedback and ratings from our community.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="self-start sm:self-auto inline-flex h-10 items-center justify-center rounded-xl bg-sky-500 px-5 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 shadow-2xs transition-colors"
          >
            ✍ Share Your Feedback
          </button>
        </div>

        {/* Aggregate summary if reviews exist */}
        {total > 0 && (
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="text-center sm:text-left">
              <span className="text-3xl font-black text-slate-900">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-slate-500 font-medium"> / 5.0</span>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <div className="flex items-center text-amber-400 text-sm">
                {"★".repeat(Math.round(avgRating))}
                {"☆".repeat(5 - Math.round(avgRating))}
              </div>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                Based on {total} approved user review{total === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        )}

        {/* Content list */}
        {loading ? (
          <div className="mt-12 flex justify-center text-xs sm:text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent mr-2" />
            Loading reviews...
          </div>
        ) : feedbackList.length === 0 ? (
          /* Zero Reviews Empty State (No Fake Testimonials) */
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-2xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 text-xl font-bold">
              ★
            </div>
            <h2 className="mt-3 text-base font-bold text-slate-900">No reviews yet</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              Be the first to share your experience using Filevera file utilities.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-500 px-5 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 shadow-2xs"
              >
                Write First Review
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {feedbackList.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400 text-sm">
                      {"★".repeat(item.rating)}
                      {"☆".repeat(5 - item.rating)}
                    </div>
                    {item.tool && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {item.tool}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-slate-800 leading-relaxed italic">
                    &ldquo;{item.message}&rdquo;
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">— {item.displayName}</span>
                  <time dateTime={new Date(item.createdAt).toISOString()} className="text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </time>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FeedbackModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={() => {
          refreshFeedback();
        }}
      />
    </main>
  );
}
