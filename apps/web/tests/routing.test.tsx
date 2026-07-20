import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext, type AuthContextValue } from '../src/features/auth/AuthContext';
import { RequireAuth } from '../src/routes/RequireAuth';
import { RequireRole } from '../src/routes/RequireRole';
import type { User } from '../src/features/auth/types';

function baseUser(role: User['role']): User {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role,
    phone: null,
    profileImage: null,
    isActive: true,
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString(),
  };
}

function noop(): never {
  throw new Error('not implemented in this test');
}

function authValue(overrides: Partial<AuthContextValue>): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    isInitializing: false,
    login: noop,
    register: noop,
    logout: noop,
    ...overrides,
  };
}

function LoginProbe() {
  const location = useLocation();
  const state = location.state as { from?: { pathname: string } } | null;
  return <div>Login page (from: {state?.from?.pathname ?? 'none'})</div>;
}

function renderRequireAuth(value: AuthContextValue, initialEntry = '/protected') {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/protected" element={<div>Protected content</div>} />
          </Route>
          <Route path="/login" element={<LoginProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('RequireAuth', () => {
  it('renders the loading fallback while the session is rehydrating', () => {
    renderRequireAuth(authValue({ isInitializing: true }));
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.queryByText(/Login page/)).not.toBeInTheDocument();
  });

  it('renders the protected outlet when authenticated', () => {
    renderRequireAuth(authValue({ isAuthenticated: true, user: baseUser('CUSTOMER') }));
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects to login, preserving the attempted destination, when unauthenticated', () => {
    renderRequireAuth(authValue({ isAuthenticated: false, user: null }), '/protected');
    expect(screen.getByText('Login page (from: /protected)')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('never redirects to login while still loading, even if ultimately unauthenticated', () => {
    // Regression guard for the redirect-flicker bug this component exists to prevent:
    // isInitializing must be checked before isAuthenticated.
    renderRequireAuth(authValue({ isInitializing: true, isAuthenticated: false }));
    expect(screen.queryByText(/Login page/)).not.toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});

function renderRequireRole(value: AuthContextValue, allowedRoles: User['role'][]) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/vendor']}>
        <Routes>
          <Route element={<RequireRole allowedRoles={allowedRoles} />}>
            <Route path="/vendor" element={<div>Vendor dashboard</div>} />
          </Route>
          <Route path="/" element={<div>Home page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('RequireRole', () => {
  it("renders the outlet when the user's role is allowed", () => {
    renderRequireRole(authValue({ isAuthenticated: true, user: baseUser('VENDOR') }), ['VENDOR']);
    expect(screen.getByText('Vendor dashboard')).toBeInTheDocument();
  });

  it("redirects home when the user's role is not allowed", () => {
    renderRequireRole(authValue({ isAuthenticated: true, user: baseUser('CUSTOMER') }), ['VENDOR']);
    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(screen.queryByText('Vendor dashboard')).not.toBeInTheDocument();
  });

  it('redirects home when there is no user at all', () => {
    renderRequireRole(authValue({ isAuthenticated: false, user: null }), ['VENDOR']);
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });
});
