"use client";

import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";

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
          className="text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          {label}
          {props.required && (
            <span className="ms-1 text-[var(--color-danger)]" aria-hidden="true">*</span>
          )}
        </label>

        <select
          ref={ref}
          id={id}
          className={`
            w-full rounded-[var(--radius-control)] border text-sm
            bg-[var(--color-surface)] text-[var(--color-text)]
            transition-colors duration-[var(--transition-fast)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:border-[var(--color-primary)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ps-3 pe-8 py-2.5 min-h-[44px] appearance-none
            ${error
              ? "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]"
              : "border-[var(--color-border)]"
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

        {helper && !error && (
          <p id={helperId} className="text-xs" style={{ color: "var(--color-muted)" }}>
            {helper}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium"
            style={{ color: "var(--color-danger)" }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
