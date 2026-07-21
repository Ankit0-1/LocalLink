import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cx } from '../../lib/cx';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import type { NavItem } from './navTypes';

interface StorefrontShellProps {
  navItems: NavItem[];
  children: ReactNode;
  badges?: Record<string, number>;
}

export function StorefrontShell({ navItems, children, badges }: StorefrontShellProps) {
  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] pb-16 sm:pb-0">
      <header className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--surface-raised)]/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              L
            </span>
            LocalLink
          </span>
          <nav className="hidden flex-1 items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cx(
                    'relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                      : 'text-[var(--text-secondary)] hover:bg-slate-100 hover:text-[var(--text-primary)] dark:hover:bg-slate-800',
                  )
                }
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
                {!!badges?.[item.to] && (
                  <span className="ml-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                    {badges[item.to]}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-[var(--border-subtle)] bg-[var(--surface-raised)]/95 py-1.5 backdrop-blur sm:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cx(
                'relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium',
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-[var(--text-secondary)]',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
            {!!badges?.[item.to] && (
              <span className="absolute right-1 top-0.5 h-2 w-2 rounded-full bg-brand-600" />
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
