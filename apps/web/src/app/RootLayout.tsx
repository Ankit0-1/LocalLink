import { Link, Outlet, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { buttonClasses } from '../components/ui';
import { useAuth } from '../features/auth/AuthContext';
import { getDefaultRoute } from './getDefaultRoute';
import { routePaths } from './routePaths';

export function RootLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === routePaths.login || location.pathname === routePaths.register;

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--surface-raised)]/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to={routePaths.home} className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              L
            </span>
            LocalLink
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!isAuthPage &&
              (user ? (
                <Link to={getDefaultRoute(user.role)} className={buttonClasses('primary', 'sm')}>
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link to={routePaths.login} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    Log in
                  </Link>
                  <Link to={routePaths.register} className={buttonClasses('primary', 'sm')}>
                    Get started
                  </Link>
                </>
              ))}
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
