import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

interface AlertProps {
  variant: 'error' | 'success';
  children: ReactNode;
  className?: string;
}

const variants = {
  error:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
};

export function Alert({ variant, children, className }: AlertProps) {
  return (
    <p
      role={variant === 'error' ? 'alert' : 'status'}
      className={cx(
        'animate-fade-in flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </p>
  );
}
