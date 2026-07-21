import { useState } from 'react';
import { Badge, Chip, EmptyState, SkeletonList, Table, Tbody, Td, Th, Thead, Tr } from '../../../components/ui';
import { useAdminData } from '../AdminDataContext';

const roles = ['ALL', 'CUSTOMER', 'VENDOR', 'DELIVERY_PARTNER', 'ADMIN'] as const;

export function UsersPage() {
  const { users, isLoading } = useAdminData();
  const [roleFilter, setRoleFilter] = useState<(typeof roles)[number]>('ALL');

  const filtered = roleFilter === 'ALL' ? users : users.filter((user) => user.role === roleFilter);

  return (
    <section>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Users ({users.length})</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">Everyone registered on LocalLink.</p>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {roles.map((role) => (
          <Chip key={role} selected={roleFilter === role} onClick={() => setRoleFilter(role)}>
            {role === 'ALL' ? 'All' : role.replaceAll('_', ' ')}
          </Chip>
        ))}
      </div>

      {isLoading ? (
        <SkeletonList rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((user) => (
              <Tr key={user.id}>
                <Td className="font-medium">{user.name}</Td>
                <Td className="text-[var(--text-secondary)]">{user.email}</Td>
                <Td>
                  <Badge tone="brand">{user.role.replaceAll('_', ' ')}</Badge>
                </Td>
                <Td>
                  <Badge tone={user.isActive ? 'success' : 'neutral'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </section>
  );
}
