import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Sun, Moon, Monitor, ArrowsClockwise } from "phosphor-react";
import { QuotaIndicator } from "../components/QuotaIndicator";
import {
  REFRESH_OPTIONS,
  setRefreshInterval,
  getStoredRefreshInterval,
} from "../hooks/useRefreshInterval";
import { useGoals, type WeeklyGoals } from "../hooks/useGoals";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "weekly-summary-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
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

const GOAL_KEYS: { key: keyof WeeklyGoals; label: string }[] = [
  { key: "prs_merged", label: "PRs merged" },
  { key: "pr_reviews", label: "PR reviews" },
  { key: "linear_completed", label: "Linear completed" },
];

export default function Settings() {
  const [theme, setTheme] = useState<Theme>("system");
  const [refreshInterval, setRefreshIntervalState] = useState<string>("5");
  const [mounted, setMounted] = useState(false);
  const { goals, setGoals, clearGoals } = useGoals();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial =
      stored && ["light", "dark", "system"].includes(stored)
        ? stored
        : "system";
    setTheme(initial);
    setRefreshIntervalState(getStoredRefreshInterval());
    setMounted(true);
  }, []);

  const handleThemeChange = (next: Theme) => {
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(getEffectiveTheme(next));
    window.dispatchEvent(
      new CustomEvent("weekly-summary-theme-changed", { detail: next })
    );
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-(--color-text)">Settings</h2>
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6 animate-pulse">
          <div className="h-4 w-32 bg-(--color-surface-elevated) rounded mb-4" />
          <div className="h-10 w-48 bg-(--color-surface-elevated) rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-(--color-text)">Settings</h2>

      {/* Two-column layout on xl */}
      <div className="xl:grid xl:grid-cols-2 xl:gap-6 xl:items-start space-y-6 xl:space-y-0">
        {/* Left column: Appearance + Auto-refresh */}
        <div className="space-y-6">
          <div className="bg-(--color-surface) rounded-xl shadow-(--shadow-skeuo-card) border border-(--color-border) p-6 xl:p-5 space-y-4">
            <h3 className="text-sm font-medium text-(--color-text)">
              Appearance
            </h3>
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
                      ? "bg-(--color-surface-elevated) border-primary-500/50"
                      : "border-(--color-border) hover:bg-(--color-surface-elevated)"
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
                  <Icon
                    size={20}
                    weight="regular"
                    className="text-primary-500 shrink-0"
                  />
                  <span className="text-sm font-medium text-(--color-text)">
                    {label}
                  </span>
                </label>
              ))}
            </fieldset>
          </div>

          <div className="bg-(--color-surface) rounded-xl shadow-(--shadow-skeuo-card) border border-(--color-border) p-6 xl:p-5 space-y-4">
            <h3 className="text-sm font-medium text-(--color-text)">
              Auto-refresh
            </h3>
            <p className="text-sm text-(--color-text-muted)">
              How often the home page refreshes data. Manual refresh (R key or
              button) always works.
            </p>
            <fieldset className="space-y-2">
              <legend className="sr-only">Refresh interval</legend>
              {REFRESH_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    refreshInterval === value
                      ? "bg-(--color-surface-elevated) border-primary-500/50"
                      : "border-(--color-border) hover:bg-(--color-surface-elevated)"
                  }`}
                >
                  <input
                    type="radio"
                    name="refreshInterval"
                    value={value}
                    checked={refreshInterval === value}
                    onChange={() => {
                      setRefreshInterval(value);
                      setRefreshIntervalState(value);
                    }}
                    className="sr-only"
                  />
                  <ArrowsClockwise
                    size={20}
                    weight="regular"
                    className="text-primary-500 shrink-0"
                  />
                  <span className="text-sm font-medium text-(--color-text)">
                    {label}
                  </span>
                </label>
              ))}
            </fieldset>
          </div>
        </div>

        {/* Right column: Weekly goals + Server settings */}
        <div className="space-y-6">
          <div className="bg-(--color-surface) rounded-xl shadow-(--shadow-skeuo-card) border border-(--color-border) p-6 xl:p-5 space-y-4">
            <h3 className="text-sm font-medium text-(--color-text)">
              Weekly goals
            </h3>
            <p className="text-sm text-(--color-text-muted)">
              Optional targets for key metrics. Progress shows as
              &quot;12/20&quot; in the weekly ticker. Leave blank to hide.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 xl:gap-3">
              {GOAL_KEYS.map(({ key, label }) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-xs text-(--color-text-muted)">
                    {label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={goals[key] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const n =
                        v === ""
                          ? undefined
                          : Math.max(0, parseInt(v, 10) || 0);
                      setGoals({ ...goals, [key]: n && n > 0 ? n : undefined });
                    }}
                    placeholder="—"
                    className="px-3 py-2 bg-(--color-surface-elevated) border border-(--color-border) rounded-lg text-(--color-text) focus:ring-2 focus:ring-primary-500"
                  />
                </label>
              ))}
            </div>
            {Object.values(goals).some(
              (v) => typeof v === "number" && v > 0
            ) && (
              <button
                type="button"
                onClick={clearGoals}
                className="text-sm text-(--color-text-muted) hover:text-primary-500"
              >
                Clear all goals
              </button>
            )}
          </div>

          <div className="bg-(--color-surface) rounded-xl shadow-(--shadow-skeuo-card) border border-(--color-border) p-6 xl:p-5">
            <h3 className="text-sm font-medium text-(--color-text) mb-2">
              Server settings
            </h3>
            <p className="text-sm text-(--color-text-muted)">
              GitHub repo, Linear API key, and summary paths are configured via
              environment variables (e.g.{" "}
              <code className="px-1 py-0.5 bg-(--color-surface-elevated) rounded text-xs">
                .env
              </code>
              ). They cannot be changed from this app.
            </p>
            <QuotaIndicator />
          </div>
        </div>
      </div>

      <Link
        to="/"
        prefetch="intent"
        className="inline-flex items-center gap-2 text-sm text-(--color-text-muted) hover:text-primary-500 transition-colors"
      >
        ← Back to home
      </Link>
    </div>
  );
}
