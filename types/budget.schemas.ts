import { z } from "zod";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format");

const positiveMinor = z.number().int().min(0);

// ─────────────────────────────────────────────
// BudgetPlan Schema
// ─────────────────────────────────────────────

export const BudgetPlanSchema = z.object({
  id: z.string().min(1),
  currency: z.string().min(1).max(10),
  startingBalanceMinor: positiveMinor,
  fixedCommitmentsMinor: positiveMinor,
  startDate: isoDate,
  targetDate: isoDate,
  plannedDailySpendMinor: positiveMinor,
  forecastMode: z.enum(["planned", "actual"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─────────────────────────────────────────────
// Expense Schema
// ─────────────────────────────────────────────

export const ExpenseSchema = z.object({
  id: z.string().min(1),
  amountMinor: z.number().int().min(1, "Amount must be greater than zero"),
  date: isoDate,
  categoryId: z.string().min(1),
  note: z.string().max(200).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─────────────────────────────────────────────
// Preferences Schema
// ─────────────────────────────────────────────

export const PreferencesSchema = z.object({
  language: z.enum(["ar", "en"]),
  currency: z.string().min(1).max(10),
});

// ─────────────────────────────────────────────
// Storage Envelope Schema
// ─────────────────────────────────────────────

export const LocalAppDataV1Schema = z.object({
  schemaVersion: z.literal(1),
  plan: BudgetPlanSchema.nullable(),
  expenses: z.array(ExpenseSchema),
  preferences: PreferencesSchema,
});

// ─────────────────────────────────────────────
// Form Input Schemas (validated before conversion to minor units)
// ─────────────────────────────────────────────

export const BudgetSetupFormSchema = z
  .object({
    startingBalance: z
      .string()
      .min(1, "required")
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
        message: "Enter an amount greater than zero",
      }),
    currency: z.string().min(1),
    startDate: isoDate,
    targetDate: isoDate,
    fixedCommitments: z
      .string()
      .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
        message: "Enter a valid number",
      }),
    plannedDailySpend: z
      .string()
      .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
        message: "Enter a valid number",
      }),
  })
  .refine(
    (d) => {
      const start = new Date(d.startDate);
      const target = new Date(d.targetDate);
      return target >= start;
    },
    {
      message: "The target date must be on or after the start date",
      path: ["targetDate"],
    }
  )
  .refine(
    (d) => Number(d.fixedCommitments) <= Number(d.startingBalance),
    {
      message: "Fixed commitments cannot exceed the available balance",
      path: ["fixedCommitments"],
    }
  );

export const ExpenseFormSchema = z.object({
  amount: z
    .string()
    .min(1, "required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Enter an amount greater than zero",
    }),
  date: isoDate,
  categoryId: z.string().min(1, "required"),
  note: z.string().max(200).optional(),
});

export type BudgetSetupFormValues = z.infer<typeof BudgetSetupFormSchema>;
export type ExpenseFormValues = z.infer<typeof ExpenseFormSchema>;
