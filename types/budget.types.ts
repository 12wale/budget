// ─────────────────────────────────────────────
// Budget Survival Calculator — Core Types
// All monetary values stored as integer minor units (e.g., piastres)
// ─────────────────────────────────────────────

export type Currency = "EGP" | "USD" | "EUR" | "GBP" | "SAR" | string;

export type Language = "ar" | "en";

export type ForecastMode = "planned" | "actual";
export type BudgetPlanState = "active" | "ended";

export type PlanStatus =
  | "healthy"
  | "above_target"
  | "no_budget"
  | "no_days_remaining"
  | "insufficient_data"
  | "expired";

// ─────────────────────────────────────────────
// Budget Plan
// ─────────────────────────────────────────────

export type BudgetPlan = {
  id: string;
  currency: Currency;
  /** Total money available at plan start — stored in minor units */
  startingBalanceMinor: number;
  /** Reserved commitments (rent, bills, etc.) — stored in minor units */
  fixedCommitmentsMinor: number;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD — must be >= startDate */
  targetDate: string;
  /** User's estimated daily variable spend — stored in minor units */
  plannedDailySpendMinor: number;
  forecastMode: ForecastMode;
  status: BudgetPlanState;
  endedAt: string | null;
  savedBalanceMinor: number;
  createdAt: string;
  updatedAt: string;
};

// ─────────────────────────────────────────────
// Expense
// ─────────────────────────────────────────────

export type Expense = {
  id: string;
  /** Amount in minor units */
  amountMinor: number;
  /** YYYY-MM-DD */
  date: string;
  categoryId: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

// ─────────────────────────────────────────────
// Category
// ─────────────────────────────────────────────

export type ExpenseCategory = {
  id: string;
  /** i18n key for label */
  labelKey: string;
  /** Key used to select the category icon */
  icon: string;
  isCustom?: boolean;
};

// ─────────────────────────────────────────────
// Calculated Summary (derived — never persisted)
// ─────────────────────────────────────────────

export type BudgetSummary = {
  /** startingBalance - fixedCommitments */
  reservedBalanceMinor: number;
  /** reservedBalance - sum(variable expenses) */
  remainingBalanceMinor: number;
  /** Calendar days from today through targetDate */
  remainingDays: number;
  /** remainingBalance / remainingDays — null if remainingDays <= 0 */
  dailyLimitMinor: number | null;
  /** remainingBalance / spendingBaseline — null if baseline <= 0 */
  estimatedRunwayDays: number | null;
  /** ISO date string, null if runway not calculable */
  estimatedExhaustionDate: string | null;
  /** Which daily-spend value was used for runway */
  spendingBaselineMinor: number;
  /** Whether baseline came from planned input or actual average */
  forecastMode: ForecastMode;
  status: PlanStatus;
};

// ─────────────────────────────────────────────
// Simulator
// ─────────────────────────────────────────────

export type SimulatorResult = {
  adjustedDailySpendMinor: number;
  estimatedRunwayDays: number | null;
  estimatedExhaustionDate: string | null;
  balanceOnTargetDateMinor: number | null;
  differenceInDays: number | null;
};

// ─────────────────────────────────────────────
// Preferences
// ─────────────────────────────────────────────

export type Preferences = {
  language: Language;
  currency: Currency;
};

// ─────────────────────────────────────────────
// Storage Envelope
// ─────────────────────────────────────────────

export type LocalAppDataV1 = {
  schemaVersion: 1;
  plan: BudgetPlan | null;
  expenses: Expense[];
  preferences: Preferences;
};

// ─────────────────────────────────────────────
// UI State
// ─────────────────────────────────────────────

export type UIState = {
  /** Modal currently open */
  activeModal: "expense-add" | "expense-edit" | "expense-delete" | "plan-edit" | "reset-confirm" | null;
  /** Expense being edited or deleted */
  targetExpenseId: string | null;
  /** Last storage error message */
  storageError: string | null;
};

// ─────────────────────────────────────────────
// Context Action Types
// ─────────────────────────────────────────────

export type BudgetAction =
  | { type: "START_LOAD" }
  | { type: "SET_PLAN"; plan: BudgetPlan }
  | { type: "END_PLAN" }
  | { type: "ADD_EXPENSE"; expense: Expense }
  | { type: "UPDATE_EXPENSE"; expense: Expense }
  | { type: "DELETE_EXPENSE"; id: string }
  | { type: "RESET_ALL" }
  | { type: "SET_UI"; ui: Partial<UIState> }
  | { type: "SET_STORAGE_ERROR"; error: string | null }
  | { type: "HYDRATE"; data: LocalAppDataV1 };

export type PreferencesAction =
  | { type: "SET_LANGUAGE"; language: Language }
  | { type: "SET_CURRENCY"; currency: Currency };
