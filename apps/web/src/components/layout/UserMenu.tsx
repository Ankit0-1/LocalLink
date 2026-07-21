import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routePaths } from '../../app/routePaths';
import { ChevronDownIcon } from '../ui/icons';
import { useAuth } from '../../features/auth/AuthContext';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
          {initials(user.name)}
        </span>
        <span className="hidden max-w-32 truncate font-medium text-[var(--text-primary)] sm:inline">{user.name}</span>
        <ChevronDownIcon className="hidden h-4 w-4 text-[var(--text-tertiary)] sm:inline" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-56 animate-fade-in rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-overlay)] p-1.5 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
            <p className="truncate text-xs text-[var(--text-secondary)]">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-[var(--border-subtle)]" />
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              logout();
              navigate(routePaths.login, { replace: true });
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
