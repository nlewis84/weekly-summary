import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "phosphor-react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "weekly-summary-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getEffectiveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemTheme();
  return theme;
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored && ["light", "dark", "system"].includes(stored) ? stored : "system";
    setTheme(initial);
    applyTheme(getEffectiveTheme(initial));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") applyTheme(getSystemTheme());
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme, mounted]);

  useEffect(() => {
    const onThemeChanged = (e: Event) => {
      const next = (e as CustomEvent<Theme>).detail;
      if (next && ["light", "dark", "system"].includes(next)) setTheme(next);
    };
    window.addEventListener("weekly-summary-theme-changed", onThemeChanged);
    return () => window.removeEventListener("weekly-summary-theme-changed", onThemeChanged);
  }, []);

  const cycle = () => {
    const next: Theme = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(getEffectiveTheme(next));
  };

  if (!mounted) return null;

  const label =
    theme === "dark" ? "Dark mode" : theme === "light" ? "Light mode" : "System preference";

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${label}. Click to switch.`}
      title={label}
      className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-text-muted hover:text-primary-500 hover:bg-surface-elevated rounded-lg transition-colors -m-1 sm:m-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface"
    >
      {theme === "dark" ? (
        <Moon size={20} weight="regular" />
      ) : theme === "light" ? (
        <Sun size={20} weight="regular" />
      ) : (
        <Monitor size={20} weight="regular" />
      )}
    </button>
  );
}
