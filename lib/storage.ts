// ─────────────────────────────────────────────
// localStorage repository — versioned, Zod-validated
// ─────────────────────────────────────────────

import { LocalAppDataV1Schema } from "@/types/budget.schemas";
import type { LocalAppDataV1, Preferences } from "@/types/budget.types";

const STORAGE_KEY = "budget_app_v1";

const DEFAULT_DATA: LocalAppDataV1 = {
  schemaVersion: 1,
  plan: null,
  expenses: [],
  preferences: {
    language: "ar",
    currency: "EGP",
  },
};

// ─────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────

export type LoadResult =
  | { ok: true; data: LocalAppDataV1 }
  | { ok: false; error: "unavailable" | "malformed" | "version_mismatch"; raw?: string };

export function loadAppData(): LoadResult {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ok: false, error: "unavailable" };
  }

  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { ok: false, error: "unavailable" };
  }

  if (raw === null) {
    // No data yet — first visit
    return { ok: true, data: DEFAULT_DATA };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "malformed", raw };
  }

  // Version check before full validation
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as Record<string, unknown>).schemaVersion !== 1
  ) {
    return { ok: false, error: "version_mismatch", raw };
  }

  const result = LocalAppDataV1Schema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, error: "malformed", raw };
  }

  return { ok: true, data: result.data };
}

// ─────────────────────────────────────────────
// Write
// ─────────────────────────────────────────────

export type SaveResult =
  | { ok: true }
  | { ok: false; error: "unavailable" | "quota_exceeded" | "unknown" };

export function saveAppData(data: LocalAppDataV1): SaveResult {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ok: false, error: "unavailable" };
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      return { ok: false, error: "quota_exceeded" };
    }
    return { ok: false, error: "unknown" };
  }
}

// ─────────────────────────────────────────────
// Clear
// ─────────────────────────────────────────────

export function clearAppData(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silently fail — user will be redirected anyway
    }
  }
}

// ─────────────────────────────────────────────
// Preferences only (faster partial update)
// ─────────────────────────────────────────────

export function savePreferences(preferences: Preferences): SaveResult {
  const loadResult = loadAppData();
  if (!loadResult.ok) return { ok: false, error: "unavailable" };

  return saveAppData({ ...loadResult.data, preferences });
}

// ─────────────────────────────────────────────
// CSV export
// ─────────────────────────────────────────────

export function exportExpensesCSV(data: LocalAppDataV1): string {
  const headers = ["id", "date", "category", "amount_minor", "currency", "note"];
  const currency = data.preferences.currency;

  const rows = data.expenses.map((e) => [
    e.id,
    e.date,
    e.categoryId,
    e.amountMinor.toString(),
    currency,
    e.note ?? "",
  ]);

  const escape = (val: string) =>
    `"${val.replace(/"/g, '""')}"`;

  return [
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ].join("\n");
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportBackupJSON(data: LocalAppDataV1): string {
  return JSON.stringify(data, null, 2);
}

export function downloadJSON(jsonContent: string, filename: string): void {
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function validateBackupJSON(jsonStr: string): { ok: true; data: LocalAppDataV1 } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    const result = LocalAppDataV1Schema.safeParse(parsed);
    if (!result.success) {
      return { ok: false, error: result.error.issues.map((i) => i.message).join(", ") };
    }
    return { ok: true, data: result.data };
  } catch {
    return { ok: false, error: "Invalid JSON format" };
  }
}
