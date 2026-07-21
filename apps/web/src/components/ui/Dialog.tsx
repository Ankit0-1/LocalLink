import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { CloseIcon } from './icons';
import { Overlay } from './Overlay';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, footer, className }: DialogProps) {
  if (!open) return null;

  return (
    <Overlay onClose={onClose} align="center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay)] p-6 shadow-lg animate-fade-in',
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
            {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </Overlay>
  );
}
