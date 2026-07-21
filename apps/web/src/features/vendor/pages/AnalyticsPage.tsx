import { useEffect, useState } from 'react';
import { Card, CardBody, SkeletonList, useToast } from '../../../components/ui';
import { ApiError } from '../../../lib/apiClient';
import { listOrders, listStores } from '../api';
import type { Order, Store } from '../types';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

const orderStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERED', 'REJECTED'] as const;

export function AnalyticsPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([listOrders().then(({ orders: nextOrders }) => setOrders(nextOrders)), listStores().then(({ stores: nextStores }) => setStores(nextStores))])
      .catch((err) => toast({ title: 'Could not load analytics', description: messageFor(err, 'Please try again.'), variant: 'error' }))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <SkeletonList rows={4} />;

  const revenue = orders.filter((order) => order.status === 'DELIVERED').reduce((sum, order) => sum + Number(order.total), 0);
  const avgOrderValue = orders.length ? orders.reduce((sum, order) => sum + Number(order.total), 0) / orders.length : 0;
  const maxCount = Math.max(1, ...orderStatuses.map((status) => orders.filter((order) => order.status === status).length));

  return (
    <section>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Analytics</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">Real numbers derived from your stores and orders.</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">Total orders</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{orders.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">Delivered revenue</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">₹{revenue.toFixed(2)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">Average order value</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">₹{avgOrderValue.toFixed(2)}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="p-5">
          <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Orders by status</h2>
          <div className="flex flex-col gap-3">
            {orderStatuses.map((status) => {
              const count = orders.filter((order) => order.status === status).length;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 text-xs text-[var(--text-secondary)]">{status.replaceAll('_', ' ')}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                    <div className="h-full rounded-full bg-brand-600 dark:bg-brand-400" style={{ width: `${(count / maxCount) * 100}%` }} />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-medium text-[var(--text-primary)]">{count}</span>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <p className="mt-6 text-sm text-[var(--text-secondary)]">You currently manage {stores.length} store{stores.length === 1 ? '' : 's'}.</p>
    </section>
  );
}
