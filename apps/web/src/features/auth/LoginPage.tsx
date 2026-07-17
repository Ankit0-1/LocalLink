import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDefaultRoute } from '../../app/getDefaultRoute';
import { ApiError } from '../../lib/apiClient';
import { useAuth } from './AuthContext';
import { LoginForm } from './LoginForm';

interface LoginLocationState {
  from?: string;
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
    <section>
      <h2>Log in</h2>
      <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
    </section>
  );
}
