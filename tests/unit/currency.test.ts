import { describe, it, expect } from "vitest";
import {
  decimalToMinor,
  minorToDecimal,
  formatMinor,
  getCurrencyDecimals,
} from "@/lib/currency";

describe("Currency Helpers", () => {
  it("converts decimal to minor units accurately", () => {
    expect(decimalToMinor(100.5, "EGP")).toBe(10050);
    expect(decimalToMinor(0.99, "USD")).toBe(99);
    expect(decimalToMinor(1000, "SAR")).toBe(100000);
    expect(decimalToMinor(15.123, "EGP")).toBe(1512); // rounded to 2 decimals
  });

  it("converts minor units back to decimal", () => {
    expect(minorToDecimal(10050, "EGP")).toBe(100.5);
    expect(minorToDecimal(99, "USD")).toBe(0.99);
    expect(minorToDecimal(0, "SAR")).toBe(0);
  });

  it("formats minor units with Latin numerals for Arabic locale", () => {
    const formatted = formatMinor(15050, "EGP", "ar-EG");
    // Must contain 150.50 or Latin digits, not Arabic-Indic digits ٠-٩
    expect(formatted).toMatch(/150\.50|150,50/);
    expect(formatted).not.toMatch(/[٠-٩]/);
  });

  it("formats minor units correctly for English locale", () => {
    const formatted = formatMinor(500000, "USD", "en-US");
    expect(formatted).toContain("5,000.00");
    expect(formatted).toContain("$");
  });

  it("retrieves decimals correctly", () => {
    expect(getCurrencyDecimals("EGP")).toBe(2);
    expect(getCurrencyDecimals("USD")).toBe(2);
  });
});
