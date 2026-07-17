import { useState, type FormEvent } from 'react';
import type { Role } from '../types';

const registrationRoles: { value: Role; label: string }[] = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'DELIVERY_PARTNER', label: 'Delivery partner' },
];

export interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
}

interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => void;
  isSubmitting: boolean;
  error: string | null;
}

export function RegisterForm({ onSubmit, isSubmitting, error }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('CUSTOMER');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ name, email, password, phone, role });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
        />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div>
        <label htmlFor="phone">Phone (optional)</label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
        />
      </div>
      <div>
        <label htmlFor="role">I am a</label>
        <select id="role" value={role} onChange={(event) => setRole(event.target.value as Role)}>
          {registrationRoles.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
