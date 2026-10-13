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
import type { PlanStatus, BudgetSummary } from "@/types/budget.types";
import { formatNumber } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { getCategoryById } from "@/lib/categories";

// ─────────────────────────────────────────────
// Status → Badge mapping
// ─────────────────────────────────────────────

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "primary";

function statusBadge(status: PlanStatus): { variant: BadgeVariant; dot: string } {
  const map: Record<PlanStatus, { variant: BadgeVariant; dot: string }> = {
    healthy:           { variant: "success",  dot: "🟢" },
    above_target:      { variant: "warning",  dot: "🟡" },
    no_budget:         { variant: "danger",   dot: "🔴" },
    no_days_remaining: { variant: "neutral",  dot: "⚫" },
    insufficient_data: { variant: "neutral",  dot: "⚪" },
    expired:           { variant: "neutral",  dot: "⚫" },
  };
  return map[status] ?? { variant: "neutral", dot: "⚪" };
}

// ─────────────────────────────────────────────
// Summary Card component
// ─────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  helper,
  icon,
  accent = false,
  className = "",
}: {
  label: string;
  value: string | null;
  helper?: string;
  icon: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <Card className={`animate-fade-in ${className}`} as="article">
      <CardBody>
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="text-sm font-medium" style={{ color: "var(--color-muted)" }}>
            {label}
          </p>
          <span className="text-xl" aria-hidden="true">{icon}</span>
        </div>
        <p
          className={`text-2xl md:text-3xl font-bold tabular-nums ${accent ? "text-[var(--color-primary)]" : ""}`}
          style={{ color: accent ? "var(--color-primary)" : "var(--color-text)" }}
        >
          {value ?? "—"}
        </p>
        {helper && (
          <p className="text-xs mt-2" style={{ color: "var(--color-muted)" }}>
            {helper}
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
  const { plan, expenses, summary, ui, openModal, closeModal } = useBudget();
  const { t, formatAmount, locale } = usePreferences();
  const [showEditModal, setShowEditModal] = useState(false);

  // ── No plan yet: show setup ─────────────────
  if (!plan) {
    return (
      <div className="max-w-xl mx-auto animate-slide-up">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4" aria-hidden="true">💰</div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
            {t("setup.headline")}
          </h1>
          <p className="text-sm md:text-base" style={{ color: "var(--color-muted)" }}>
            {t("setup.subheadline")}
          </p>
        </div>

        <Card>
          <CardBody>
            <SetupForm />
          </CardBody>
        </Card>
      </div>
    );
  }

  // ── Plan expired ────────────────────────────
  if (summary?.status === "expired") {
    return (
      <div className="max-w-xl mx-auto animate-fade-in text-center py-16">
        <div className="text-5xl mb-4" aria-hidden="true">⏳</div>
        <h1 className="text-xl font-bold mb-2">{t("overview.planExpired")}</h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-muted)" }}>
          {t("overview.planExpiredSub")}
        </p>
        <Button onClick={() => setShowEditModal(true)} variant="secondary">
          {t("setup.edit")}
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

  const { variant: statusVariant, dot: statusDot } = statusBadge(sum.status);
  const forecastLabel =
    sum.forecastMode === "actual"
      ? t("overview.forecastActual")
      : t("overview.forecastPlanned");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            {t("overview.title")}
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
            {t("common.disclaimer")}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowEditModal(true)}>
          ✏️ {t("setup.edit")}
        </Button>
      </div>

      {/* ── 4 Summary Cards ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          label={t("overview.availableAfterCommitments")}
          value={formatAmount(sum.remainingBalanceMinor)}
          helper={t("overview.availableHelper")}
          icon="💼"
          accent
        />
        <SummaryCard
          label={t("overview.dailyLimit")}
          value={
            sum.dailyLimitMinor !== null
              ? formatAmount(sum.dailyLimitMinor)
              : t("errors.noPlan")
          }
          helper={t("overview.dailyLimitHelper")}
          icon="📅"
        />
        <SummaryCard
          label={t("overview.estimatedRunway")}
          value={
            sum.estimatedRunwayDays !== null
              ? `${formatNumber(sum.estimatedRunwayDays, locale)} ${t("common.days")}`
              : "—"
          }
          helper={`${t("overview.forecastBased")}${forecastLabel}`}
          icon="📊"
        />
        {/* Status card */}
        <Card as="article" className="animate-fade-in">
          <CardBody>
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm font-medium" style={{ color: "var(--color-muted)" }}>
                {t("overview.planStatus")}
              </p>
              <span className="text-xl" aria-hidden="true">🎯</span>
            </div>
            <Badge variant={statusVariant} className="text-sm py-1.5 px-3">
              {statusDot} {t(`status.${sum.status}`)}
            </Badge>
            {sum.estimatedExhaustionDate && (
              <p className="text-xs mt-3" style={{ color: "var(--color-muted)" }}>
                📆 {formatDate(sum.estimatedExhaustionDate, locale)}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Forecast Chart ─────────────────── */}
      <RunwayChart plan={plan} summary={sum} />

      {/* ── Recent Expenses ─────────────────── */}
      <Card>
        <div className="px-5 py-4 md:px-6 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-base font-semibold">{t("overview.recentExpenses")}</h2>
          <Link
            href="/expenses"
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            {t("nav.expenses")} ←
          </Link>
        </div>

        {recentExpenses.length === 0 ? (
          <EmptyState
            icon="🧾"
            title={t("overview.noExpenses")}
            description={t("expenses.emptySubtext")}
            action={
              <Link href="/expenses">
                <Button size="sm">{t("overview.addFirstExpense")}</Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-[var(--color-border)]" role="list">
            {recentExpenses.map((expense) => {
              const category = getCategoryById(expense.categoryId);
              return (
                <li key={expense.id} className="flex items-center gap-3 px-5 py-3 md:px-6 hover:bg-[var(--color-surface-2)] transition-colors">
                  <span className="text-xl w-8 text-center flex-shrink-0" aria-hidden="true">
                    {category?.icon ?? "📦"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                      {t(category?.labelKey ?? "categories.other")}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                      {formatDate(expense.date, locale)}
                      {expense.note && ` · ${expense.note}`}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums flex-shrink-0">
                    {formatAmount(expense.amountMinor)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* ── Action Bar ─────────────────── */}
      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
        <Link href="/expenses">
          <Button size="lg" icon="➕">
            {t("expenses.addExpense")}
          </Button>
        </Link>
        <Link href="/simulator">
          <Button variant="secondary" size="lg" icon="🔮">
            {t("nav.simulator")}
          </Button>
        </Link>
      </div>

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
