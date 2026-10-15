"use client";

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useMemo, useState, useEffect } from "react";
import type { BudgetPlan, BudgetSummary } from "@/types/budget.types";
import { buildForecastDataPoints } from "@/lib/budget.calculations";
import { formatDate, todayISO } from "@/lib/date";
import { usePreferences } from "@/context/PreferencesContext";
import { FiBarChart2, FiChevronDown } from "react-icons/fi";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { formatMinor } from "@/lib/currency";

type Props = {
  plan: BudgetPlan;
  summary: BudgetSummary;
};

type ChartPoint = {
  date: string;
  rawDate: string;
  balance: number;
  balanceMinor: number;
  actualBalance: number | null;
  projectedBalance: number | null;
  isProjected: boolean;
};

// ─────────────────────────────────────────────
// Custom Interactive Tooltip
// ─────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  currency,
  locale,
}: any) {
  if (!active || !payload || !payload.length) return null;

  const data: ChartPoint = payload[0].payload;
  const isToday = data.rawDate === todayISO();

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-elevated p-3.5 min-w-[170px] animate-scale-in text-xs font-sans">
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
        <span className="font-bold text-slate-800">
          {formatDate(data.rawDate, locale, { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isToday
              ? "bg-indigo-100 text-indigo-700"
              : data.isProjected
              ? "bg-slate-100 text-slate-600"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {isToday ? "اليوم" : data.isProjected ? "توقع" : "فعلي"}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-[11px] text-slate-500 font-medium">
          {isToday ? "رصيد اليوم" : data.isProjected ? "الرصيد المتوقع" : "الرصيد المسجّل"}
        </p>
        <p className="text-base font-extrabold text-indigo-600 tabular-nums">
          {formatMinor(data.balanceMinor, currency, locale)}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main RunwayChart Component
// ─────────────────────────────────────────────

export function RunwayChart({ plan, summary }: Props) {
  const { t, formatAmount, locale, preferences } = usePreferences();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dataPoints = useMemo(
    () => (mounted ? buildForecastDataPoints(plan, summary) : []),
    [plan, summary, mounted]
  );

  const today = mounted ? todayISO() : "";

  const chartData: ChartPoint[] = useMemo(() => {
    return dataPoints.map((p) => ({
      date: formatDate(p.date, locale, { month: "short", day: "numeric" }),
      rawDate: p.date,
      balance: p.balanceMinor / 100,
      balanceMinor: p.balanceMinor,
      actualBalance: p.isProjected ? null : p.balanceMinor / 100,
      projectedBalance: p.isProjected || p.date === today ? p.balanceMinor / 100 : null,
      isProjected: p.isProjected,
    }));
  }, [dataPoints, locale, today]);

  const forecastLabel =
    summary.forecastMode === "actual"
      ? t("overview.forecastActual")
      : t("overview.forecastPlanned");

  const endBalanceMinor = Math.max(
    0,
    summary.remainingBalanceMinor - summary.spendingBaselineMinor * summary.remainingDays
  );

  if (summary.remainingDays <= 0 && summary.remainingBalanceMinor <= 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden shadow-xs">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                كيف سيتغير رصيدك؟
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              التوقع مبني على{" "}
              <span className="font-semibold text-indigo-600">{forecastLabel}</span>
            </p>
          </div>

          <p className="text-xs text-slate-500 leading-5 max-w-xs">
            الخط المتصل يوضح رصيدك حتى اليوم، والمتقطع يوضح ما قد يتبقى حتى نهاية الخطة.
          </p>
        </div>
      </CardHeader>

      <CardBody className="p-3 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs">
          <span className="inline-flex items-center gap-2 text-slate-600">
            <span className="h-0.5 w-5 bg-indigo-600" aria-hidden="true" />
            رصيدك حتى اليوم
          </span>
          <span className="inline-flex items-center gap-2 text-slate-600">
            <span className="w-5 border-t-2 border-dashed border-teal-700" aria-hidden="true" />
            التوقع
          </span>
          <span className="ms-auto text-slate-500">
            الإنفاق اليومي: <strong className="font-semibold text-slate-700">{formatAmount(summary.spendingBaselineMinor)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-slate-100 p-3">
            <span className="block text-[11px] text-slate-400">الرصيد الآن</span>
            <strong className="mt-1 block text-sm text-slate-800 tabular-nums">
              {formatAmount(summary.remainingBalanceMinor)}
            </strong>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <span className="block text-[11px] text-slate-400">المتوقع بنهاية الخطة</span>
            <strong className="mt-1 block text-sm text-slate-800 tabular-nums">
              {formatAmount(endBalanceMinor)}
            </strong>
          </div>
        </div>

        {/* Chart Container */}
        <div
          className="h-56 sm:h-64 md:h-72 w-full relative"
          role="img"
          aria-label={preferences.language === "ar"
            ? "رسم يوضح رصيدك حتى اليوم والتوقع حتى نهاية الخطة"
            : "Chart showing your balance to date and projected balance through the plan end"}
        >
          {!mounted ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse text-xs text-slate-400">
              جاري تحميل الرسم البياني…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 12, right: 8, bottom: 4, left: 8 }}
              >
                <defs>
                  <linearGradient id="balanceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.28} />
                    <stop offset="60%" stopColor="#4F46E5" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#64748B", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                  interval="preserveStartEnd"
                />

                <YAxis
                  tickFormatter={(v) =>
                    formatMinor(v * 100, preferences.currency, locale, {
                      notation: "compact",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 1,
                    })
                  }
                  tick={{ fontSize: 10, fill: "#64748B", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                  orientation={preferences.language === "ar" ? "right" : "left"}
                />

                <Tooltip
                  content={
                    <CustomTooltip
                      currency={preferences.currency}
                      locale={locale}
                    />
                  }
                />

                {/* Today Reference Line */}
                <ReferenceLine
                  x={formatDate(today, locale, { month: "short", day: "numeric" })}
                  stroke="#4F46E5"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "اليوم",
                    position: "top",
                    fontSize: 10,
                    fill: "#4F46E5",
                    fontWeight: 700,
                  }}
                />

                <Area
                  dataKey="balance"
                  type="monotone"
                  stroke="transparent"
                  fill="url(#balanceAreaGradient)"
                  tooltipType="none"
                  activeDot={false}
                />

                <Line
                  dataKey="actualBalance"
                  type="monotone"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  connectNulls={false}
                  dot={false}
                  activeDot={{ r: 4, fill: "#4F46E5", stroke: "#fff", strokeWidth: 2 }}
                  name="الرصيد حتى اليوم"
                />

                <Line
                  dataKey="projectedBalance"
                  type="monotone"
                  stroke="#0F766E"
                  strokeWidth={2.5}
                  strokeDasharray="6 5"
                  connectNulls={false}
                  dot={false}
                  activeDot={{ r: 4, fill: "#0F766E", stroke: "#fff", strokeWidth: 2 }}
                  name="التوقع"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Accessible Data Table Toggle */}
        <details className="pt-2 border-t border-slate-100 group">
          <summary className="text-xs font-semibold cursor-pointer text-slate-500 hover:text-indigo-600 transition-colors list-none flex items-center justify-between py-1">
            <span>
              {preferences.language === "ar"
                ? <><FiBarChart2 className="me-1 inline h-4 w-4 align-[-3px]" aria-hidden="true" />عرض تفاصيل التوقعات كجدول</>
                : <><FiBarChart2 className="me-1 inline h-4 w-4 align-[-3px]" aria-hidden="true" />View forecast data as table</>}
            </span>
            <span className="text-slate-400 group-open:rotate-180 transition-transform">
              <FiChevronDown className="h-4 w-4" aria-hidden="true" />
            </span>
          </summary>
          <div className="overflow-x-auto mt-2.5">
            <table className="w-full text-xs" aria-label={t("overview.estimatedRunway")}>
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-start py-2 px-3 font-semibold rounded-s-lg">
                    {t("setup.fields.startDate")}
                  </th>
                  <th className="text-center py-2 px-2 font-semibold">النوع</th>
                  <th className="text-end py-2 px-3 font-semibold rounded-e-lg">
                    {t("overview.availableAfterCommitments")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chartData.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 px-3 font-medium text-slate-700">
                      {formatDate(p.rawDate, locale)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.rawDate === today
                            ? "bg-indigo-50 text-indigo-700"
                            : p.isProjected
                            ? "bg-slate-100 text-slate-500"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {p.rawDate === today ? "اليوم" : p.isProjected ? "توقع" : "فعلي"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-end font-semibold text-slate-900 tabular-nums">
                      {formatAmount(p.balanceMinor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </CardBody>
    </Card>
  );
}
