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
        <div>
            <label htmlFor={id} className="text-sm font-semibold text-slate-900">{label}</label>
            <div className={`mt-3 flex overflow-hidden rounded-xl border bg-white focus-within:ring-2 focus-within:ring-blue-500 ${error ? "border-red-400" : "border-slate-300"}`}>
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
                    className="min-w-0 flex-1 px-4 py-3 text-base outline-none disabled:bg-slate-100"
                />
                <select
                    aria-label={`${label} unit`}
                    value={unit}
                    onChange={(event) => onUnitChange(event.target.value as TargetUnit)}
                    disabled={disabled}
                    className="border-l border-slate-300 bg-slate-50 px-4 py-3 font-semibold text-slate-700 outline-none focus:bg-blue-50 disabled:bg-slate-100"
                >
                    {TARGET_UNITS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
            </div>
            {error && <p id={`${id}-error`} className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
        </div>
    );
}