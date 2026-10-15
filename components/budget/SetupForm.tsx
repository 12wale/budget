"use client";

import { useState, useEffect, type FormEvent } from "react";
import { BudgetSetupFormSchema } from "@/types/budget.schemas";
import type { BudgetPlan } from "@/types/budget.types";
import { useBudget } from "@/context/BudgetContext";
import { usePreferences } from "@/context/PreferencesContext";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FiLock } from "react-icons/fi";
import { Card, CardBody } from "@/components/ui/Card";
import { decimalToMinor } from "@/lib/currency";
import { todayISO, addDays } from "@/lib/date";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

type FormErrors = Partial<Record<string, string>>;

type SetupFormProps = {
  editMode?: boolean;
  onSuccess?: () => void;
};

export function SetupForm({ editMode = false, onSuccess }: SetupFormProps) {
  const { plan, setPlan, closeModal } = useBudget();
  const { t, preferences } = usePreferences();

  const [values, setValues] = useState({
    startingBalance: plan ? String(plan.startingBalanceMinor / 100) : "",
    currency: plan?.currency ?? preferences.currency,
    startDate: plan?.startDate ?? "",
    targetDate: plan?.targetDate ?? "",
    fixedCommitments: plan ? String(plan.fixedCommitmentsMinor / 100) : "0",
    plannedDailySpend: plan ? String(plan.plannedDailySpendMinor / 100) : "",
  });

  // Populate default dates after client mount to prevent SSR new Date() evaluation
  useEffect(() => {
    if (!plan && !values.startDate) {
      const todayStr = todayISO();
      const defaultTarget = addDays(todayStr, 30);
      setValues((v) => ({
        ...v,
        startDate: v.startDate || todayStr,
        targetDate: v.targetDate || defaultTarget,
      }));
    }
  }, [plan, values.startDate]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const resolvedStartDate = values.startDate || todayISO();
    const resolvedTargetDate = values.targetDate || addDays(resolvedStartDate, 30);

    const result = BudgetSetupFormSchema.safeParse({
      ...values,
      startDate: resolvedStartDate,
      targetDate: resolvedTargetDate,
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

    const newPlan: BudgetPlan = {
      id: plan?.id ?? crypto.randomUUID(),
      currency: data.currency,
      startingBalanceMinor: decimalToMinor(Number(data.startingBalance), data.currency),
      fixedCommitmentsMinor: decimalToMinor(Number(data.fixedCommitments), data.currency),
      startDate: data.startDate,
      targetDate: data.targetDate,
      plannedDailySpendMinor: decimalToMinor(Number(data.plannedDailySpend), data.currency),
      forecastMode: "planned",
      createdAt: plan?.createdAt ?? now,
      updatedAt: now,
    };

    const saved = await setPlan(newPlan);
    setLoading(false);
    if (!saved) return;
    onSuccess?.();
    if (editMode) closeModal();
  }

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
    value: c.code,
    label: c.label,
  }));

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5" id="setup-form">
      {/* Row 1: Balance + Currency */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
        <Input
          id="startingBalance"
          label={t("setup.fields.startingBalance")}
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          required
          placeholder="0.00"
          value={values.startingBalance}
          onChange={(e) => set("startingBalance", e.target.value)}
          error={errors.startingBalance}
        />
        <Select
          id="currency"
          label={t("setup.fields.currency")}
          value={values.currency}
          onChange={(e) => set("currency", e.target.value)}
          options={currencyOptions}
          className="min-w-[130px]"
        />
      </div>

      {/* Row 2: Start date + Target date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="startDate"
          label={t("setup.fields.startDate")}
          type="date"
          required
          value={values.startDate}
          onChange={(e) => set("startDate", e.target.value)}
          error={errors.startDate}
          max={values.targetDate || undefined}
        />
        <Input
          id="targetDate"
          label={t("setup.fields.targetDate")}
          type="date"
          required
          value={values.targetDate}
          onChange={(e) => set("targetDate", e.target.value)}
          error={errors.targetDate}
          min={values.startDate || undefined}
        />
      </div>

      {/* Row 3: Fixed commitments */}
      <Input
        id="fixedCommitments"
        label={t("setup.fields.fixedCommitments")}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={values.fixedCommitments}
        onChange={(e) => set("fixedCommitments", e.target.value)}
        error={errors.fixedCommitments}
        helper={t("setup.fields.fixedCommitmentsHelper")}
        suffix={values.currency}
      />

      {/* Row 4: Planned daily spend */}
      <Input
        id="plannedDailySpend"
        label={t("setup.fields.plannedDailySpend")}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        required
        placeholder="0.00"
        value={values.plannedDailySpend}
        onChange={(e) => set("plannedDailySpend", e.target.value)}
        error={errors.plannedDailySpend}
        helper={t("setup.fields.plannedDailySpendHelper")}
        suffix={values.currency}
      />

      {/* Submit */}
      <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
        {editMode ? t("setup.edit") : t("setup.cta")}
      </Button>

      {!editMode && (
        <p className="text-xs text-center" style={{ color: "var(--color-muted)" }}>
          <FiLock className="me-1 inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
          {t("setup.privacy")}
        </p>
      )}
    </form>
  );
}
