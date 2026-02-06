import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Sun, Moon, Monitor } from "phosphor-react";
import { QuotaIndicator } from "../components/QuotaIndicator";

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

export default function Settings() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored && ["light", "dark", "system"].includes(stored) ? stored : "system";
    setTheme(initial);
    setMounted(true);
  }, []);

  const handleThemeChange = (next: Theme) => {
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(getEffectiveTheme(next));
    window.dispatchEvent(new CustomEvent("weekly-summary-theme-changed", { detail: next }));
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Settings</h2>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 animate-pulse">
          <div className="h-4 w-32 bg-[var(--color-surface-elevated)] rounded mb-4" />
          <div className="h-10 w-48 bg-[var(--color-surface-elevated)] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">Settings</h2>

      <div className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-skeuo-card)] border border-[var(--color-border)] p-6 space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text)]">Appearance</h3>
        <fieldset className="space-y-2">
          <legend className="sr-only">Theme</legend>
          {[
            { value: "dark" as const, label: "Dark", Icon: Moon },
            { value: "light" as const, label: "Light", Icon: Sun },
            { value: "system" as const, label: "System", Icon: Monitor },
          ].map(({ value, label, Icon }) => (
            <label
              key={value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                theme === value
                  ? "bg-[var(--color-surface-elevated)] border-primary-500/50"
                  : "border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]"
              }`}
            >
              <input
                type="radio"
                name="theme"
                value={value}
                checked={theme === value}
                onChange={() => handleThemeChange(value)}
                className="sr-only"
              />
              <Icon size={20} weight="regular" className="text-primary-500 shrink-0" />
              <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-skeuo-card)] border border-[var(--color-border)] p-6">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-2">Server settings</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          GitHub repo, Linear API key, and summary paths are configured via environment variables
          (e.g. <code className="px-1 py-0.5 bg-[var(--color-surface-elevated)] rounded text-xs">.env</code>). They cannot be changed from this app.
        </p>
        <QuotaIndicator />
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-primary-500 transition-colors"
      >
        ← Back to home
      </Link>
    </div>
  );
}
