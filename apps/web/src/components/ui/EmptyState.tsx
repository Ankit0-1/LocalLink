import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-default)]',
        'px-6 py-10 text-center',
        className,
      )}
    >
      {icon && <div className="mb-1 text-[var(--text-tertiary)]">{icon}</div>}
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      {description && <p className="max-w-xs text-sm text-[var(--text-secondary)]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
