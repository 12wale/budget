import type { BudgetPlan, Expense, Language, LocalAppDataV1, Preferences } from "@/types/budget.types";
import { createClient } from "@/lib/supabase/client";

type PlanRow = {
  id: string;
  currency: string;
  starting_balance_minor: number | string;
  fixed_commitments_minor: number | string;
  start_date: string;
  target_date: string;
  planned_daily_spend_minor: number | string;
  forecast_mode: "planned" | "actual";
  created_at: string;
  updated_at: string;
};

type ExpenseRow = {
  id: string;
  amount_minor: number | string;
  expense_date: string;
  category_id: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

const toPlan = (row: PlanRow): BudgetPlan => ({
  id: row.id,
  currency: row.currency,
  startingBalanceMinor: Number(row.starting_balance_minor),
  fixedCommitmentsMinor: Number(row.fixed_commitments_minor),
  startDate: row.start_date,
  targetDate: row.target_date,
  plannedDailySpendMinor: Number(row.planned_daily_spend_minor),
  forecastMode: row.forecast_mode,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toExpense = (row: ExpenseRow): Expense => ({
  id: row.id,
  amountMinor: Number(row.amount_minor),
  date: row.expense_date,
  categoryId: row.category_id,
  note: row.note ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function databaseId(value: string): string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : crypto.randomUUID();
}

export async function loadUserBudget(userId: string): Promise<{
  plan: BudgetPlan | null;
  expenses: Expense[];
}> {
  const supabase = createClient();
  const [planResult, expensesResult] = await Promise.all([
    supabase.from("budget_plans").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("expenses").select("*").eq("user_id", userId).order("expense_date", { ascending: false }),
  ]);

  throwIfError(planResult.error);
  throwIfError(expensesResult.error);

  return {
    plan: planResult.data ? toPlan(planResult.data as PlanRow) : null,
    expenses: (expensesResult.data ?? []).map((row) => toExpense(row as ExpenseRow)),
  };
}

export async function loadUserPreferences(userId: string): Promise<Preferences | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("preferences")
    .select("language,currency")
    .eq("user_id", userId)
    .maybeSingle();
  throwIfError(error);
  return data ? { language: data.language as Language, currency: data.currency } : null;
}

export async function saveUserPreferences(userId: string, preferences: Preferences): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("preferences").upsert(
    { user_id: userId, language: preferences.language, currency: preferences.currency },
    { onConflict: "user_id" }
  );
  throwIfError(error);
}

export async function saveUserPlan(userId: string, plan: BudgetPlan): Promise<BudgetPlan> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budget_plans")
    .upsert(
      {
        id: plan.id,
        user_id: userId,
        currency: plan.currency,
        starting_balance_minor: plan.startingBalanceMinor,
        fixed_commitments_minor: plan.fixedCommitmentsMinor,
        start_date: plan.startDate,
        target_date: plan.targetDate,
        planned_daily_spend_minor: plan.plannedDailySpendMinor,
        forecast_mode: plan.forecastMode,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();
  throwIfError(error);
  return toPlan(data as PlanRow);
}

export async function saveUserExpense(userId: string, expense: Expense, planId: string | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").upsert({
    id: expense.id,
    user_id: userId,
    plan_id: planId,
    amount_minor: expense.amountMinor,
    expense_date: expense.date,
    category_id: expense.categoryId,
    note: expense.note ?? null,
    created_at: expense.createdAt,
    updated_at: expense.updatedAt,
  });
  throwIfError(error);
}

export async function deleteUserExpense(userId: string, expenseId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").delete().eq("user_id", userId).eq("id", expenseId);
  throwIfError(error);
}

export async function clearUserBudget(userId: string): Promise<void> {
  const supabase = createClient();
  const expenses = await supabase.from("expenses").delete().eq("user_id", userId);
  throwIfError(expenses.error);
  const plan = await supabase.from("budget_plans").delete().eq("user_id", userId);
  throwIfError(plan.error);
}

export async function replaceUserData(userId: string, data: LocalAppDataV1): Promise<LocalAppDataV1> {
  const supabase = createClient();
  const currentPlan = await supabase.from("budget_plans").select("id").eq("user_id", userId).maybeSingle();
  throwIfError(currentPlan.error);
  const importedPlan = data.plan
    ? { ...data.plan, id: currentPlan.data?.id ?? databaseId(data.plan.id) }
    : null;
  const importedExpenses = data.expenses.map((expense) => ({
    ...expense,
    id: databaseId(expense.id),
  }));

  if (importedPlan) await saveUserPlan(userId, importedPlan);

  const existingExpenses = await supabase.from("expenses").select("id").eq("user_id", userId);
  throwIfError(existingExpenses.error);
  if (importedExpenses.length) {
    const { error } = await supabase.from("expenses").upsert(
      importedExpenses.map((expense) => ({
        id: expense.id,
        user_id: userId,
        plan_id: importedPlan?.id ?? null,
        amount_minor: expense.amountMinor,
        expense_date: expense.date,
        category_id: expense.categoryId,
        note: expense.note ?? null,
        created_at: expense.createdAt,
        updated_at: expense.updatedAt,
      }))
    );
    throwIfError(error);
  }
  const importedIds = new Set(importedExpenses.map((expense) => expense.id));
  for (const row of existingExpenses.data ?? []) {
    if (!importedIds.has(row.id)) {
      const { error } = await supabase.from("expenses").delete().eq("user_id", userId).eq("id", row.id);
      throwIfError(error);
    }
  }
  if (!importedPlan && currentPlan.data) {
    const { error } = await supabase.from("budget_plans").delete().eq("user_id", userId);
    throwIfError(error);
  }
  await saveUserPreferences(userId, data.preferences);
  return { ...data, plan: importedPlan, expenses: importedExpenses };
}
