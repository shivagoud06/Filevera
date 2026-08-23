"use client";

import { TARGET_UNITS, TargetUnit } from "@/lib/target-size";

type TargetSizeInputProps = {
    id: string;
    label: string;
    value: string;
    unit: TargetUnit;
    onValueChange: (value: string) => void;
    onUnitChange: (unit: TargetUnit) => void;
    disabled?: boolean;
    error?: string;
};

export default function TargetSizeInput({
    id,
    label,
    value,
    unit,
    onValueChange,
    onUnitChange,
    disabled = false,
    error
}: TargetSizeInputProps) {
    return (
        <div className="w-full">
            <label
                htmlFor={id}
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
                {label}
            </label>

            <div className="mt-1.5 flex items-center gap-2 max-w-full">
                {/* Number Input: Compact ~140–176px, flexible shrink down to 320px viewports */}
                <div
                    className={`relative flex h-10 sm:h-11 w-36 sm:w-44 max-w-[calc(100%-84px)] shrink overflow-hidden rounded-xl border bg-white shadow-xs transition-colors focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-200 ${
                        error ? "border-red-400" : "border-slate-300"
                    }`}
                >
                    <input
                        id={id}
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="any"
                        placeholder="1"
                        value={value}
                        onChange={(event) => onValueChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (["e", "E", "+", "-"].includes(event.key)) event.preventDefault();
                        }}
                        disabled={disabled}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? `${id}-error` : undefined}
                        className="w-full px-3 text-sm sm:text-base font-medium text-slate-900 outline-none disabled:bg-slate-50"
                    />
                </div>

                {/* Unit Selector: Compact ~80–112px with custom chevron, perfectly aligned */}
                <div className="relative flex h-10 sm:h-11 w-20 sm:w-28 shrink-0 overflow-hidden rounded-xl border border-slate-300 bg-slate-50 shadow-xs transition-colors focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-200">
                    <select
                        aria-label={`${label} unit`}
                        value={unit}
                        onChange={(event) => onUnitChange(event.target.value as TargetUnit)}
                        disabled={disabled}
                        className="w-full bg-transparent px-2.5 sm:px-3 pr-6 sm:pr-7 text-xs sm:text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 focus:bg-sky-50 disabled:bg-slate-50 appearance-none"
                    >
                        {TARGET_UNITS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                </div>
            </div>

            {error && (
                <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 font-medium" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}