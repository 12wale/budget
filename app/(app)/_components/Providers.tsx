"use client";

import { BudgetProvider } from "@/context/BudgetContext";
import { PreferencesProvider } from "@/context/PreferencesContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PreferencesProvider>
      <BudgetProvider>{children}</BudgetProvider>
    </PreferencesProvider>
  );
}
