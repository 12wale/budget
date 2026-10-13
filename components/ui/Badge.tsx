import type { ReactNode } from "react";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "primary";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  neutral:  "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
  success:  "bg-[var(--color-success-subtle)] text-[var(--color-success)]",
  warning:  "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]",
  danger:   "bg-[var(--color-danger-subtle)] text-[var(--color-danger)]",
  primary:  "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]",
};

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

export function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${BADGE_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
