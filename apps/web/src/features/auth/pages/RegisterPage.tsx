import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDefaultRoute } from '../../../app/getDefaultRoute';
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
    <section>
      <h2>Create account</h2>
      <RegisterForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
    </section>
  );
}
