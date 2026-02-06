import { ArrowsClockwise } from "phosphor-react";
import { LottieIcon } from "./LottieIcon";

interface RefreshButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function RefreshButton({ onClick, isLoading }: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      title="Refresh data (r)"
      className="flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-3 py-2 text-sm text-primary-500 hover:text-primary-400 hover:bg-[var(--color-surface-elevated)] rounded-lg disabled:opacity-50 transition-colors"
    >
      {isLoading ? (
        <LottieIcon name="refresh" size={22} />
      ) : (
        <ArrowsClockwise size={20} weight="regular" />
      )}
      {isLoading ? "Refreshing…" : "Refresh"}
    </button>
  );
}
