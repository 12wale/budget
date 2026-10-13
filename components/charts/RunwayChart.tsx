"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useMemo } from "react";
import type { BudgetPlan, BudgetSummary } from "@/types/budget.types";
import { buildForecastDataPoints } from "@/lib/budget.calculations";
import { formatDate, todayISO } from "@/lib/date";
import { usePreferences } from "@/context/PreferencesContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { formatMinor } from "@/lib/currency";

type Props = {
  plan: BudgetPlan;
  summary: BudgetSummary;
};

export function RunwayChart({ plan, summary }: Props) {
  const { t, formatAmount, locale, preferences } = usePreferences();

  const dataPoints = useMemo(
    () => buildForecastDataPoints(plan, summary),
    [plan, summary]
  );

  const today = todayISO();

  const chartData = dataPoints.map((p) => ({
    date: formatDate(p.date, locale, { month: "short", day: "numeric" }),
    rawDate: p.date,
    balance: p.balanceMinor / 100,
    isProjected: p.isProjected,
  }));

  const forecastLabel =
    summary.forecastMode === "actual"
      ? t("overview.forecastActual")
      : t("overview.forecastPlanned");

  if (dataPoints.length < 2 || summary.remainingDays <= 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t("overview.estimatedRunway")}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t("overview.forecastBased")} <span className="font-semibold text-indigo-600">{forecastLabel}</span>
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-medium self-start sm:self-auto">
            توقع تنازلي للميزانية
          </span>
        </div>
      </CardHeader>

      <CardBody className="p-4 sm:p-6">
        {/* Chart */}
        <div className="h-60 sm:h-72 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 12, bottom: 0, left: 12 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }}
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
                tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                width={72}
                orientation={preferences.language === "ar" ? "right" : "left"}
              />
              <Tooltip
                formatter={(value: any) => [
                  formatMinor(Number(value ?? 0) * 100, preferences.currency, locale),
                  "الرصيد المتبقي",
                ]}
                labelStyle={{ fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: "#1E293B" }}
                contentStyle={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  boxShadow: "0 10px 25px -4px rgba(15, 23, 42, 0.1)",
                  fontSize: 12,
                  padding: "8px 12px",
                }}
              />
              <ReferenceLine
                x={formatDate(today, locale, { month: "short", day: "numeric" })}
                stroke="#6366F1"
                strokeDasharray="4 4"
                label={{ value: "اليوم", position: "top", fontSize: 11, fill: "#6366F1", fontWeight: 600 }}
              />
              <Area
                dataKey="balance"
                type="monotone"
                stroke="#4F46E5"
                strokeWidth={3}
                fill="url(#balanceGradient)"
                activeDot={{ r: 6, fill: "#4F46E5", stroke: "#FFFFFF", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Accessible Data Table Toggle */}
        <details className="mt-4 pt-3 border-t border-slate-100 group">
          <summary className="text-xs font-semibold cursor-pointer text-slate-500 hover:text-indigo-600 transition-colors list-none flex items-center justify-between">
            <span>{preferences.language === "ar" ? "📊 عرض البيانات كجدول مفصل" : "📊 View data as detailed table"}</span>
            <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs" aria-label={t("overview.estimatedRunway")}>
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-start py-2 px-3 font-semibold rounded-s-lg">
                    {t("setup.fields.startDate")}
                  </th>
                  <th className="text-end py-2 px-3 font-semibold rounded-e-lg">
                    {t("overview.availableAfterCommitments")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataPoints.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 px-3 font-medium text-slate-700">{formatDate(p.date, locale)}</td>
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
