import { useState } from 'react';
import { Link, useLocation, useNavigate, type Location } from 'react-router-dom';
import { getDefaultRoute } from '../../app/getDefaultRoute';
import { routePaths } from '../../app/routePaths';
import { ApiError } from '../../lib/apiClient';
import { useAuth } from './AuthContext';
import { LoginForm } from './LoginForm';

interface LoginLocationState {
  from?: Location;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(email: string, password: string) {
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login({ email, password });
      const state = location.state as LoginLocationState | null;
      navigate(state?.from ?? getDefaultRoute(user.role), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center py-8">
      <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-8 shadow-md">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">Log in</h2>
        <p className="mt-1 mb-6 text-sm text-[var(--text-secondary)]">Welcome back — enter your details to continue.</p>
        <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
      </div>
      <p className="mt-6 text-sm text-[var(--text-secondary)]">
        Don&apos;t have an account?{' '}
        <Link to={routePaths.register} className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Create one
        </Link>
      </p>
    </section>
  );
}
