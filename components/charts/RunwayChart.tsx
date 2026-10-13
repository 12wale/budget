"use client";

import {
  LineChart,
  Line,
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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{t("overview.estimatedRunway")}</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
              {t("overview.forecastBased")}{forecastLabel}
            </p>
          </div>
          <p className="text-xs px-2 py-1 rounded-md" style={{ background: "var(--color-surface-2)", color: "var(--color-muted)" }}>
            {t("forecast.estimateNote").slice(0, 60)}…
          </p>
        </div>
      </CardHeader>

      <CardBody>
        {/* Chart */}
        <div className="h-52 md:h-64" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                tickLine={false}
                axisLine={false}
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
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                tickLine={false}
                axisLine={false}
                width={70}
                orientation={preferences.language === "ar" ? "right" : "left"}
              />
              <Tooltip
                formatter={(value: number) =>
                  [formatMinor(value * 100, preferences.currency, locale), ""]
                }
                labelStyle={{ fontFamily: "inherit", fontSize: 12 }}
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-control)",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                x={formatDate(today, locale, { month: "short", day: "numeric" })}
                stroke="var(--color-primary)"
                strokeDasharray="4 4"
                label={{ value: "اليوم", position: "top", fontSize: 10, fill: "var(--color-primary)" }}
              />
              {/* Actual balance line */}
              <Line
                dataKey="balance"
                type="monotone"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "var(--color-primary)" }}
                strokeDasharray={(d: { isProjected?: boolean }) => (d?.isProjected ? "6 3" : undefined)}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Text summary table (accessibility) */}
        <details className="mt-4">
          <summary className="text-xs cursor-pointer" style={{ color: "var(--color-muted)" }}>
            {t("common.noData") === "لا توجد بيانات" ? "عرض البيانات كجدول" : "View data as table"}
          </summary>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs" aria-label={t("overview.estimatedRunway")}>
              <thead>
                <tr>
                  <th className="text-start py-1 px-2 font-medium" style={{ color: "var(--color-muted)" }}>
                    {t("setup.fields.startDate")}
                  </th>
                  <th className="text-end py-1 px-2 font-medium" style={{ color: "var(--color-muted)" }}>
                    {t("overview.availableAfterCommitments")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataPoints.map((p, i) => (
                  <tr key={i} className="border-t border-[var(--color-border)]">
                    <td className="py-1 px-2">{formatDate(p.date, locale)}</td>
                    <td className="py-1 px-2 text-end tabular-nums">{formatAmount(p.balanceMinor)}</td>
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
