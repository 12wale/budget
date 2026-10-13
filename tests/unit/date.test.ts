import { describe, it, expect } from "vitest";
import {
  daysBetween,
  addDays,
  isValidISODate,
  formatDate,
} from "@/lib/date";

describe("Date Utilities", () => {
  it("calculates calendar days between dates safely", () => {
    expect(daysBetween("2026-10-01", "2026-10-10")).toBe(9);
    expect(daysBetween("2026-10-10", "2026-10-01")).toBe(-9);
    expect(daysBetween("2026-10-01", "2026-10-01")).toBe(0);
  });

  it("handles crossing month and year boundaries", () => {
    expect(daysBetween("2025-12-30", "2026-01-02")).toBe(3);
    expect(daysBetween("2024-02-28", "2024-03-01")).toBe(2); // 2024 is leap year
  });

  it("adds days correctly", () => {
    expect(addDays("2026-10-01", 5)).toBe("2026-10-06");
    expect(addDays("2026-10-01", 31)).toBe("2026-11-01");
    expect(addDays("2026-10-05", -5)).toBe("2026-09-30");
  });

  it("validates ISO YYYY-MM-DD dates", () => {
    expect(isValidISODate("2026-10-13")).toBe(true);
    expect(isValidISODate("2026-02-30")).toBe(false);
    expect(isValidISODate("invalid-date")).toBe(false);
    expect(isValidISODate("")).toBe(false);
  });

  it("formats dates gracefully", () => {
    const formatted = formatDate("2026-10-13", "ar-EG");
    expect(formatted).toBeTruthy();
    expect(formatDate("invalid-date", "ar-EG")).toBe("invalid-date");
  });
});
