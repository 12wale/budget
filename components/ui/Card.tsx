import type { HTMLAttributes, ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
  hoverable?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export function Card({
  children,
  className = "",
  as: Tag = "div",
  hoverable = false,
  ...props
}: CardProps) {
  return (
    <Tag
      className={`
        bg-[var(--color-surface)] border border-[var(--color-border)]
        rounded-[var(--radius-card)] shadow-[var(--shadow-card)]
        transition-all duration-[var(--transition-base)]
        ${hoverable ? "hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-5 py-4 sm:px-6 border-b border-[var(--color-border)] flex items-center justify-between ${className}`}
    >
      {children}
    </div>
  );
}
