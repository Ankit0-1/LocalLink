import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { routePaths } from '../../../app/routePaths';
import { Badge, Card, CardBody, EmptyState, SkeletonList, StatusBadge, buttonClasses, useToast } from '../../../components/ui';
import { getSocket } from '../../../lib/socket';
import { ApiError } from '../../../lib/apiClient';
import { useAuth } from '../../auth/AuthContext';
import { listOrders, listStores } from '../api';
import type { Order, Store } from '../types';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function loadOrders() {
    return listOrders().then(({ orders: nextOrders }) => setOrders(nextOrders));
  }

  useEffect(() => {
    Promise.all([listStores().then(({ stores: nextStores }) => setStores(nextStores)), loadOrders()])
      .catch((err) => toast({ title: 'Could not load dashboard', description: messageFor(err, 'Please try again.'), variant: 'error' }))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function handleOrderUpdated() {
      loadOrders().catch(() => {});
    }
    socket.on('order:updated', handleOrderUpdated);
    return () => {
      socket.off('order:updated', handleOrderUpdated);
    };
  }, []);

  if (isLoading) return <SkeletonList rows={5} />;

  const pendingCount = orders.filter((order) => order.status === 'PENDING').length;
  const activeStores = stores.filter((store) => store.isActive).length;
  const revenue = orders.filter((order) => order.status === 'DELIVERED').reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <section>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Welcome back, {user?.name?.split(' ')[0]}</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">Here's what's happening with your business today.</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">Active stores</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{activeStores}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">Orders awaiting response</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{pendingCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">Revenue delivered</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">₹{revenue.toFixed(2)}</p>
          </CardBody>
        </Card>
      </div>

      {stores.length === 0 && (
        <EmptyState
          title="Create your first store"
          description="Set up a store to start listing products and receiving orders."
          action={
            <Link to={routePaths.vendor.stores} className={buttonClasses('primary', 'sm')}>
              + Add store
            </Link>
          }
          className="mb-6"
        />
      )}

      <Card>
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Recent orders</h2>
          <Link to={routePaths.vendor.orders} className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            View all
          </Link>
        </div>
        <CardBody className="flex flex-col gap-2">
          {orders.length === 0 ? (
            <EmptyState title="No orders yet" description="Incoming orders will appear here." />
          ) : (
            orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] px-4 py-3">
                <div>
                  <strong className="text-sm font-medium text-[var(--text-primary)]">{order.store.name}</strong>
                  <span className="text-sm text-[var(--text-secondary)]"> — {order.customer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  <Badge tone="neutral">₹{Number(order.total).toFixed(2)}</Badge>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </section>
  );
}
