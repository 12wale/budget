// ─────────────────────────────────────────────
// Date utilities — calendar-day based (no ms division)
// All inputs/outputs use YYYY-MM-DD strings or Date objects
// Convention: countCalendarDays(start, end) is INCLUSIVE of end date
// ─────────────────────────────────────────────

/**
 * Parse a YYYY-MM-DD string to a local Date object (noon, avoiding DST issues).
 */
export function parseISODate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Format a Date to YYYY-MM-DD using local time.
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns today as YYYY-MM-DD in the user's local timezone.
 */
export function todayISO(): string {
  return toISODate(new Date());
}

/**
 * Count calendar days between two ISO date strings.
 * INCLUSIVE of the end date. Returns 0 if end < start.
 * Example: 2024-01-01 → 2024-01-03 = 3 days
 */
export function countCalendarDays(start: string, end: string): number {
  const s = parseISODate(start);
  const e = parseISODate(end);
  const diffMs = e.getTime() - s.getTime();
  if (diffMs < 0) return 0;
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Remaining calendar days from today (inclusive) through targetDate.
 * Returns 0 if targetDate is in the past.
 */
export function remainingCalendarDays(targetDate: string): number {
  return countCalendarDays(todayISO(), targetDate);
}

/**
 * Add n calendar days to a YYYY-MM-DD string. Returns new YYYY-MM-DD.
 */
export function addDays(date: string, n: number): string {
  const d = parseISODate(date);
  d.setDate(d.getDate() + Math.floor(n));
  return toISODate(d);
}

/**
 * Returns true if the given ISO date is before today.
 */
export function isDatePast(date: string): boolean {
  return parseISODate(date) < parseISODate(todayISO());
}

/**
 * Returns true if the given ISO date is today.
 */
export function isDateToday(date: string): boolean {
  return date === todayISO();
}

/**
 * Format a YYYY-MM-DD for display using Intl.DateTimeFormat.
 */
export function formatDate(
  isoDate: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string {
  try {
    const d = parseISODate(isoDate);
    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch {
    return isoDate;
  }
}
