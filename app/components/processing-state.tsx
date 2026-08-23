import React from "react";

export function CreditCostBadge({ credits = 5 }: { credits?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
      <span className="text-amber-500 font-bold">⚡</span> {credits} {credits === 1 ? "credit" : "credits"} required
    </span>
  );
}

export function ActionButton({
  onClick,
  disabled = false,
  processing = false,
  idleText,
  processingText,
  ariaLabel,
  className = "",
}: {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  processing?: boolean;
  idleText: string;
  processingText: string;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || processing}
      aria-busy={processing}
      aria-label={ariaLabel || (processing ? processingText : idleText)}
      className={`flex h-11 w-full sm:w-auto sm:min-w-[220px] items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-xs sm:text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-2xs ${className}`}
    >
      {processing && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          aria-hidden="true"
        />
      )}
      <span>{processing ? processingText : idleText}</span>
    </button>
  );
}
