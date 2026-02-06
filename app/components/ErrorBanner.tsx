interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="p-4 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-xl text-sm text-red-400">
      {message}
    </div>
  );
}
