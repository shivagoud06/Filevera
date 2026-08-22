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

export default function TargetSizeInput({ id, label, value, unit, onValueChange, onUnitChange, disabled = false, error }: TargetSizeInputProps) {
    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">{label}</label>
            <div className={`mt-1.5 flex h-11 sm:h-12 overflow-hidden rounded-xl border bg-white shadow-xs transition-colors focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-200 ${error ? "border-red-400" : "border-slate-300"}`}>
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
                    className="min-w-0 flex-1 px-3.5 text-sm sm:text-base text-slate-900 outline-none disabled:bg-slate-50"
                />
                <select
                    aria-label={`${label} unit`}
                    value={unit}
                    onChange={(event) => onUnitChange(event.target.value as TargetUnit)}
                    disabled={disabled}
                    className="border-l border-slate-200 bg-slate-50 px-3 text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 focus:bg-sky-50 disabled:bg-slate-50"
                >
                    {TARGET_UNITS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
            </div>
            {error && <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 font-medium" role="alert">{error}</p>}
        </div>
    );
}