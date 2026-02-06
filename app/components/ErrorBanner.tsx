interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="p-4 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-xl text-sm text-[var(--color-error-500)] flex items-center justify-between gap-4 flex-wrap">
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center px-4 py-2.5 bg-[var(--color-error-bg)] hover:opacity-90 rounded-lg font-medium border border-[var(--color-error-border)] transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
