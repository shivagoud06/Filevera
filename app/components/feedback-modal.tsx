"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/app/auth-client";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  defaultTool?: string;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  onSubmitted,
  defaultTool
}: FeedbackModalProps) {
  const { data: session } = authClient.useSession();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [tool, setTool] = useState(defaultTool || "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || (session?.user?.name ?? "Anonymous User"),
          rating,
          tool: tool.trim() || undefined,
          message: message.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback.");
      }

      setSuccess(true);
      if (onSubmitted) onSubmitted();
      setTimeout(() => {
        setSuccess(false);
        setMessage("");
        onClose();
      }, 2500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1"
          aria-label="Close modal"
        >
          ✕
        </button>

        <h2 id="feedback-modal-title" className="text-lg font-bold text-slate-900">
          Share Your Experience
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Your honest review helps us improve Filevera for everyone.
        </p>

        {success ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-xs sm:text-sm text-emerald-800">
            <p className="font-bold">Thank you for your feedback!</p>
            <p className="mt-1 text-emerald-700 text-xs">
              Your review has been submitted for moderation and will appear publicly once approved.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {/* Star Rating Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Your Rating</label>
              <div className="mt-1 flex items-center gap-1.5" role="radiogroup" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  >
                    <span className={(hoverRating !== null ? star <= hoverRating : star <= rating) ? "text-amber-400" : "text-slate-200"}>
                      ★
                    </span>
                  </button>
                ))}
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {rating} of 5
                </span>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="fb-name" className="block text-xs font-semibold text-slate-700">
                Display Name or First Name
              </label>
              <input
                id="fb-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex M."
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
            </div>

            {/* Tool Used (Optional) */}
            <div>
              <label htmlFor="fb-tool" className="block text-xs font-semibold text-slate-700">
                Tool Used (Optional)
              </label>
              <input
                id="fb-tool"
                type="text"
                value={tool}
                onChange={(e) => setTool(e.target.value)}
                placeholder="e.g. Compress PDF, Resize Image"
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
            </div>

            {/* Feedback Message */}
            <div>
              <label htmlFor="fb-message" className="block text-xs font-semibold text-slate-700">
                Your Feedback
              </label>
              <textarea
                id="fb-message"
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What did you like or what can we improve?"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 resize-none"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-xl px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-500 px-5 text-xs font-bold text-white hover:bg-sky-600 shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
