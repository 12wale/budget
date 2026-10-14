"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useBudget } from "@/context/BudgetContext";
import { usePreferences } from "@/context/PreferencesContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { simulateScenario } from "@/lib/budget.calculations";
import { formatNumber } from "@/lib/currency";
import { formatDate } from "@/lib/date";

export default function SimulatorPage() {
  const { plan, expenses, summary, setPlan } = useBudget();
  const { t, formatAmount, locale } = usePreferences();

  // Baseline daily spend in minor units
  const baselineMinor = plan?.plannedDailySpendMinor ?? 0;
  const [adjustedMinor, setAdjustedMinor] = useState<number>(baselineMinor);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const currentAdjustedMinor = useMemo(() => {
    return adjustedMinor === 0 && baselineMinor > 0 ? baselineMinor : adjustedMinor;
  }, [adjustedMinor, baselineMinor]);

  const simulation = useMemo(() => {
    if (!plan) return null;
    return simulateScenario(plan, expenses, currentAdjustedMinor);
  }, [plan, expenses, currentAdjustedMinor]);

  if (!plan || !summary) {
    return (
      <Card className="max-w-md mx-auto">
        <EmptyState
          icon="🔮"
          title={t("simulator.noPlan")}
          description={t("setup.subheadline")}
          action={
            <Link href="/overview">
              <Button>{t("setup.cta")}</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const currency = plan.currency;
  const maxSliderMinor = Math.max(baselineMinor * 3, 100000);

  function applyPreset(multiplier: number) {
    setAdjustedMinor(Math.round(baselineMinor * multiplier));
    setHasApplied(false);
  }

  function handleSliderChange(valMinor: number) {
    setAdjustedMinor(valMinor);
    setHasApplied(false);
  }

  async function handleApplyPlan() {
    if (!plan || !simulation) return;
    const now = new Date().toISOString();
    const saved = await setPlan({
      ...plan,
      plannedDailySpendMinor: simulation.adjustedDailySpendMinor,
      updatedAt: now,
    });
    if (!saved) return;
    setIsConfirmOpen(false);
    setHasApplied(true);
  }

  const diffDays = simulation?.differenceInDays ?? 0;
  const diffPositive = diffDays > 0;
  const diffNeutral = Math.abs(diffDays) < 0.1;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {t("simulator.title")}
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
            تجربة تفاعلية
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t("simulator.subtitle")}
        </p>
      </div>

      {/* Applied Success Banner */}
      {hasApplied && (
        <div
          role="status"
          className="p-4 rounded-2xl text-sm font-semibold animate-slide-up flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span>تم تطبيق الإنفاق اليومي الجديد في خطتك بنجاح!</span>
          </div>
          <button
            onClick={() => setHasApplied(false)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Interactive Controls Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎛️</span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t("simulator.scenario")}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon="🔄"
              onClick={() => {
                setAdjustedMinor(baselineMinor);
                setHasApplied(false);
              }}
            >
              {t("simulator.resetScenario")}
            </Button>
          </div>
        </CardHeader>

        <CardBody className="space-y-6 p-5 sm:p-7">
          {/* Input & Baseline Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <Input
              id="sim-daily-spend"
              label={t("simulator.adjustedDailySpend")}
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={String(currentAdjustedMinor / 100)}
              onChange={(e) => {
                const num = Number(e.target.value);
                if (!isNaN(num) && num >= 0) {
                  setAdjustedMinor(Math.round(num * 100));
                  setHasApplied(false);
                }
              }}
              suffix={currency}
            />

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{t("simulator.currentBaseline")}:</span>
              <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                {formatAmount(baselineMinor)} / {t("common.day")}
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>0 {currency}</span>
              <span className="text-indigo-600 font-bold">
                {formatAmount(currentAdjustedMinor)} / يوم
              </span>
              <span>{formatAmount(maxSliderMinor)}</span>
            </div>
            <input
              id="sim-slider"
              type="range"
              min="0"
              max={maxSliderMinor}
              step={100}
              value={currentAdjustedMinor}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              aria-label={t("simulator.adjustedDailySpend")}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 ms-1">
              اختصارات سريعة:
            </span>
            <button
              type="button"
              onClick={() => applyPreset(0.75)}
              className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 transition-colors shadow-2xs"
            >
              وفر 25%
            </button>
            <button
              type="button"
              onClick={() => applyPreset(0.9)}
              className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 transition-colors shadow-2xs"
            >
              وفر 10%
            </button>
            <button
              type="button"
              onClick={() => applyPreset(1.0)}
              className="px-3.5 py-1.5 text-xs rounded-xl border border-indigo-200 bg-indigo-50 font-bold text-indigo-700 transition-colors shadow-2xs"
            >
              الحالي (100%)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(1.1)}
              className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 transition-colors shadow-2xs"
            >
              +10%
            </button>
            <button
              type="button"
              onClick={() => applyPreset(1.25)}
              className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 transition-colors shadow-2xs"
            >
              +25%
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Adjusted Runway */}
        <Card hoverable as="article">
          <CardBody className="p-4 sm:p-5">
            <p className="text-xs font-semibold text-slate-500 mb-1">
              {t("simulator.runwayLabel")}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {simulation?.estimatedRunwayDays !== null
                ? `${formatNumber(simulation?.estimatedRunwayDays ?? 0, locale)} ${t("common.days")}`
                : "∞"}
            </p>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              الوضع السابق: {summary.estimatedRunwayDays !== null ? `${formatNumber(summary.estimatedRunwayDays, locale)} ${t("common.days")}` : "—"}
            </p>
          </CardBody>
        </Card>

        {/* Difference in Days */}
        <Card hoverable as="article">
          <CardBody className="p-4 sm:p-5">
            <p className="text-xs font-semibold text-slate-500 mb-1">
              {t("simulator.differenceLabel")}
            </p>
            <p
              className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${
                diffNeutral
                  ? "text-slate-500"
                  : diffPositive
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {diffNeutral ? "0" : `${diffPositive ? "+" : ""}${formatNumber(diffDays, locale)}`} {t("common.days")}
            </p>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              {diffNeutral
                ? "لا يوجد تغيير"
                : diffPositive
                ? "زيادة في مدة الأمان"
                : "نقص في مدة الأمان"}
            </p>
          </CardBody>
        </Card>

        {/* Estimated Exhaustion Date */}
        <Card hoverable as="article">
          <CardBody className="p-4 sm:p-5">
            <p className="text-xs font-semibold text-slate-500 mb-1">
              {t("simulator.exhaustionLabel")}
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-1">
              {simulation?.estimatedExhaustionDate
                ? formatDate(simulation.estimatedExhaustionDate, locale)
                : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              تاريخ الهدف: {formatDate(plan.targetDate, locale)}
            </p>
          </CardBody>
        </Card>

        {/* Projected Balance at Target Date */}
        <Card hoverable as="article">
          <CardBody className="p-4 sm:p-5">
            <p className="text-xs font-semibold text-slate-500 mb-1">
              {t("simulator.balanceOnTarget")}
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-indigo-700 tabular-nums mt-1">
              {simulation?.balanceOnTargetDateMinor !== null
                ? formatAmount(simulation?.balanceOnTargetDateMinor ?? 0)
                : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              الرصيد الفائض عند نهاية الخطة
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Apply Proposed Plan Card */}
      <Card className="bg-gradient-to-r from-indigo-50/70 via-white to-cyan-50/50 border-indigo-200/80 shadow-xs">
        <CardBody className="p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {t("simulator.applyPlan")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {t("simulator.applyWarning")}
            </p>
          </div>
          <Button
            size="md"
            onClick={() => setIsConfirmOpen(true)}
            disabled={currentAdjustedMinor === baselineMinor}
            className="w-full sm:w-auto shrink-0"
          >
            {t("simulator.applyPlan")}
          </Button>
        </CardBody>
      </Card>

      {/* Apply Confirmation Modal */}
      <Modal
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={t("simulator.applyPlan")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleApplyPlan}>
              {t("common.confirm")}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-slate-700">
          <p>{t("simulator.applyWarning")}</p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">الإنفاق الحالي:</span>
              <strong className="text-slate-800">{formatAmount(baselineMinor)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">الإنفاق الجديد المقترح:</span>
              <strong className="text-indigo-600 font-extrabold">{formatAmount(currentAdjustedMinor)}</strong>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
