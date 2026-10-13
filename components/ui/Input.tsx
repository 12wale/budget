"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

type InputProps = {
  label: string;
  error?: string;
  helper?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  id: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, helper, prefix, suffix, id, className = "", ...props }, ref) {
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

        <div className="relative flex items-center group">
          {prefix && (
            <div
              className="absolute inset-y-0 start-3.5 flex items-center pointer-events-none text-sm text-[var(--color-muted)]"
              aria-hidden="true"
            >
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            className={`
              w-full rounded-[var(--radius-control)] border text-sm font-medium
              bg-[var(--color-surface)] text-[var(--color-text)]
              placeholder:text-[var(--color-muted)] placeholder:font-normal
              transition-all duration-[var(--transition-fast)]
              focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-glow)] focus-visible:border-[var(--color-primary)]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error
                ? "border-rose-400 focus-visible:ring-rose-100 focus-visible:border-rose-500"
                : "border-[var(--color-border)] hover:border-slate-300"
              }
              ${prefix ? "ps-11" : "ps-3.5"} ${suffix ? "pe-14" : "pe-3.5"} py-2.5
              min-h-[46px]
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={
              [error ? errorId : "", helper ? helperId : ""].filter(Boolean).join(" ") || undefined
            }
            {...props}
          />

          {suffix && (
            <div
              className="absolute inset-y-0 end-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md my-auto h-fit"
              aria-hidden="true"
            >
              {suffix}
            </div>
          )}
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
