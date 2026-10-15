import type { ReactNode } from "react";
import { FiInbox } from "react-icons/fi";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon = <FiInbox />, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="mb-4 text-slate-400 [&>svg]:h-11 [&>svg]:w-11" aria-hidden="true">{icon}</div>
      <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-text)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--color-muted)" }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
