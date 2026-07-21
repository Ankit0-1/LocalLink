import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { CloseIcon } from './icons';
import { Overlay } from './Overlay';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  side?: 'left' | 'right';
}

export function Drawer({ open, onClose, title, description, children, footer, className, side = 'right' }: DrawerProps) {
  if (!open) return null;

  return (
    <Overlay onClose={onClose} align={side}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'flex h-dvh w-full max-w-md flex-col bg-[var(--surface-overlay)] shadow-lg',
          side === 'right' ? 'border-l border-[var(--border-subtle)]' : 'border-r border-[var(--border-subtle)]',
          className,
        )}
        style={{
          animation: `${side === 'right' ? 'slide-in' : 'slide-in-left'} 220ms ease-out`,
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] p-5">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
            {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] p-5">{footer}</div>}
      </div>
    </Overlay>
  );
}
