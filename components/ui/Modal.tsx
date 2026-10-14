"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

function ModalInner({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus trap and keyboard dismiss
  useEffect(() => {
    if (!open) return;

    // Move focus into dialog — small delay so animation completes
    const timer = setTimeout(() => {
      const firstFocusable = contentRef.current?.querySelector<HTMLElement>(
        'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 80);

    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeydown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKeydown);
    };
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const sizeClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
  }[size];

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      // Overlay: full-screen, centered on desktop, sheet from bottom on mobile
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Dialog container */}
      <div
        ref={contentRef}
        className={`
          relative w-full ${sizeClass} bg-white
          rounded-t-3xl sm:rounded-[var(--radius-card)]
          shadow-elevated
          animate-slide-up sm:animate-scale-in
          flex flex-col
          max-h-[92dvh] sm:max-h-[88dvh]
          overflow-hidden
        `}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden shrink-0 flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header — fixed, never scrolls */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
          <h2
            id="modal-title"
            className="text-base sm:text-lg font-bold text-slate-900"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700 text-sm font-bold shrink-0"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body — takes remaining space, scrolls independently */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>

        {/* Footer — fixed at bottom, never scrolls */}
        {footer && (
          <div className="shrink-0 flex items-center justify-end gap-3 px-5 py-3.5 border-t border-[var(--color-border)] bg-slate-50/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Portal wrapper — renders modal at document body level to avoid z-index/overflow issues
export function Modal(props: ModalProps) {
  // Only render portal on client
  if (typeof document === "undefined") return null;
  return createPortal(<ModalInner {...props} />, document.body);
}
