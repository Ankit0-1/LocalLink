import { useEffect, useState } from 'react';
import { Chip, EmptyState, SkeletonList, StatusBadge, Button, useToast } from '../../../components/ui';
import { ApiError } from '../../../lib/apiClient';
import { getSocket } from '../../../lib/socket';
import { acceptOrder, listOrders, markOrderPreparing, markOrderReadyForPickup, rejectOrder } from '../api';
import type { Order } from '../types';

const statusFilters = ['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERED', 'REJECTED'] as const;

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>('ALL');

  function loadOrders() {
    return listOrders().then(({ orders: nextOrders }) => setOrders(nextOrders));
  }

  useEffect(() => {
    loadOrders()
      .catch((err) => toast({ title: 'Could not load your orders', description: messageFor(err, 'Please try again.'), variant: 'error' }))
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

  async function handleOrderAction(orderId: string, action: (orderId: string) => Promise<{ order: Order }>) {
    try {
      await action(orderId);
      await loadOrders();
    } catch (err) {
      toast({ title: 'Could not update the order', description: messageFor(err, 'Please try again.'), variant: 'error' });
    }
  }

  const filteredOrders = statusFilter === 'ALL' ? orders : orders.filter((order) => order.status === statusFilter);

  return (
    <section>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Orders</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">Manage incoming orders across all your stores.</p>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map((status) => (
          <Chip key={status} selected={statusFilter === status} onClick={() => setStatusFilter(status)}>
            {status === 'ALL' ? 'All' : status.replaceAll('_', ' ')}
          </Chip>
        ))}
      </div>

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState title="No orders here" description="Try a different filter, or check back later." />
      ) : (
        <div className="flex flex-col gap-2">
          {filteredOrders.map((order) => (
            <div key={order.id} className="flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <strong className="text-sm font-medium text-[var(--text-primary)]">{order.store.name}</strong>
                <span className="text-sm text-[var(--text-secondary)]"> — {order.customer.name}</span>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  <span className="text-sm text-[var(--text-secondary)]">₹{Number(order.total).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {order.status === 'PENDING' && (
                  <>
                    <Button size="sm" onClick={() => void handleOrderAction(order.id, acceptOrder)}>Accept</Button>
                    <Button size="sm" variant="danger" onClick={() => void handleOrderAction(order.id, rejectOrder)}>Reject</Button>
                  </>
                )}
                {order.status === 'ACCEPTED' && (
                  <Button size="sm" onClick={() => void handleOrderAction(order.id, markOrderPreparing)}>Start preparing</Button>
                )}
                {order.status === 'PREPARING' && (
                  <Button size="sm" onClick={() => void handleOrderAction(order.id, markOrderReadyForPickup)}>Ready for pickup</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
