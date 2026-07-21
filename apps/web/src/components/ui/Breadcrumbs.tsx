import { Link } from 'react-router-dom';
import { ChevronRightIcon } from './icons';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRightIcon className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-[var(--text-primary)]">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-[var(--text-primary)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
