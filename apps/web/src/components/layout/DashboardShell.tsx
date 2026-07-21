import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cx } from '../../lib/cx';
import { Drawer } from '../ui/Drawer';
import { MenuIcon } from '../ui/icons';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import type { NavItem } from './navTypes';

interface DashboardShellProps {
  roleLabel: string;
  navItems: NavItem[];
  children: ReactNode;
}

function NavLinks({ navItems, onNavigate }: { navItems: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                : 'text-[var(--text-secondary)] hover:bg-slate-100 hover:text-[var(--text-primary)] dark:hover:bg-slate-800',
            )
          }
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function DashboardShell({ roleLabel, navItems, children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-raised)] lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-[var(--border-subtle)] px-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            L
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">LocalLink</span>
        </div>
        <p className="px-5 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          {roleLabel}
        </p>
        <div className="flex flex-1 flex-col gap-1 py-2">
          <NavLinks navItems={navItems} />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-[var(--border-subtle)] bg-[var(--surface-raised)]/80 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-[var(--text-primary)] lg:hidden">LocalLink</span>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>

      <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="Menu" side="left" className="max-w-72">
        <NavLinks navItems={navItems} onNavigate={() => setMobileNavOpen(false)} />
      </Drawer>
    </div>
  );
}
