"use client";

import { BudgetProvider } from "@/context/BudgetContext";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { AuthProvider } from "@/context/AuthContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <BudgetProvider>{children}</BudgetProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
