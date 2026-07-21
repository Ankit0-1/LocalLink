import { useEffect, useState } from 'react';
import { Button, EmptyState, SkeletonList, StatusBadge, useToast } from '../../../components/ui';
import { MapPinIcon, TruckIcon } from '../../../components/ui/icons';
import { ApiError } from '../../../lib/apiClient';
import { getSocket } from '../../../lib/socket';
import { listMyOrders, markDelivered, markPickedUp } from '../api';
import type { Order } from '../types';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function ActivePage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function loadOrders() {
    return listMyOrders().then(({ orders: nextOrders }) => setOrders(nextOrders));
  }

  useEffect(() => {
    loadOrders()
      .catch((err) => toast({ title: 'Could not load your deliveries', description: messageFor(err, 'Please try again.'), variant: 'error' }))
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

  async function handleAction(orderId: string, action: (orderId: string) => Promise<{ order: Order }>) {
    try {
      await action(orderId);
      await loadOrders();
    } catch (err) {
      toast({ title: 'Could not update the delivery', description: messageFor(err, 'Please try again.'), variant: 'error' });
    }
  }

  const activeOrders = orders.filter((order) => order.status === 'DELIVERY_ACCEPTED' || order.status === 'PICKED_UP');

  return (
    <section>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Active delivery</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">Track and update your current deliveries.</p>

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : activeOrders.length === 0 ? (
        <EmptyState icon={<TruckIcon className="h-8 w-8" />} title="No active delivery" description="Accept a job from Available Deliveries to get started." />
      ) : (
        <div className="flex flex-col gap-3">
          {activeOrders.map((order) => (
            <div key={order.id} className="flex flex-col gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-medium text-[var(--text-primary)]">{order.store.name}</strong>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {order.store.address ?? 'No address listed'}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Customer: {order.customer.name}
                  {order.customer.phone ? ` · ${order.customer.phone}` : ''}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">₹{Number(order.total).toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                {order.status === 'DELIVERY_ACCEPTED' && (
                  <Button onClick={() => void handleAction(order.id, markPickedUp)}>Mark picked up</Button>
                )}
                {order.status === 'PICKED_UP' && (
                  <Button onClick={() => void handleAction(order.id, markDelivered)}>Mark delivered</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
