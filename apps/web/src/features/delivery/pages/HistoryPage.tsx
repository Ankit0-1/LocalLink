import { useEffect, useState } from 'react';
import { EmptyState, SkeletonList, StatusBadge, useToast } from '../../../components/ui';
import { HistoryIcon } from '../../../components/ui/icons';
import { ApiError } from '../../../lib/apiClient';
import { listMyOrders } from '../api';
import type { Order } from '../types';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function HistoryPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listMyOrders()
      .then(({ orders: nextOrders }) => setOrders(nextOrders))
      .catch((err) => toast({ title: 'Could not load delivery history', description: messageFor(err, 'Please try again.'), variant: 'error' }))
      .finally(() => setIsLoading(false));
  }, []);

  const completed = orders.filter((order) => order.status === 'DELIVERED');

  return (
    <section>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Delivery history</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">Deliveries you've completed.</p>

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : completed.length === 0 ? (
        <EmptyState icon={<HistoryIcon className="h-8 w-8" />} title="No completed deliveries yet" description="Deliveries you complete will show up here." />
      ) : (
        <div className="flex flex-col gap-2">
          {completed.map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4 shadow-sm">
              <div>
                <strong className="text-sm font-medium text-[var(--text-primary)]">{order.store.name}</strong>
                <span className="text-sm text-[var(--text-secondary)]"> — {order.customer.name}</span>
                <div className="mt-1 text-xs text-[var(--text-tertiary)]">{new Date(order.updatedAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={order.status} />
                <span className="text-sm font-medium text-[var(--text-primary)]">₹{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
