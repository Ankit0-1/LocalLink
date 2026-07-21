import { Card, CardBody, SkeletonList, StatusBadge } from '../../../components/ui';
import { useAdminData } from '../AdminDataContext';

const orderStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERY_ACCEPTED', 'PICKED_UP', 'DELIVERED', 'REJECTED'] as const;

export function DashboardPage() {
  const { users, stores, orders, isLoading } = useAdminData();

  if (isLoading) return <SkeletonList rows={5} />;

  const revenue = orders.filter((order) => order.status === 'DELIVERED').reduce((sum, order) => sum + Number(order.total), 0);
  const maxCount = Math.max(1, ...orderStatuses.map((status) => orders.filter((order) => order.status === status).length));

  return (
    <section>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Platform overview</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">A snapshot of everything happening on LocalLink.</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardBody className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">Users</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{users.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">Stores</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{stores.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">Orders</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{orders.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">Delivered revenue</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">₹{revenue.toFixed(2)}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardBody className="p-5">
            <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Orders by status</h2>
            <div className="flex flex-col gap-3">
              {orderStatuses.map((status) => {
                const count = orders.filter((order) => order.status === status).length;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-xs text-[var(--text-secondary)]">{status.replaceAll('_', ' ')}</span>
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

        <Card>
          <CardBody className="p-5">
            <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Recent orders</h2>
            <div className="flex flex-col gap-2">
              {orders.slice(0, 6).map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{order.store.name}</p>
                    <p className="truncate text-xs text-[var(--text-secondary)]">{order.customer.name}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
