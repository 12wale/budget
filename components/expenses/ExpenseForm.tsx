"use client";

import { useState, type FormEvent } from "react";
import { ExpenseFormSchema } from "@/types/budget.schemas";
import type { Expense } from "@/types/budget.types";
import { useBudget } from "@/context/BudgetContext";
import { usePreferences } from "@/context/PreferencesContext";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PRESET_CATEGORIES } from "@/lib/categories";
import { decimalToMinor } from "@/lib/currency";
import { todayISO } from "@/lib/date";

type FormErrors = Partial<Record<string, string>>;

type ExpenseFormProps = {
  expense?: Expense;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ExpenseForm({ expense, onSuccess, onCancel }: ExpenseFormProps) {
  const { addExpense, updateExpense, plan } = useBudget();
  const { t, preferences } = usePreferences();

  const isEdit = Boolean(expense);
  const currency = plan?.currency ?? preferences.currency;

  const [values, setValues] = useState({
    amount: expense ? String(expense.amountMinor / 100) : "",
    date: expense ? expense.date : todayISO(),
    categoryId: expense ? expense.categoryId : "food",
    note: expense?.note ?? "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = ExpenseFormSchema.safeParse({
      amount: values.amount,
      date: values.date,
      categoryId: values.categoryId,
      note: values.note.trim() ? values.note.trim() : undefined,
    });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    const data = result.data;
    const now = new Date().toISOString();

    if (isEdit && expense) {
      const updated: Expense = {
        ...expense,
        amountMinor: decimalToMinor(Number(data.amount), currency),
        categoryId: data.categoryId,
        date: data.date,
        note: data.note,
        updatedAt: now,
      };
      updateExpense(updated);
    } else {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        amountMinor: decimalToMinor(Number(data.amount), currency),
        categoryId: data.categoryId,
        date: data.date,
        note: data.note,
        createdAt: now,
        updatedAt: now,
      };
      addExpense(newExpense);
    }

    setLoading(false);
    onSuccess?.();
  }

  const categoryOptions = PRESET_CATEGORIES.map((c) => ({
    value: c.id,
    label: `${c.icon} ${t(c.labelKey)}`,
  }));

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Amount with currency suffix */}
      <Input
        id="expense-amount"
        label={t("expenses.fields.amount")}
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        required
        placeholder="0.00"
        value={values.amount}
        onChange={(e) => set("amount", e.target.value)}
        error={errors.amount}
        suffix={currency}
      />

      {/* Date */}
      <Input
        id="expense-date"
        label={t("expenses.fields.date")}
        type="date"
        required
        value={values.date}
        onChange={(e) => set("date", e.target.value)}
        error={errors.date}
      />

      {/* Category */}
      <Select
        id="expense-category"
        label={t("expenses.fields.category")}
        value={values.categoryId}
        onChange={(e) => set("categoryId", e.target.value)}
        options={categoryOptions}
        error={errors.categoryId}
      />

      {/* Note */}
      <Input
        id="expense-note"
        label={t("expenses.fields.note")}
        type="text"
        placeholder={t("expenses.fields.notePlaceholder")}
        value={values.note}
        onChange={(e) => set("note", e.target.value)}
        error={errors.note}
        maxLength={200}
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-3">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
        <Button type="submit" loading={loading} className="min-w-[100px]">
          {isEdit ? t("common.save") : t("expenses.addExpense")}
        </Button>
      </div>
    </form>
  );
}
