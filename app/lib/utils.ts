import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Locale-aware number formatting with thousands separators (e.g. 15432 → "15,432").
 * Returns "—" for null/undefined/non-finite values.
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US");
}

/** Signed delta with comma separators (e.g. 1200 → "+1,200", -50 → "-50"). */
export function formatSignedNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value === 0) return "+0";
  const formatted = Math.abs(value).toLocaleString("en-US");
  return value > 0 ? `+${formatted}` : `-${formatted}`;
}

/**
 * Duration stored in hours, shown as minutes under 1h and hours above.
 * 0.1 → "6m", 2.84 → "2.8h", 10.73 → "11h".
 */
export function formatDurationHours(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs < 1) {
    const minutes = value === 0 ? 0 : Math.max(1, Math.round(abs * 60));
    return `${minutes}m`;
  }
  const rounded = abs >= 10 ? Math.round(abs) : Math.round(abs * 10) / 10;
  return `${formatNumber(rounded)}h`;
}

/** Signed duration delta (e.g. +6m, -1.2h). */
export function formatSignedDurationHours(
  value: number | null | undefined
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value === 0) return "+0m";
  const abs = Math.abs(value);
  const sign = value > 0 ? "+" : "-";
  if (abs < 1) {
    const minutes = Math.max(1, Math.round(abs * 60));
    return `${sign}${minutes}m`;
  }
  const rounded = abs >= 10 ? Math.round(abs) : Math.round(abs * 10) / 10;
  return `${sign}${formatNumber(rounded)}h`;
}
