"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-50",
  secondary:
    "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-50",
  ghost:
    "text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-40",
  danger:
    "bg-[var(--color-danger)] text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-2 disabled:opacity-50",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-2 text-xs rounded-[var(--radius-control)] min-h-[36px]",
  md: "px-4 py-2.5 text-sm rounded-[var(--radius-control)] min-h-[44px]",
  lg: "px-6 py-3 text-base rounded-[var(--radius-card)] min-h-[52px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-[var(--transition-fast)]
        cursor-pointer select-none
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${loading || disabled ? "pointer-events-none" : ""}
        ${className}
      `}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="animate-spin text-base" aria-hidden="true">⏳</span>
      ) : icon ? (
        <span aria-hidden="true">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
