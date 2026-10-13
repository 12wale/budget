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
      className="hidden md:flex flex-col w-64 shrink-0 bg-white/80 backdrop-blur-md border-e border-[var(--color-border)] min-h-dvh sticky top-0 z-30"
      role="navigation"
      aria-label={t("nav.overview")}
    >
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-[var(--color-border-subtle)]">
        <Link href="/overview" className="block group focus-visible:outline-none">
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-md shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105"
            >
              💰
            </div>
            <div>
              <p
                className="font-bold text-base leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors"
              >
                {t("appName")}
              </p>
              <span className="text-[11px] font-medium text-slate-400">
                حاسبة الأمان المالي
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1.5 p-4 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold
                transition-all duration-[var(--transition-fast)] relative
                ${isActive
                  ? "bg-indigo-50/90 text-indigo-700 shadow-sm shadow-indigo-100"
                  : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active pill line */}
              {isActive && (
                <span
                  className="absolute start-0 inset-y-2 w-1 bg-indigo-600 rounded-full"
                  aria-hidden="true"
                />
              )}
              <span
                className={`text-lg transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "scale-105" : "opacity-80"
                }`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-bold text-slate-700">تخزين محلي آمن</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-normal">
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
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[var(--color-border)] flex items-center shadow-lg"
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
              flex-1 flex flex-col items-center justify-center gap-1 py-1
              text-xs font-semibold transition-all duration-[var(--transition-fast)]
              min-h-[48px]
              ${isActive ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-700"}
            `}
            aria-current={isActive ? "page" : undefined}
          >
            <div
              className={`w-9 h-7 rounded-lg flex items-center justify-center transition-all ${
                isActive ? "bg-indigo-50 scale-105" : ""
              }`}
            >
              <span className="text-lg leading-none" aria-hidden="true">{item.icon}</span>
            </div>
            <span className="text-[10px] leading-tight">{t(item.labelKey)}</span>
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
      className="fixed top-5 inset-x-4 z-50 mx-auto max-w-md px-4 py-3 rounded-2xl text-sm font-semibold shadow-elevated animate-slide-up flex items-center gap-3 bg-red-50 text-red-700 border border-red-200"
    >
      <span className="text-lg" aria-hidden="true">⚠️</span>
      <span className="flex-1">{message}</span>
    </div>
  );
}
