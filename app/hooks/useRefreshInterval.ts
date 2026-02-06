import { useEffect, useState } from "react";

const STORAGE_KEY = "weekly-summary-refresh-interval";

export const REFRESH_OPTIONS = [
  { value: "5", label: "5 min", ms: 5 * 60 * 1000 },
  { value: "10", label: "10 min", ms: 10 * 60 * 1000 },
  { value: "30", label: "30 min", ms: 30 * 60 * 1000 },
  { value: "off", label: "Off", ms: null },
] as const;

const MIN_MS = 5 * 60 * 1000;

function parseStored(value: string | null): (typeof REFRESH_OPTIONS)[number] {
  const valid = REFRESH_OPTIONS.find((o) => o.value === value);
  return valid ?? REFRESH_OPTIONS[0];
}

export function useRefreshInterval() {
  const [option, setOption] = useState<(typeof REFRESH_OPTIONS)[number]>(() => {
    if (typeof window === "undefined") return REFRESH_OPTIONS[0];
    return parseStored(localStorage.getItem(STORAGE_KEY));
  });

  useEffect(() => {
    const stored = parseStored(localStorage.getItem(STORAGE_KEY));
    setOption(stored);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        setOption(parseStored(e.newValue));
      }
    };
    const onCustom = () => {
      setOption(parseStored(localStorage.getItem(STORAGE_KEY)));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("weekly-summary-refresh-interval-changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("weekly-summary-refresh-interval-changed", onCustom);
    };
  }, []);

  return {
    intervalMs: option.ms,
    label: option.label,
    value: option.value,
  };
}

export function setRefreshInterval(value: string) {
  const parsed = REFRESH_OPTIONS.find((o) => o.value === value) ?? REFRESH_OPTIONS[0];
  const enforced = parsed.ms !== null && parsed.ms < MIN_MS ? REFRESH_OPTIONS[0] : parsed;
  localStorage.setItem(STORAGE_KEY, enforced.value);
  window.dispatchEvent(new CustomEvent("weekly-summary-refresh-interval-changed"));
}

export function getStoredRefreshInterval(): string {
  if (typeof window === "undefined") return REFRESH_OPTIONS[0].value;
  const v = localStorage.getItem(STORAGE_KEY);
  const parsed = parseStored(v);
  return parsed.value;
}
