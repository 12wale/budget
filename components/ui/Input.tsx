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
          className="text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          {label}
          {props.required && (
            <span className="ms-1 text-[var(--color-danger)]" aria-hidden="true">*</span>
          )}
        </label>

        <div className="relative flex items-center">
          {prefix && (
            <div
              className="absolute inset-y-0 start-3 flex items-center pointer-events-none text-sm"
              style={{ color: "var(--color-muted)" }}
              aria-hidden="true"
            >
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            className={`
              w-full rounded-[var(--radius-control)] border text-sm
              bg-[var(--color-surface)] text-[var(--color-text)]
              placeholder:text-[var(--color-muted)]
              transition-colors duration-[var(--transition-fast)]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:border-[var(--color-primary)]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error
                ? "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]"
                : "border-[var(--color-border)]"
              }
              ${prefix ? "ps-10" : "ps-3"} ${suffix ? "pe-10" : "pe-3"} py-2.5
              min-h-[44px]
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
              className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-sm"
              style={{ color: "var(--color-muted)" }}
              aria-hidden="true"
            >
              {suffix}
            </div>
          )}
        </div>

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
