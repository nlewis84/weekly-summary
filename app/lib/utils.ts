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
