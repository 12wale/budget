"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

type SelectProps = {
  label: string;
  error?: string;
  helper?: string;
  id: string;
  options: Array<{ value: string; label: string }>;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, error, helper, id, options, className = "", ...props }, ref) {
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={id}
          className="text-xs sm:text-sm font-semibold tracking-tight text-[var(--color-text)]"
        >
          {label}
          {props.required && (
            <span className="ms-1 text-rose-500 font-bold" aria-hidden="true">*</span>
          )}
        </label>

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={id}
            className={`
              w-full rounded-[var(--radius-control)] border text-sm font-medium
              bg-[var(--color-surface)] text-[var(--color-text)]
              transition-all duration-[var(--transition-fast)]
              focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-glow)] focus-visible:border-[var(--color-primary)]
              disabled:opacity-50 disabled:cursor-not-allowed
              ps-3.5 pe-9 py-2.5 min-h-[46px] appearance-none cursor-pointer
              ${error
                ? "border-rose-400 focus-visible:ring-rose-100 focus-visible:border-rose-500"
                : "border-[var(--color-border)] hover:border-slate-300"
              }
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={
              [error ? errorId : "", helper ? helperId : ""].filter(Boolean).join(" ") || undefined
            }
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div
            className="absolute inset-y-0 end-3.5 flex items-center pointer-events-none text-slate-400 text-xs"
            aria-hidden="true"
          >
            ▼
          </div>
        </div>

        {helper && !error && (
          <p id={helperId} className="text-xs text-[var(--color-muted)] leading-relaxed">
            {helper}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-semibold text-rose-600 animate-fade-in"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
