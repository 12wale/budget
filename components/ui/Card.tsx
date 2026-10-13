import type { HTMLAttributes, ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
} & HTMLAttributes<HTMLDivElement>;

export function Card({ children, className = "", as: Tag = "div", ...props }: CardProps) {
  return (
    <Tag
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)] ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 md:p-6 ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`px-5 py-4 md:px-6 border-b border-[var(--color-border)] ${className}`}
    >
      {children}
    </div>
  );
}
