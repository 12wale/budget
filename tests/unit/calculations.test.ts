import { describe, it, expect } from "vitest";
import {
  calculateDailyLimit,
  calculateActualDailyAverage,
  calculateBudgetSummary,
  simulateScenario,
  sumExpenses,
} from "@/lib/budget.calculations";
import type { BudgetPlan, Expense } from "@/types/budget.types";
import { todayISO, addDays } from "@/lib/date";

describe("Budget Calculations", () => {
  const today = todayISO();
  const target30Days = addDays(today, 30);

  const mockPlan: BudgetPlan = {
    id: "plan-1",
    currency: "EGP",
    startingBalanceMinor: 1000000, // 10,000 EGP
    fixedCommitmentsMinor: 200000, // 2,000 EGP
    startDate: today,
    targetDate: target30Days,
    plannedDailySpendMinor: 20000, // 200 EGP / day
    forecastMode: "planned",
    status: "active",
    endedAt: null,
    savedBalanceMinor: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("calculates daily limit correctly", () => {
    // 8,000 available across 30 days = ~266.666 EGP -> Math.round is 26667 minor units
    const limit = calculateDailyLimit(800000, 30);
    expect(limit).toBe(26667);
  });

  it("returns null daily limit if days remaining <= 0", () => {
    expect(calculateDailyLimit(800000, 0)).toBeNull();
    expect(calculateDailyLimit(800000, -5)).toBeNull();
  });

  it("returns 0 daily limit if balance <= 0", () => {
    expect(calculateDailyLimit(0, 10)).toBe(0);
    expect(calculateDailyLimit(-500, 10)).toBe(0);
  });

  it("calculates actual daily average over window", () => {
    const expenses: Expense[] = [
      {
        id: "e1",
        amountMinor: 30000,
        date: today,
        categoryId: "food",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "e2",
        amountMinor: 10000,
        date: addDays(today, -2),
        categoryId: "transport",
        createdAt: "",
        updatedAt: "",
      },
    ];

    const avg = calculateActualDailyAverage(expenses, 5, 2, today);
    expect(avg).toBe(20000); // 40,000 / 2 days with expenses = 20,000
  });

  it("calculates full budget summary correctly with planned mode", () => {
    const summary = calculateBudgetSummary(mockPlan, []);

    expect(summary.reservedBalanceMinor).toBe(800000); // 10,000 - 2,000
    expect(summary.remainingBalanceMinor).toBe(800000);
    expect(summary.remainingDays).toBe(31); // inclusive of end date
    expect(summary.status).toBe("healthy"); // 800000 / 20000 = 40 days runway >= 31 days target
    expect(summary.estimatedRunwayDays).toBe(40);
  });

  it("flags above_target if runway is less than target days", () => {
    const tightPlan: BudgetPlan = {
      ...mockPlan,
      plannedDailySpendMinor: 40000, // 400 EGP / day -> 8,000 / 400 = 20 days < 30 days
    };
    const summary = calculateBudgetSummary(tightPlan, []);
    expect(summary.status).toBe("above_target");
    expect(summary.estimatedRunwayDays).toBe(20);
  });

  it("flags no_budget if fixed commitments exceed starting balance", () => {
    const deficitPlan: BudgetPlan = {
      ...mockPlan,
      startingBalanceMinor: 200000,
      fixedCommitmentsMinor: 300000,
    };
    const summary = calculateBudgetSummary(deficitPlan, []);
    expect(summary.status).toBe("no_budget");
    expect(summary.remainingBalanceMinor).toBe(0);
  });

  it("simulates scenario with adjusted daily spend", () => {
    const expenses: Expense[] = [];
    // Adjust daily spend to 100 EGP (10,000 minor) instead of 200 EGP (20,000 minor)
    const sim = simulateScenario(mockPlan, expenses, 10000);

    expect(sim.adjustedDailySpendMinor).toBe(10000);
    // Runway becomes 800,000 / 10,000 = 80 days
    expect(sim.estimatedRunwayDays).toBe(80);
    // Previous baseline runway was 40 days -> diff is +40 days
    expect(sim.differenceInDays).toBe(40);
  });

  it("handles zero adjusted daily spend in simulation", () => {
    const sim = simulateScenario(mockPlan, [], 0);
    expect(sim.estimatedRunwayDays).toBeNull();
    expect(sim.estimatedExhaustionDate).toBeNull();
    expect(sim.balanceOnTargetDateMinor).toBe(800000);
  });

  it("sums expenses accurately", () => {
    const expenses: Expense[] = [
      { id: "1", amountMinor: 550, date: today, categoryId: "food", createdAt: "", updatedAt: "" },
      { id: "2", amountMinor: 450, date: today, categoryId: "other", createdAt: "", updatedAt: "" },
    ];
    expect(sumExpenses(expenses)).toBe(1000);
  });
});
