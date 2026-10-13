"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/context/PreferencesContext";
import { useBudget } from "@/context/BudgetContext";

type NavItem = {
  href: string;
  labelKey: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/overview",   labelKey: "nav.overview",   icon: "🏠" },
  { href: "/expenses",   labelKey: "nav.expenses",   icon: "💳" },
  { href: "/simulator",  labelKey: "nav.simulator",  icon: "🔮" },
  { href: "/settings",   labelKey: "nav.settings",   icon: "⚙️" },
];

// ─────────────────────────────────────────────
// Desktop Sidebar
// ─────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { t } = usePreferences();

  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 bg-[var(--color-surface)] border-e border-[var(--color-border)] min-h-dvh sticky top-0"
      role="navigation"
      aria-label={t("nav.overview")}
    >
      {/* Brand */}
      <div className="px-6 py-5 border-b border-[var(--color-border)]">
        <Link href="/overview" className="block group focus-visible:outline-none">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "var(--color-primary)" }}
            >
              💰
            </div>
            <div>
              <p
                className="font-semibold text-sm leading-tight"
                style={{ color: "var(--color-text)" }}
              >
                {t("appName")}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-[var(--transition-fast)]
                ${isActive
                  ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-base" aria-hidden="true">{item.icon}</span>
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[var(--color-border)]">
        <p className="text-xs" style={{ color: "var(--color-muted)" }}>
          {t("common.disclaimer")}
        </p>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// Mobile Bottom Navigation
// ─────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();
  const { t } = usePreferences();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center"
      style={{ height: "var(--bottom-nav-height)", paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={t("nav.overview")}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex-1 flex flex-col items-center justify-center gap-0.5 py-2
              text-xs font-medium transition-colors duration-[var(--transition-fast)]
              min-h-[44px]
              ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"}
            `}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="text-xl leading-none" aria-hidden="true">{item.icon}</span>
            <span className="text-[10px] leading-none mt-0.5">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────
// Storage Error Banner
// ─────────────────────────────────────────────

export function StorageErrorBanner() {
  const { ui } = useBudget();
  const { t } = usePreferences();

  if (!ui.storageError) return null;

  const message =
    ui.storageError === "storageSave"
      ? t("errors.storageSave")
      : t("errors.storageLoad");

  return (
    <div
      role="alert"
      className="fixed top-4 inset-x-4 z-50 mx-auto max-w-lg px-4 py-3 rounded-xl text-sm font-medium shadow-elevated animate-slide-up"
      style={{
        background: "var(--color-danger-subtle)",
        color: "var(--color-danger)",
        border: "1px solid var(--color-danger)",
      }}
    >
      {message}
    </div>
  );
}
