"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
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
    "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white shadow-sm hover:shadow-[var(--shadow-glow)] hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 active:scale-[0.98]",
  secondary:
    "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-surface-3)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 active:scale-[0.98]",
  ghost:
    "text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 active:scale-[0.98]",
  danger:
    "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm hover:brightness-105 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 active:scale-[0.98]",
  success:
    "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:brightness-105 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-[0.98]",
};

const SIZES: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-xs font-semibold rounded-[var(--radius-control)] min-h-[38px]",
  md: "px-5 py-2.5 text-sm font-semibold rounded-[var(--radius-control)] min-h-[44px]",
  lg: "px-7 py-3 text-base font-semibold rounded-[var(--radius-card-sm)] min-h-[50px]",
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
        inline-flex items-center justify-center gap-2
        transition-all duration-[var(--transition-fast)]
        cursor-pointer select-none font-sans
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${loading || disabled ? "opacity-50 pointer-events-none" : ""}
        ${className}
      `}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="animate-spin text-base" aria-hidden="true">⏳</span>
      ) : icon ? (
        <span className="text-base leading-none" aria-hidden="true">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
