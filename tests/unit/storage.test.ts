import { describe, it, expect, beforeEach } from "vitest";
import {
  loadAppData,
  saveAppData,
  clearAppData,
  exportExpensesCSV,
  exportBackupJSON,
  validateBackupJSON,
} from "@/lib/storage";
import type { LocalAppDataV1 } from "@/types/budget.types";

describe("Storage Layer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleData: LocalAppDataV1 = {
    schemaVersion: 1,
    plan: {
      id: "p1",
      currency: "EGP",
      startingBalanceMinor: 500000,
      fixedCommitmentsMinor: 100000,
      startDate: "2026-10-01",
      targetDate: "2026-10-31",
      plannedDailySpendMinor: 10000,
      forecastMode: "planned",
      status: "active",
      endedAt: null,
      savedBalanceMinor: 0,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
    expenses: [
      {
        id: "e1",
        amountMinor: 2500,
        date: "2026-10-02",
        categoryId: "food",
        note: "Lunch",
        createdAt: "2026-10-02T00:00:00.000Z",
        updatedAt: "2026-10-02T00:00:00.000Z",
      },
    ],
    preferences: {
      language: "ar",
      currency: "EGP",
    },
  };

  it("returns default data when storage is empty", () => {
    const res = loadAppData();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.plan).toBeNull();
      expect(res.data.expenses).toEqual([]);
      expect(res.data.schemaVersion).toBe(1);
    }
  });

  it("saves and reloads valid app data", () => {
    const saveRes = saveAppData(sampleData);
    expect(saveRes.ok).toBe(true);

    const loadRes = loadAppData();
    expect(loadRes.ok).toBe(true);
    if (loadRes.ok) {
      expect(loadRes.data.plan?.id).toBe("p1");
      expect(loadRes.data.expenses).toHaveLength(1);
    }
  });

  it("handles corrupted data in storage by returning malformed error", () => {
    localStorage.setItem("budget_app_v1", "{ not valid json ]");
    const loadRes = loadAppData();
    expect(loadRes.ok).toBe(false);
    if (!loadRes.ok) {
      expect(loadRes.error).toBe("malformed");
    }
  });

  it("clears app data correctly", () => {
    saveAppData(sampleData);
    clearAppData();
    const loadRes = loadAppData();
    expect(loadRes.ok).toBe(true);
    if (loadRes.ok) {
      expect(loadRes.data.plan).toBeNull();
    }
  });

  it("exports expenses to CSV format with headers", () => {
    const csv = exportExpensesCSV(sampleData);
    expect(csv).toContain('"id","date","category","amount_minor","currency","note"');
    expect(csv).toContain('"e1","2026-10-02","food","2500","EGP","Lunch"');
  });

  it("validates backup JSON correctly", () => {
    const json = exportBackupJSON(sampleData);
    const validRes = validateBackupJSON(json);
    expect(validRes.ok).toBe(true);

    const invalidRes = validateBackupJSON(`{"schemaVersion": 99}`);
    expect(invalidRes.ok).toBe(false);
  });
});
