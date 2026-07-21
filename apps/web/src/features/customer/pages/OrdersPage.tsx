import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, SkeletonList, StatusBadge, useToast } from '../../../components/ui';
import { OrdersIcon } from '../../../components/ui/icons';
import { ApiError } from '../../../lib/apiClient';
import { getSocket } from '../../../lib/socket';
import { getOrder, listOrders } from '../api';
import type { Order, OrderTracking } from '../types';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<OrderTracking | null>(null);

  function loadOrders() {
    return listOrders().then(({ orders: nextOrders }) => setOrders(nextOrders));
  }

  useEffect(() => {
    loadOrders()
      .catch((err) => toast({ title: 'Could not load your orders', description: messageFor(err, 'Please try again.'), variant: 'error' }))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!trackingOrderId) {
      setTrackingOrder(null);
      return;
    }
    getOrder(trackingOrderId)
      .then(({ order }) => setTrackingOrder(order))
      .catch((err) => toast({ title: 'Could not load order tracking', description: messageFor(err, 'Please try again.'), variant: 'error' }));
  }, [trackingOrderId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleOrderUpdated() {
      loadOrders().catch((err) => toast({ title: 'Could not refresh your orders', description: messageFor(err, 'Please try again.'), variant: 'error' }));
      if (trackingOrderId) {
        getOrder(trackingOrderId)
          .then(({ order }) => setTrackingOrder(order))
          .catch(() => {});
      }
    }

    socket.on('order:updated', handleOrderUpdated);
    return () => {
      socket.off('order:updated', handleOrderUpdated);
    };
  }, [trackingOrderId]);

  return (
    <section>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Your orders</h1>

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : orders.length === 0 ? (
        <EmptyState icon={<OrdersIcon className="h-8 w-8" />} title="No orders yet" description="Your placed orders will show up here." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong className="text-sm font-medium text-[var(--text-primary)]">{order.store.name}</strong>
                  <div className="mt-1">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="neutral">₹{Number(order.total).toFixed(2)}</Badge>
                  <Button size="sm" variant="secondary" onClick={() => setTrackingOrderId((current) => (current === order.id ? null : order.id))}>
                    {trackingOrderId === order.id ? 'Hide tracking' : 'Track'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {trackingOrder && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Tracking order {trackingOrder.id.slice(0, 8)}</CardTitle>
              </CardHeader>
              <CardBody className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
                <p>
                  <strong className="text-[var(--text-primary)]">Status:</strong> <StatusBadge status={trackingOrder.status} />
                </p>
                <p>
                  {trackingOrder.store.name} — {trackingOrder.store.address ?? 'No address listed'}
                </p>
                <p>
                  {trackingOrder.deliveryPartner
                    ? `Delivery partner: ${trackingOrder.deliveryPartner.name}${trackingOrder.deliveryPartner.phone ? ` (${trackingOrder.deliveryPartner.phone})` : ''}`
                    : 'No delivery partner assigned yet.'}
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
