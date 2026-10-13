"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import type { Language, LocalAppDataV1, Preferences, PreferencesAction } from "@/types/budget.types";
import { createTranslator } from "@/lib/i18n";
import { loadAppData, savePreferences } from "@/lib/storage";
import { formatMinor } from "@/lib/currency";

// ─────────────────────────────────────────────
// State & Reducer
// ─────────────────────────────────────────────

function preferencesReducer(state: Preferences, action: PreferencesAction): Preferences {
  switch (action.type) {
    case "SET_LANGUAGE":
      return { ...state, language: action.language };
    case "SET_CURRENCY":
      return { ...state, currency: action.currency };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

type PreferencesContextValue = {
  preferences: Preferences;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: string) => void;
  /** Translation helper bound to current language */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Format minor units using current currency and locale */
  formatAmount: (minor: number) => string;
  /** BCP-47 locale string for the current language */
  locale: string;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

const LOCALE_MAP: Record<Language, string> = {
  ar: "ar-EG",
  en: "en-US",
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, dispatch] = useReducer(preferencesReducer, {
    language: "ar",
    currency: "EGP",
  });

  // Hydrate from storage on mount
  useEffect(() => {
    const result = loadAppData();
    if (result.ok && result.data.preferences) {
      const { language, currency } = result.data.preferences;
      dispatch({ type: "SET_LANGUAGE", language });
      dispatch({ type: "SET_CURRENCY", currency });
    }
  }, []);

  // Sync document direction on language change
  useEffect(() => {
    const dir = preferences.language === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", preferences.language);
  }, [preferences.language]);

  const setLanguage = useCallback((language: Language) => {
    dispatch({ type: "SET_LANGUAGE", language });
    savePreferences({ ...preferences, language });
  }, [preferences]);

  const setCurrency = useCallback((currency: string) => {
    dispatch({ type: "SET_CURRENCY", currency });
    savePreferences({ ...preferences, currency });
  }, [preferences]);

  const locale = LOCALE_MAP[preferences.language] ?? "ar-EG";
  const t = createTranslator(preferences.language);
  const formatAmount = (minor: number) =>
    formatMinor(minor, preferences.currency, locale);

  return (
    <PreferencesContext.Provider
      value={{ preferences, setLanguage, setCurrency, t, formatAmount, locale }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
