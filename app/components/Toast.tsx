import { createContext, useCallback, useContext, useRef, useState } from "react";

interface ToastItem {
  id: number;
  message: string;
}

const ToastContext = createContext<((message: string) => void) | null>(null);

const TOAST_DURATION_MS = 2500;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return () => {};
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const toast = useCallback((message: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message }]);

    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
      timeoutsRef.current.delete(id);
    }, TOAST_DURATION_MS);
    timeoutsRef.current.set(id, t);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map(({ id, message }) => (
          <div
            key={id}
            className="px-4 py-3 bg-surface-elevated border border-(--color-border) rounded-xl shadow-lg text-(--color-text) text-sm font-medium"
          >
            {message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
