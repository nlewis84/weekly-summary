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
      className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
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
