import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../lib/cx';
import { AlertCircleIcon, CheckCircleIcon, CloseIcon } from './icons';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastRecord extends ToastInput {
  id: number;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DURATION_MS = 4000;

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300',
  error: 'border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300',
  info: 'border-[var(--border-subtle)] text-[var(--text-primary)]',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { ...input, id }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
          {toasts.map((item) => (
            <div
              key={item.id}
              role="status"
              className={cx(
                'animate-fade-in flex items-start gap-3 rounded-xl border bg-[var(--surface-overlay)] p-4 shadow-lg',
                variantStyles[item.variant ?? 'info'],
              )}
            >
              {item.variant === 'success' && <CheckCircleIcon className="mt-0.5 h-4.5 w-4.5 shrink-0" />}
              {item.variant === 'error' && <AlertCircleIcon className="mt-0.5 h-4.5 w-4.5 shrink-0" />}
              <div className="flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.description && <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{item.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
