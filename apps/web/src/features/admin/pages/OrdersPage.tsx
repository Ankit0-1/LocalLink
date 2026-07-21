import { useState } from 'react';
import { Chip, EmptyState, SkeletonList, StatusBadge, Table, Tbody, Td, Th, Thead, Tr } from '../../../components/ui';
import { useAdminData } from '../AdminDataContext';

const statuses = ['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERY_ACCEPTED', 'PICKED_UP', 'DELIVERED', 'REJECTED'] as const;

export function OrdersPage() {
  const { orders, isLoading } = useAdminData();
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>('ALL');

  const filtered = statusFilter === 'ALL' ? orders : orders.filter((order) => order.status === statusFilter);

  return (
    <section>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Orders ({orders.length})</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">Every order placed on the platform.</p>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {statuses.map((status) => (
          <Chip key={status} selected={statusFilter === status} onClick={() => setStatusFilter(status)}>
            {status === 'ALL' ? 'All' : status.replaceAll('_', ' ')}
          </Chip>
        ))}
      </div>

      {isLoading ? (
        <SkeletonList rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No orders found" description="Try a different filter." />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Store</Th>
              <Th>Customer</Th>
              <Th>Delivery partner</Th>
              <Th>Total</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((order) => (
              <Tr key={order.id}>
                <Td className="font-medium">{order.store.name}</Td>
                <Td className="text-[var(--text-secondary)]">{order.customer.name}</Td>
                <Td className="text-[var(--text-secondary)]">{order.deliveryPartner?.name ?? '—'}</Td>
                <Td>₹{Number(order.total).toFixed(2)}</Td>
                <Td>
                  <StatusBadge status={order.status} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </section>
  );
}
