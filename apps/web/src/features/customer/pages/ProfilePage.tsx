import { Badge, Card, CardBody, CardHeader, CardTitle } from '../../../components/ui';
import { useAuth } from '../../auth/AuthContext';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
}

export function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Profile</h1>
      <Card>
        <CardHeader className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white">
            {initials(user.name)}
          </span>
          <div>
            <CardTitle>{user.name}</CardTitle>
            <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[var(--text-tertiary)]">Phone</p>
              <p className="mt-0.5 font-medium text-[var(--text-primary)]">{user.phone ?? 'Not provided'}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Account status</p>
              <div className="mt-1">
                <Badge tone={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Verification</p>
              <div className="mt-1">
                <Badge tone={user.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}>{user.verificationStatus}</Badge>
              </div>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Member since</p>
              <p className="mt-0.5 font-medium text-[var(--text-primary)]">
                {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
