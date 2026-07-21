import { cx } from '../../lib/cx';

interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cx('flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)]', className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cx(
              'relative shrink-0 px-3.5 py-2.5 text-sm font-medium transition-colors',
              active ? 'text-brand-600 dark:text-brand-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {item.label}
            {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600 dark:bg-brand-400" />}
          </button>
        );
      })}
    </div>
  );
}
