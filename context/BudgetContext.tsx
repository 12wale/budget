"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
  useState,
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
import { clearAppData, loadAppData, saveAppData } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import {
  clearUserBudget,
  deleteUserExpense,
  loadUserBudget,
  replaceUserData,
  saveUserExpense,
  saveUserPlan,
  endUserPlan,
} from "@/lib/supabase/repository";

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
    case "START_LOAD":
      return { ...INITIAL_STATE };
    case "HYDRATE":
      return {
        ...state,
        plan: action.data.plan,
        expenses: action.data.expenses,
        hydrated: true,
      };

    case "SET_PLAN":
      return { ...state, plan: action.plan };

    case "END_PLAN":
      return {
        ...state,
        plan: null,
        expenses: [],
      };

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
  savingsMinor: number;
  expenses: Expense[];
  summary: BudgetSummary | null;
  ui: UIState;
  hydrated: boolean;
  // Actions
  setPlan: (plan: BudgetPlan) => Promise<boolean>;
  endPlan: () => Promise<boolean>;
  addExpense: (expense: Expense) => Promise<boolean>;
  updateExpense: (expense: Expense) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  resetAll: () => Promise<boolean>;
  replaceData: (data: LocalAppDataV1) => Promise<boolean>;
  localDataPending: boolean;
  importLocalData: () => Promise<boolean>;
  dismissLocalDataPrompt: () => void;
  openModal: (modal: UIState["activeModal"], expenseId?: string) => void;
  closeModal: () => void;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, INITIAL_STATE);
  const [localDataPending, setLocalDataPending] = useState(false);
  const [savingsMinor, setSavingsMinor] = useState(0);
  const { user, loading: authLoading } = useAuth();
  const currentUserId = useRef<string | null>(null);

  // Load this account's data after the session is known.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const userId = user?.id ?? null;
    currentUserId.current = userId;

    if (!userId) {
      setLocalDataPending(false);
      setSavingsMinor(0);
      const local = loadAppData();
      dispatch({ type: "HYDRATE", data: local.ok ? local.data : { schemaVersion: 1, plan: null, expenses: [], preferences: { language: "ar", currency: "EGP" } } });
      return;
    }

    setLocalDataPending(false);
    setSavingsMinor(0);
    dispatch({ type: "START_LOAD" });
    loadUserBudget(userId)
      .then(async (data) => {
        if (!cancelled && currentUserId.current === userId) {
          const local = loadAppData();
          if (!data.plan && !data.hasPlanHistory && local.ok && (local.data.plan || local.data.expenses.length > 0)) {
            const imported = await replaceUserData(userId, local.data);
            if (cancelled || currentUserId.current !== userId) return;
            data = { ...data, ...imported };
            clearAppData();
          }
          setLocalDataPending(false);
          dispatch({ type: "HYDRATE", data: { schemaVersion: 1, ...data, preferences: { language: "ar", currency: "EGP" } } });
          setSavingsMinor(data.savingsMinor);
          dispatch({ type: "SET_STORAGE_ERROR", error: null });
        }
      })
      .catch(() => {
        if (!cancelled && currentUserId.current === userId) {
          setSavingsMinor(0);
          dispatch({ type: "HYDRATE", data: { schemaVersion: 1, plan: null, expenses: [], preferences: { language: "ar", currency: "EGP" } } });
          dispatch({ type: "SET_STORAGE_ERROR", error: "تعذر تحميل بياناتك. تحقق من اتصالك ثم حاول مرة أخرى." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  // Derived: budget summary
  const summary = useMemo<BudgetSummary | null>(() => {
    if (!state.plan) return null;
    return calculateBudgetSummary(state.plan, state.expenses);
  }, [state.plan, state.expenses]);

  // ─── Actions ───────────────────────────────

  const setPlan = useCallback(async (plan: BudgetPlan) => {
    if (!user) {
      const current = loadAppData();
      if (!current.ok) return false;
      const savedLocal = saveAppData({ ...current.data, plan: { ...plan, status: "active", endedAt: null, savedBalanceMinor: 0 } });
      if (!savedLocal.ok) return false;
      dispatch({ type: "SET_PLAN", plan: { ...plan, status: "active", endedAt: null, savedBalanceMinor: 0 } });
      return true;
    }
    if (currentUserId.current !== user.id) return false;
    try {
      const savedPlan = await saveUserPlan(user.id, plan);
      dispatch({ type: "SET_PLAN", plan: savedPlan });
      dispatch({ type: "SET_STORAGE_ERROR", error: null });
      return true;
    } catch {
      dispatch({ type: "SET_STORAGE_ERROR", error: "تعذر حفظ الخطة. حاول مرة أخرى." });
      return false;
    }
  }, [user]);

  const endPlan = useCallback(async () => {
    if (!state.plan || !summary || !user || currentUserId.current !== user.id) return false;
    try {
      const endedAt = new Date().toISOString();
      const savedBalanceMinor = Math.max(0, summary.remainingBalanceMinor);
      await endUserPlan(user.id, state.plan.id, savedBalanceMinor, endedAt);
      dispatch({ type: "END_PLAN" });
      setSavingsMinor((value) => value + savedBalanceMinor);
      dispatch({ type: "SET_STORAGE_ERROR", error: null });
      return true;
    } catch {
      dispatch({ type: "SET_STORAGE_ERROR", error: "تعذر إنهاء الخطة. حاول مرة أخرى." });
      return false;
    }
  }, [state.plan, summary, user]);

  const addExpense = useCallback(async (expense: Expense) => {
    if (!user || currentUserId.current !== user.id) return false;
    try {
      await saveUserExpense(user.id, expense, state.plan?.id ?? null);
      dispatch({ type: "ADD_EXPENSE", expense });
      dispatch({ type: "SET_STORAGE_ERROR", error: null });
      return true;
    } catch {
      dispatch({ type: "SET_STORAGE_ERROR", error: "تعذر حفظ المصروف. حاول مرة أخرى." });
      return false;
    }
  }, [user, state.plan?.id]);

  const updateExpense = useCallback(async (expense: Expense) => {
    if (!user || currentUserId.current !== user.id) return false;
    try {
      await saveUserExpense(user.id, expense, state.plan?.id ?? null);
      dispatch({ type: "UPDATE_EXPENSE", expense });
      dispatch({ type: "SET_STORAGE_ERROR", error: null });
      return true;
    } catch {
      dispatch({ type: "SET_STORAGE_ERROR", error: "تعذر تحديث المصروف. حاول مرة أخرى." });
      return false;
    }
  }, [user, state.plan?.id]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!user || currentUserId.current !== user.id) return false;
    try {
      await deleteUserExpense(user.id, id);
      dispatch({ type: "DELETE_EXPENSE", id });
      dispatch({ type: "SET_STORAGE_ERROR", error: null });
      return true;
    } catch {
      dispatch({ type: "SET_STORAGE_ERROR", error: "تعذر حذف المصروف. حاول مرة أخرى." });
      return false;
    }
  }, [user]);

  const resetAll = useCallback(async () => {
    if (!user || currentUserId.current !== user.id) return false;
    try {
      await clearUserBudget(user.id);
      dispatch({ type: "RESET_ALL" });
      setSavingsMinor(0);
      dispatch({ type: "SET_STORAGE_ERROR", error: null });
      return true;
    } catch {
      dispatch({ type: "SET_STORAGE_ERROR", error: "تعذر حذف بيانات الميزانية. حاول مرة أخرى." });
      return false;
    }
  }, [user]);

  const replaceData = useCallback(async (data: LocalAppDataV1) => {
    if (!user || currentUserId.current !== user.id) return false;
    try {
      const savedData = await replaceUserData(user.id, data);
      dispatch({ type: "HYDRATE", data: savedData });
      dispatch({ type: "SET_STORAGE_ERROR", error: null });
      return true;
    } catch {
      dispatch({ type: "SET_STORAGE_ERROR", error: "تعذر استعادة النسخة. تحقق من الملف وحاول مرة أخرى." });
      return false;
    }
  }, [user]);

  const importLocalData = useCallback(async () => {
    if (!user || currentUserId.current !== user.id) return false;
    const local = loadAppData();
    if (!local.ok || (!local.data.plan && local.data.expenses.length === 0)) return false;
    try {
      const savedData = await replaceUserData(user.id, local.data);
      dispatch({ type: "HYDRATE", data: savedData });
      clearAppData();
      setLocalDataPending(false);
      dispatch({ type: "SET_STORAGE_ERROR", error: null });
      return true;
    } catch {
      dispatch({ type: "SET_STORAGE_ERROR", error: "تعذر نقل بيانات هذا الجهاز إلى حسابك." });
      return false;
    }
  }, [user]);

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
        savingsMinor,
        expenses: state.expenses,
        summary,
        ui: state.ui,
        hydrated: state.hydrated,
        setPlan,
        endPlan,
        addExpense,
        updateExpense,
        deleteExpense,
        resetAll,
        replaceData,
        localDataPending,
        importLocalData,
        dismissLocalDataPrompt: () => setLocalDataPending(false),
        openModal,
        closeModal,
      }}
    >
      {state.hydrated ? children : (
        <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-400" role="status">
          جاري تحميل بياناتك…
        </div>
      )}
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
