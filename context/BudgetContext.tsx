"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  BudgetAction,
  BudgetPlan,
  BudgetSummary,
  Expense,
  LocalAppDataV1,
  UIState,
} from "@/types/budget.types";
import { calculateBudgetSummary } from "@/lib/budget.calculations";
import { loadAppData, saveAppData } from "@/lib/storage";

// ─────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────

type BudgetState = {
  plan: BudgetPlan | null;
  expenses: Expense[];
  ui: UIState;
  hydrated: boolean;
};

const INITIAL_STATE: BudgetState = {
  plan: null,
  expenses: [],
  ui: {
    activeModal: null,
    targetExpenseId: null,
    storageError: null,
  },
  hydrated: false,
};

// ─────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...state,
        plan: action.data.plan,
        expenses: action.data.expenses,
        hydrated: true,
      };

    case "SET_PLAN":
      return { ...state, plan: action.plan };

    case "ADD_EXPENSE":
      return { ...state, expenses: [...state.expenses, action.expense] };

    case "UPDATE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.expense.id ? action.expense : e
        ),
      };

    case "DELETE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.id),
      };

    case "RESET_ALL":
      return { ...INITIAL_STATE, hydrated: true };

    case "SET_UI":
      return { ...state, ui: { ...state.ui, ...action.ui } };

    case "SET_STORAGE_ERROR":
      return { ...state, ui: { ...state.ui, storageError: action.error } };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

type BudgetContextValue = {
  plan: BudgetPlan | null;
  expenses: Expense[];
  summary: BudgetSummary | null;
  ui: UIState;
  hydrated: boolean;
  // Actions
  setPlan: (plan: BudgetPlan) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  resetAll: () => void;
  openModal: (modal: UIState["activeModal"], expenseId?: string) => void;
  closeModal: () => void;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, INITIAL_STATE);

  // Hydrate from storage on mount
  useEffect(() => {
    const result = loadAppData();
    if (result.ok) {
      dispatch({ type: "HYDRATE", data: result.data });
    } else {
      // Still mark hydrated so UI can show error state
      dispatch({ type: "HYDRATE", data: { schemaVersion: 1, plan: null, expenses: [], preferences: { language: "ar", currency: "EGP" } } });
      dispatch({
        type: "SET_STORAGE_ERROR",
        error: "storageLoad",
      });
    }
  }, []);

  // Persist to storage whenever plan or expenses change (after hydration)
  useEffect(() => {
    if (!state.hydrated) return;

    const data: LocalAppDataV1 = {
      schemaVersion: 1,
      plan: state.plan,
      expenses: state.expenses,
      preferences: { language: "ar", currency: "EGP" }, // will be merged by PreferencesContext
    };

    const result = saveAppData(data);
    if (!result.ok) {
      dispatch({ type: "SET_STORAGE_ERROR", error: "storageSave" });
    } else {
      dispatch({ type: "SET_STORAGE_ERROR", error: null });
    }
  }, [state.plan, state.expenses, state.hydrated]);

  // Derived: budget summary
  const summary = useMemo<BudgetSummary | null>(() => {
    if (!state.plan) return null;
    return calculateBudgetSummary(state.plan, state.expenses);
  }, [state.plan, state.expenses]);

  // ─── Actions ───────────────────────────────

  const setPlan = useCallback((plan: BudgetPlan) => {
    dispatch({ type: "SET_PLAN", plan });
  }, []);

  const addExpense = useCallback((expense: Expense) => {
    dispatch({ type: "ADD_EXPENSE", expense });
  }, []);

  const updateExpense = useCallback((expense: Expense) => {
    dispatch({ type: "UPDATE_EXPENSE", expense });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    dispatch({ type: "DELETE_EXPENSE", id });
  }, []);

  const resetAll = useCallback(() => {
    dispatch({ type: "RESET_ALL" });
  }, []);

  const openModal = useCallback(
    (modal: UIState["activeModal"], expenseId?: string) => {
      dispatch({
        type: "SET_UI",
        ui: { activeModal: modal, targetExpenseId: expenseId ?? null },
      });
    },
    []
  );

  const closeModal = useCallback(() => {
    dispatch({ type: "SET_UI", ui: { activeModal: null, targetExpenseId: null } });
  }, []);

  return (
    <BudgetContext.Provider
      value={{
        plan: state.plan,
        expenses: state.expenses,
        summary,
        ui: state.ui,
        hydrated: state.hydrated,
        setPlan,
        addExpense,
        updateExpense,
        deleteExpense,
        resetAll,
        openModal,
        closeModal,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useBudget(): BudgetContextValue {
  const ctx = useContext(BudgetContext);
  if (!ctx) {
    throw new Error("useBudget must be used within BudgetProvider");
  }
  return ctx;
}
