"use client";

import Link from "next/link";
import { useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { usePreferences } from "@/context/PreferencesContext";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SetupForm } from "@/components/budget/SetupForm";
import { RunwayChart } from "@/components/charts/RunwayChart";
import type { PlanStatus } from "@/types/budget.types";
import { formatNumber } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { getCategoryById } from "@/lib/categories";

// ─────────────────────────────────────────────
// Status Mapping
// ─────────────────────────────────────────────

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "primary";

function statusBadge(status: PlanStatus): { variant: BadgeVariant; dot: string; labelBg: string } {
  const map: Record<PlanStatus, { variant: BadgeVariant; dot: string; labelBg: string }> = {
    healthy:           { variant: "success",  dot: "🟢", labelBg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    above_target:      { variant: "warning",  dot: "🟡", labelBg: "bg-amber-50 text-amber-700 border-amber-200" },
    no_budget:         { variant: "danger",   dot: "🔴", labelBg: "bg-red-50 text-red-700 border-red-200" },
    no_days_remaining: { variant: "neutral",  dot: "⚫", labelBg: "bg-slate-100 text-slate-700 border-slate-200" },
    insufficient_data: { variant: "neutral",  dot: "⚪", labelBg: "bg-slate-100 text-slate-700 border-slate-200" },
    expired:           { variant: "neutral",  dot: "⚫", labelBg: "bg-slate-100 text-slate-700 border-slate-200" },
  };
  return map[status] ?? { variant: "neutral", dot: "⚪", labelBg: "bg-slate-100 text-slate-700 border-slate-200" };
}

// ─────────────────────────────────────────────
// Premium Stat Card
// ─────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  accentColor,
}: {
  title: string;
  value: string | null;
  subtitle?: string;
  icon: string;
  iconBg: string;
  accentColor?: string;
}) {
  return (
    <Card hoverable as="article" className="relative overflow-hidden group">
      {/* Top subtle highlight border */}
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <CardBody className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <p className="text-xs sm:text-sm font-semibold text-slate-500">
            {title}
          </p>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${iconBg}`}
          >
            {icon}
          </div>
        </div>
        <p
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
            accentColor ? accentColor : "text-slate-900"
          }`}
        >
          {value ?? "—"}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {subtitle}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Main Overview Page
// ─────────────────────────────────────────────

export default function OverviewPage() {
  const { plan, expenses, summary } = useBudget();
  const { t, formatAmount, locale } = usePreferences();
  const [showEditModal, setShowEditModal] = useState(false);

  // ── 1. No Plan Yet: Premium Onboarding Screen ──
  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto py-4 sm:py-8 animate-slide-up">
        {/* Hero Banner */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-3xl shadow-xl shadow-indigo-500/25 mb-5 animate-float">
            💰
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {t("setup.headline")}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
            {t("setup.subheadline")}
          </p>
        </div>

        <Card className="shadow-elevated border-slate-200/80">
          <CardBody className="p-6 sm:p-8">
            <SetupForm />
          </CardBody>
        </Card>
      </div>
    );
  }

  // ── 2. Plan Expired ────────────────────────────
  if (summary?.status === "expired") {
    return (
      <div className="max-w-lg mx-auto animate-fade-in text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-3xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
          ⏳
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">{t("overview.planExpired")}</h1>
        <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
          {t("overview.planExpiredSub")}
        </p>
        <Button onClick={() => setShowEditModal(true)} variant="primary">
          ✏️ {t("setup.edit")}
        </Button>
        <Modal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={t("setup.edit")}
        >
          <SetupForm editMode onSuccess={() => setShowEditModal(false)} />
        </Modal>
      </div>
    );
  }

  const sum = summary!;
  const recentExpenses = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const { dot: statusDot, labelBg: statusLabelBg } = statusBadge(sum.status);
  const forecastLabel =
    sum.forecastMode === "actual"
      ? t("overview.forecastActual")
      : t("overview.forecastPlanned");

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {t("overview.title")}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
              {plan.currency}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            من <strong className="text-slate-700">{formatDate(plan.startDate, locale)}</strong> إلى <strong className="text-slate-700">{formatDate(plan.targetDate, locale)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon="✏️" onClick={() => setShowEditModal(true)}>
            {t("setup.edit")}
          </Button>
          <Link href="/expenses">
            <Button size="sm" icon="➕">
              {t("expenses.addExpense")}
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 4 KPI Summary Cards ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title={t("overview.availableAfterCommitments")}
          value={formatAmount(sum.remainingBalanceMinor)}
          subtitle={t("overview.availableHelper")}
          icon="💼"
          iconBg="bg-emerald-50 text-emerald-600 border border-emerald-100"
          accentColor="text-emerald-700"
        />

        <StatCard
          title={t("overview.dailyLimit")}
          value={
            sum.dailyLimitMinor !== null
              ? formatAmount(sum.dailyLimitMinor)
              : t("errors.noPlan")
          }
          subtitle={t("overview.dailyLimitHelper")}
          icon="📅"
          iconBg="bg-indigo-50 text-indigo-600 border border-indigo-100"
          accentColor="text-indigo-700"
        />

        <StatCard
          title={t("overview.estimatedRunway")}
          value={
            sum.estimatedRunwayDays !== null
              ? `${formatNumber(sum.estimatedRunwayDays, locale)} ${t("common.days")}`
              : "—"
          }
          subtitle={`${t("overview.forecastBased")}${forecastLabel}`}
          icon="📊"
          iconBg="bg-sky-50 text-sky-600 border border-sky-100"
          accentColor="text-sky-700"
        />

        {/* Plan Status Card */}
        <Card hoverable as="article" className="relative overflow-hidden group">
          <CardBody className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-3.5">
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                {t("overview.planStatus")}
              </p>
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center text-lg shadow-sm">
                🎯
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border shadow-xs mb-2.5">
              <span className="text-xs" aria-hidden="true">{statusDot}</span>
              <span>{t(`status.${sum.status}`)}</span>
            </div>

            {sum.estimatedExhaustionDate ? (
              <p className="text-xs text-slate-500 font-medium">
                📆 موعد النفاد المتوقع: <strong className="text-slate-700">{formatDate(sum.estimatedExhaustionDate, locale)}</strong>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                الميزانية مستقرة لنهاية الخطة
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Forecast Area Chart ─────────────────── */}
      <RunwayChart plan={plan} summary={sum} />

      {/* ── Recent Expenses List ────────────────── */}
      <Card>
        <div className="px-5 py-4 sm:px-6 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">🧾</span>
            <h2 className="text-base font-bold text-slate-900">{t("overview.recentExpenses")}</h2>
          </div>
          <Link
            href="/expenses"
            className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
          >
            <span>{t("nav.expenses")}</span>
            <span aria-hidden="true" className="rtl-flip">→</span>
          </Link>
        </div>

        {recentExpenses.length === 0 ? (
          <EmptyState
            icon="🧾"
            title={t("overview.noExpenses")}
            description={t("expenses.emptySubtext")}
            action={
              <Link href="/expenses">
                <Button size="sm" icon="➕">{t("overview.addFirstExpense")}</Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100" role="list">
            {recentExpenses.map((expense) => {
              const category = getCategoryById(expense.categoryId);
              return (
                <li
                  key={expense.id}
                  className="flex items-center gap-3.5 px-5 py-3.5 sm:px-6 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0 shadow-xs">
                    {category?.icon ?? "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {t(category?.labelKey ?? "categories.other")}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(expense.date, locale)}
                      {expense.note && ` · ${expense.note}`}
                    </p>
                  </div>
                  <p className="text-sm sm:text-base font-extrabold text-slate-900 tabular-nums shrink-0">
                    {formatAmount(expense.amountMinor)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Edit Plan Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t("setup.edit")}
        size="lg"
      >
        <SetupForm editMode onSuccess={() => setShowEditModal(false)} />
      </Modal>
    </div>
  );
}
