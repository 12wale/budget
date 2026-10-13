// ─────────────────────────────────────────────
// Budget Calculations — Pure functions, no React
// All monetary inputs/outputs in integer minor units
// ─────────────────────────────────────────────

import type {
  BudgetPlan,
  BudgetSummary,
  Expense,
  ForecastMode,
  PlanStatus,
  SimulatorResult,
} from "@/types/budget.types";
import {
  addDays,
  countCalendarDays,
  isDatePast,
  remainingCalendarDays,
  todayISO,
} from "@/lib/date";

// ─────────────────────────────────────────────
// Spending baseline
// ─────────────────────────────────────────────

const ACTUAL_AVERAGE_WINDOW_DAYS = 7;
const MIN_DAYS_FOR_ACTUAL_AVERAGE = 3;

/**
 * Calculate the actual daily spending average over the last `windowDays` days.
 * Only uses expenses within the window. Returns null if insufficient data.
 */
export function calculateActualDailyAverage(
  expenses: Expense[],
  windowDays = ACTUAL_AVERAGE_WINDOW_DAYS
): number | null {
  const today = todayISO();
  const windowStart = addDays(today, -(windowDays - 1));

  const windowExpenses = expenses.filter(
    (e) => e.date >= windowStart && e.date <= today
  );

  if (windowExpenses.length === 0) return null;

  // Count distinct days with recorded expenses
  const daysWithExpenses = new Set(windowExpenses.map((e) => e.date)).size;
  if (daysWithExpenses < MIN_DAYS_FOR_ACTUAL_AVERAGE) return null;

  const total = windowExpenses.reduce((sum, e) => sum + e.amountMinor, 0);
  return Math.round(total / daysWithExpenses);
}

// ─────────────────────────────────────────────
// Status determination
// ─────────────────────────────────────────────

function determineStatus(params: {
  reservedBalanceMinor: number;
  remainingDays: number;
  spendingBaselineMinor: number;
  dailyLimitMinor: number | null;
  planExpired: boolean;
}): PlanStatus {
  const { reservedBalanceMinor, remainingDays, spendingBaselineMinor, dailyLimitMinor, planExpired } = params;

  if (planExpired) return "expired";
  if (reservedBalanceMinor <= 0) return "no_budget";
  if (remainingDays <= 0) return "no_days_remaining";
  if (spendingBaselineMinor <= 0) return "insufficient_data";
  if (dailyLimitMinor !== null && spendingBaselineMinor > dailyLimitMinor) {
    return "above_target";
  }
  return "healthy";
}

// ─────────────────────────────────────────────
// Main summary calculation
// ─────────────────────────────────────────────

export function calculateBudgetSummary(
  plan: BudgetPlan,
  expenses: Expense[]
): BudgetSummary {
  // 1. Reserved balance = startingBalance - fixedCommitments
  const reservedBalanceMinor = Math.max(
    0,
    plan.startingBalanceMinor - plan.fixedCommitmentsMinor
  );

  // 2. Sum variable expenses that fall within plan dates
  const variableExpensesTotal = expenses
    .filter(
      (e) => e.date >= plan.startDate && e.date <= plan.targetDate
    )
    .reduce((sum, e) => sum + e.amountMinor, 0);

  // 3. Remaining spendable balance
  const remainingBalanceMinor = Math.max(
    0,
    reservedBalanceMinor - variableExpensesTotal
  );

  // 4. Time
  const planExpired = isDatePast(plan.targetDate);
  const remainingDays = planExpired ? 0 : remainingCalendarDays(plan.targetDate);

  // 5. Daily limit
  const dailyLimitMinor =
    remainingDays > 0 ? Math.round(remainingBalanceMinor / remainingDays) : null;

  // 6. Spending baseline: actual average if mode = "actual" and data exists, else planned
  let spendingBaselineMinor = plan.plannedDailySpendMinor;
  let forecastMode: ForecastMode = "planned";

  if (plan.forecastMode === "actual") {
    const actualAvg = calculateActualDailyAverage(expenses);
    if (actualAvg !== null) {
      spendingBaselineMinor = actualAvg;
      forecastMode = "actual";
    }
    // else fall back to planned mode — forecastMode stays "planned"
  }

  // 7. Runway
  const estimatedRunwayDays =
    spendingBaselineMinor > 0
      ? remainingBalanceMinor / spendingBaselineMinor
      : null;

  const estimatedExhaustionDate =
    estimatedRunwayDays !== null && estimatedRunwayDays > 0
      ? addDays(todayISO(), estimatedRunwayDays)
      : null;

  // 8. Status
  const status = determineStatus({
    reservedBalanceMinor,
    remainingDays,
    spendingBaselineMinor,
    dailyLimitMinor,
    planExpired,
  });

  return {
    reservedBalanceMinor,
    remainingBalanceMinor,
    remainingDays,
    dailyLimitMinor,
    estimatedRunwayDays,
    estimatedExhaustionDate,
    spendingBaselineMinor,
    forecastMode,
    status,
  };
}

// ─────────────────────────────────────────────
// What-if simulator
// ─────────────────────────────────────────────

export function simulateScenario(
  plan: BudgetPlan,
  expenses: Expense[],
  adjustedDailySpendMinor: number
): SimulatorResult {
  const summary = calculateBudgetSummary(plan, expenses);
  const clampedSpend = Math.max(0, adjustedDailySpendMinor);

  const estimatedRunwayDays =
    clampedSpend > 0 ? summary.remainingBalanceMinor / clampedSpend : null;

  const estimatedExhaustionDate =
    estimatedRunwayDays !== null && estimatedRunwayDays > 0
      ? addDays(todayISO(), estimatedRunwayDays)
      : null;

  // Balance on target date = remaining balance - spend * remaining days
  const remainingDays = summary.remainingDays;
  const balanceOnTargetDateMinor =
    remainingDays > 0
      ? Math.max(0, summary.remainingBalanceMinor - clampedSpend * remainingDays)
      : summary.remainingBalanceMinor;

  // Difference in days vs current baseline runway
  const currentRunway = summary.estimatedRunwayDays;
  const differenceInDays =
    estimatedRunwayDays !== null && currentRunway !== null
      ? estimatedRunwayDays - currentRunway
      : null;

  return {
    adjustedDailySpendMinor: clampedSpend,
    estimatedRunwayDays,
    estimatedExhaustionDate,
    balanceOnTargetDateMinor,
    differenceInDays,
  };
}

// ─────────────────────────────────────────────
// Expense aggregation helpers
// ─────────────────────────────────────────────

/** Total of all recorded expenses (minor units) */
export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amountMinor, 0);
}

/** Group expenses by category */
export function groupExpensesByCategory(
  expenses: Expense[]
): Record<string, number> {
  return expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.categoryId] = (acc[e.categoryId] ?? 0) + e.amountMinor;
    return acc;
  }, {});
}

/** Build balance forecast data points for chart (daily snapshots) */
export function buildForecastDataPoints(
  plan: BudgetPlan,
  summary: BudgetSummary
): Array<{ date: string; balanceMinor: number; isProjected: boolean }> {
  const today = todayISO();
  const points: Array<{ date: string; balanceMinor: number; isProjected: boolean }> = [];

  // Start of plan: reserved balance
  points.push({
    date: plan.startDate,
    balanceMinor: summary.reservedBalanceMinor,
    isProjected: false,
  });

  // Today's actual remaining balance
  points.push({
    date: today,
    balanceMinor: summary.remainingBalanceMinor,
    isProjected: false,
  });

  // Future projected points (every 7 days until target or exhaustion)
  if (summary.spendingBaselineMinor > 0 && summary.remainingDays > 0) {
    let currentBalance = summary.remainingBalanceMinor;
    const step = 7; // days
    let daysAhead = step;

    while (daysAhead <= summary.remainingDays && currentBalance > 0) {
      const projectedBalance = Math.max(
        0,
        currentBalance - summary.spendingBaselineMinor * step
      );
      points.push({
        date: addDays(today, daysAhead),
        balanceMinor: projectedBalance,
        isProjected: true,
      });
      currentBalance = projectedBalance;
      daysAhead += step;
    }

    // Always include target date endpoint
    const targetBalance = Math.max(
      0,
      summary.remainingBalanceMinor -
        summary.spendingBaselineMinor * summary.remainingDays
    );
    points.push({
      date: plan.targetDate,
      balanceMinor: targetBalance,
      isProjected: true,
    });
  }

  return points;
}

// ─────────────────────────────────────────────
// Days elapsed in plan
// ─────────────────────────────────────────────

export function daysElapsedInPlan(plan: BudgetPlan): number {
  const totalDays = countCalendarDays(plan.startDate, plan.targetDate);
  const remaining = remainingCalendarDays(plan.targetDate);
  return Math.max(0, totalDays - remaining);
}
