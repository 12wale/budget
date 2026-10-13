// ─────────────────────────────────────────────
// Currency utilities
// All amounts stored in integer minor units.
// Display only through these helpers — never raw minor units in UI.
// Do NOT convert between currencies. Format only.
// ─────────────────────────────────────────────

/** Minor unit scale per currency (decimal places) */
const MINOR_SCALES: Record<string, number> = {
  EGP: 2, // piastres
  USD: 2, // cents
  EUR: 2, // cents
  GBP: 2, // pence
  SAR: 2, // halalah
  JPY: 0, // no minor unit
  KWD: 3, // fils
};

function getScale(currency: string): number {
  return MINOR_SCALES[currency] ?? 2;
}

/**
 * Convert integer minor units to decimal.
 * e.g., 15000 piastres → 150.00 EGP
 */
export function minorToDecimal(minor: number, currency: string): number {
  const scale = getScale(currency);
  return minor / Math.pow(10, scale);
}

/**
 * Convert a decimal amount to integer minor units.
 * e.g., 150.75 EGP → 15075 piastres
 * Rounds to nearest minor unit to avoid floating-point drift.
 */
export function decimalToMinor(decimal: number, currency: string): number {
  const scale = getScale(currency);
  return Math.round(decimal * Math.pow(10, scale));
}

/**
 * Format minor units for display using Intl.NumberFormat.
 * Uses tabular numerals where available.
 */
export function formatMinor(
  minor: number,
  currency: string,
  locale: string,
  options?: Partial<Intl.NumberFormatOptions>
): string {
  const scale = getScale(currency);
  const value = minor / Math.pow(10, scale);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: scale,
      maximumFractionDigits: scale,
      numberingSystem: "latn", // always use Latin digits for amounts
      ...options,
    }).format(value);
  } catch {
    // Fallback if currency code is unknown to Intl
    return `${value.toFixed(scale)} ${currency}`;
  }
}

/**
 * Format a decimal number (not currency) for display.
 * Used for things like "37.5 days".
 */
export function formatNumber(value: number, locale: string, decimals = 1): string {
  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: decimals,
      numberingSystem: "latn",
    }).format(value);
  } catch {
    return value.toFixed(decimals);
  }
}

/**
 * Returns the currency symbol for a given currency code.
 */
export function getCurrencySymbol(currency: string, locale: string): string {
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
    // Extract just the symbol by removing digits and whitespace
    return formatted.replace(/[\d,.\s]/g, "").trim() || currency;
  } catch {
    return currency;
  }
}

/** Supported currencies for the currency selector */
export const SUPPORTED_CURRENCIES = [
  { code: "EGP", label: "جنيه مصري (EGP)" },
  { code: "USD", label: "دولار أمريكي (USD)" },
  { code: "EUR", label: "يورو (EUR)" },
  { code: "GBP", label: "جنيه إسترليني (GBP)" },
  { code: "SAR", label: "ريال سعودي (SAR)" },
];
