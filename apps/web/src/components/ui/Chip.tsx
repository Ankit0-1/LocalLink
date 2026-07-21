import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({ selected, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        selected
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:border-brand-300 hover:text-[var(--text-primary)] dark:hover:border-brand-700',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
