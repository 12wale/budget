"use client";

import Link from "next/link";
import Image from "next/image";
import type { IconType } from "react-icons";
import { FiCreditCard, FiHome, FiLogOut, FiSettings, FiSliders } from "react-icons/fi";
import { usePathname, useRouter } from "next/navigation";
import { usePreferences } from "@/context/PreferencesContext";
import { useBudget } from "@/context/BudgetContext";
import { useAuth } from "@/context/AuthContext";

type NavItem = {
  href: string;
  labelKey: string;
  icon: IconType;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/overview",   labelKey: "nav.overview",   icon: FiHome },
  { href: "/expenses",   labelKey: "nav.expenses",   icon: FiCreditCard },
  { href: "/simulator",  labelKey: "nav.simulator",  icon: FiSliders },
  { href: "/settings",   labelKey: "nav.settings",   icon: FiSettings },
];

// ─────────────────────────────────────────────
// Mobile Top Bar
// ─────────────────────────────────────────────

export function MobileTopBar() {
  const { t } = usePreferences();
  const { plan } = useBudget();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shadow-2xs">
      <Link href="/overview" className="flex items-center gap-2.5">
        <Image
          src="/brand-logo.jpg"
          alt="جيبك"
          width={96}
          height={54}
          className="h-12 w-12 rounded-lg object-contain"
          priority
        />
        <span className="font-bold text-sm text-slate-900 tracking-tight">
          {t("appName")}
        </span>
      </Link>

      {plan && (
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
          {plan.currency}
        </span>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────
// Desktop Sidebar
// ─────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = usePreferences();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const fullName = (user?.user_metadata?.full_name ?? user?.email ?? "مستخدم") as string;
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
            <Image
              src="/brand-logo.jpg"
              alt=""
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-xl object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <div>
              <p
                className="font-bold text-base leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors"
              >
                {t("appName")}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1.5 p-4 flex-1">
        {(user ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.href === "/overview")).map((item) => {
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
              <item.icon
                className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "scale-105" : "opacity-80"
                }`}
                aria-hidden="true"
              />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile + Sign Out */}
      <div className="p-3 mx-3 mb-4 rounded-xl border border-slate-100 bg-slate-50/80">
        {user ? (
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div className="shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
            {/* Sign out button */}
            <button
              type="button"
              onClick={handleSignOut}
              title="تسجيل الخروج"
              className="shrink-0 w-10 h-10 rounded-xl border border-red-200 bg-white flex items-center justify-center text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 transition-colors"
              aria-label="تسجيل الخروج"
            >
              <FiLogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <Link href="/login?next=%2Foverview" className="flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700">دخول لحفظ خطتك</Link>
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// Mobile Bottom Navigation (Responsive & Touch-Optimized)
// ─────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();
  const { t } = usePreferences();
  const { user } = useAuth();
  const items = user ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.href === "/overview");

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 flex items-center justify-around shadow-lg px-2 pb-[env(safe-area-inset-bottom,4px)]"
      style={{ height: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))" }}
      aria-label={t("nav.overview")}
    >
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex-1 flex flex-col items-center justify-center py-1.5 px-1
              transition-all duration-[var(--transition-fast)]
              min-h-[48px] max-w-[84px]
              ${isActive ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-700 font-medium"}
            `}
            aria-current={isActive ? "page" : undefined}
          >
            <div
              className={`w-9 h-7 rounded-xl flex items-center justify-center transition-all ${
                isActive ? "bg-indigo-50 scale-105 shadow-2xs" : ""
              }`}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-[10px] leading-tight mt-0.5 truncate max-w-full">
              {t(item.labelKey)}
            </span>
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
  const { ui, localDataPending, importLocalData, dismissLocalDataPrompt } = useBudget();
  const { t } = usePreferences();

  if (localDataPending) {
    return (
      <div role="status" className="fixed top-14 md:top-5 inset-x-3 sm:inset-x-4 z-50 mx-auto max-w-lg rounded-2xl border border-indigo-200 bg-white p-4 shadow-elevated">
        <p className="text-sm font-bold text-slate-900">وجدنا بيانات محفوظة على هذا الجهاز</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">هل تريد نقل خطتك ومصروفاتك إلى حسابك؟ لن تُحذف النسخة المحلية إلا بعد نجاح النقل.</p>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={dismissLocalDataPrompt} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">لاحقًا</button>
          <button type="button" onClick={async () => { if (await importLocalData()) window.location.reload(); }} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700">نقل إلى حسابي</button>
        </div>
      </div>
    );
  }

  if (!ui.storageError) return null;

  const message = ui.storageError === "storageSave"
    ? t("errors.storageSave")
    : ui.storageError === "storageLoad"
      ? t("errors.storageLoad")
      : ui.storageError;

  return (
    <div
      role="alert"
      className="fixed top-14 md:top-5 inset-x-3 sm:inset-x-4 z-50 mx-auto max-w-md px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold shadow-elevated animate-slide-up flex items-center gap-3 bg-red-50 text-red-700 border border-red-200"
    >
      <span className="text-lg shrink-0" aria-hidden="true">⚠️</span>
      <span className="flex-1">{message}</span>
    </div>
  );
}
