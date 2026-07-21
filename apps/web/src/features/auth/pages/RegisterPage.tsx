import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDefaultRoute } from '../../../app/getDefaultRoute';
import { routePaths } from '../../../app/routePaths';
import { ApiError } from '../../../lib/apiClient';
import { useAuth } from '../AuthContext';
import { RegisterForm, type RegisterFormValues } from '../components/RegisterForm';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: RegisterFormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await register(values);
      navigate(getDefaultRoute(user.role), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center py-8">
      <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-8 shadow-md">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">Create account</h2>
        <p className="mt-1 mb-6 text-sm text-[var(--text-secondary)]">
          Join LocalLink as a customer, vendor, or delivery partner.
        </p>
        <RegisterForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
      </div>
      <p className="mt-6 text-sm text-[var(--text-secondary)]">
        Already have an account?{' '}
        <Link to={routePaths.login} className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Log in
        </Link>
      </p>
    </section>
  );
}
