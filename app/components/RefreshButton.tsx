import { useEffect, useRef, useState } from "react";
import { ArrowsClockwise } from "phosphor-react";

const MIN_LOADING_MS = 400;

interface RefreshButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function RefreshButton({ onClick, isLoading }: RefreshButtonProps) {
  const [showLoading, setShowLoading] = useState(false);
  const loadingStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
      loadingStartRef.current = Date.now();
    } else if (loadingStartRef.current !== null) {
      const elapsed = Date.now() - loadingStartRef.current;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      const t = setTimeout(() => {
        setShowLoading(false);
        loadingStartRef.current = null;
      }, remaining);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  const displaying = showLoading || isLoading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      aria-busy={displaying}
      title="Refresh data (r)"
      className={`flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-3 py-2 text-sm text-primary-500 rounded-lg transition-colors ${
        displaying
          ? "cursor-wait opacity-75"
          : "cursor-pointer hover:text-primary-400 hover:bg-surface-elevated"
      }`}
    >
      <span
        className={
          displaying
            ? "inline-block origin-center animate-spin"
            : "inline-block"
        }
      >
        <ArrowsClockwise size={20} weight="regular" />
      </span>
      {displaying ? "Refreshing…" : "Refresh"}
    </button>
  );
}
