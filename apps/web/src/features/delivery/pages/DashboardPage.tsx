import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { routePaths } from '../../../app/routePaths';
import { Card, CardBody, SkeletonList, useToast } from '../../../components/ui';
import { ApiError } from '../../../lib/apiClient';
import { getSocket } from '../../../lib/socket';
import { useAuth } from '../../auth/AuthContext';
import { listJobs, listMyOrders } from '../api';
import type { Job, Order } from '../types';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function isToday(dateIso: string): boolean {
  const date = new Date(dateIso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function loadAll() {
    return Promise.all([
      listJobs().then(({ jobs: nextJobs }) => setJobs(nextJobs)),
      listMyOrders().then(({ orders: nextOrders }) => setOrders(nextOrders)),
    ]);
  }

  useEffect(() => {
    loadAll()
      .catch((err) => toast({ title: 'Could not load dashboard', description: messageFor(err, 'Please try again.'), variant: 'error' }))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function handleChanged() {
      loadAll().catch(() => {});
    }
    socket.on('order:updated', handleChanged);
    socket.on('delivery:job-offered', handleChanged);
    socket.on('delivery:job-claimed', handleChanged);
    return () => {
      socket.off('order:updated', handleChanged);
      socket.off('delivery:job-offered', handleChanged);
      socket.off('delivery:job-claimed', handleChanged);
    };
  }, []);

  if (isLoading) return <SkeletonList rows={4} />;

  const activeOrders = orders.filter((order) => order.status === 'DELIVERY_ACCEPTED' || order.status === 'PICKED_UP');
  const deliveredToday = orders.filter((order) => order.status === 'DELIVERED' && isToday(order.updatedAt));
  const earningsToday = deliveredToday.reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <section>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Welcome back, {user?.name?.split(' ')[0]}</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">Here's your delivery activity for today.</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">Delivered today</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{deliveredToday.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">Order value delivered today</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">₹{earningsToday.toFixed(2)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">Available jobs</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{jobs.length}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to={routePaths.delivery.available} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Browse available deliveries</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{jobs.length} job{jobs.length === 1 ? '' : 's'} waiting for pickup nearby.</p>
        </Link>
        <Link to={routePaths.delivery.active} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Continue active delivery</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {activeOrders.length === 0 ? 'No delivery in progress right now.' : `${activeOrders.length} delivery in progress.`}
          </p>
        </Link>
      </div>
    </section>
  );
}
