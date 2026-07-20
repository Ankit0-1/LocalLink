import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routePaths } from '../../app/routePaths';
import { ApiError } from '../../lib/apiClient';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../auth/AuthContext';
import { acceptJob, listJobs, listMyOrders, markDelivered, markPickedUp } from './api';
import type { Job, Order } from './types';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadJobs() {
    const { jobs: nextJobs } = await listJobs();
    setJobs(nextJobs);
  }

  async function loadOrders() {
    const { orders: nextOrders } = await listMyOrders();
    setOrders(nextOrders);
  }

  useEffect(() => {
    Promise.all([loadJobs(), loadOrders()])
      .catch((err) => setError(messageFor(err, 'Could not load the delivery dashboard.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleOrderUpdated() {
      loadOrders().catch((err) => setError(messageFor(err, 'Could not refresh your deliveries.')));
    }
    function handleJobsChanged() {
      loadJobs().catch((err) => setError(messageFor(err, 'Could not refresh available jobs.')));
    }

    socket.on('order:updated', handleOrderUpdated);
    socket.on('delivery:job-offered', handleJobsChanged);
    socket.on('delivery:job-claimed', handleJobsChanged);
    return () => {
      socket.off('order:updated', handleOrderUpdated);
      socket.off('delivery:job-offered', handleJobsChanged);
      socket.off('delivery:job-claimed', handleJobsChanged);
    };
  }, []);

  async function handleAccept(job: Job) {
    setError(null);
    setSuccess(null);
    try {
      await acceptJob(job.id);
      await Promise.all([loadJobs(), loadOrders()]);
      setSuccess(`Accepted the delivery for order ${job.order.id.slice(0, 8)}.`);
    } catch (err) {
      setError(messageFor(err, 'Could not accept this job — it may already be taken.'));
      await loadJobs();
    }
  }

  async function handleOrderAction(orderId: string, action: (orderId: string) => Promise<{ order: Order }>) {
    setError(null);
    setSuccess(null);
    try {
      await action(orderId);
      await loadOrders();
    } catch (err) {
      setError(messageFor(err, 'Could not update the delivery.'));
    }
  }

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <div><h2>Delivery dashboard</h2><p>Welcome, {user?.name}</p></div>
        <button onClick={() => { logout(); navigate(routePaths.login, { replace: true }); }}>Log out</button>
      </header>
      {error && <p role="alert" className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      {isLoading ? <p>Loading deliveries…</p> : <div className="dashboard-grid">
        <div>
          <h3>Available jobs</h3>
          {jobs.length === 0 ? <p>No jobs waiting for pickup right now.</p> : <ul className="item-list">{jobs.map((job) => <li key={job.id}>
            <div>
              <strong>{job.order.store.name}</strong>
              <div>{job.order.store.address ?? 'No address listed'}</div>
              <div>₹{Number(job.order.total).toFixed(2)}</div>
            </div>
            <button onClick={() => void handleAccept(job)}>Accept</button>
          </li>)}</ul>}
        </div>
        <div>
          <h3>My deliveries</h3>
          {orders.length === 0 ? <p>No deliveries assigned yet.</p> : <ul className="item-list">{orders.map((order) => <li key={order.id}>
            <div>
              <strong>{order.store.name}</strong> — {order.customer.name}
              <div>{order.status} · ₹{Number(order.total).toFixed(2)}</div>
            </div>
            <div>
              {order.status === 'DELIVERY_ACCEPTED' && <button onClick={() => void handleOrderAction(order.id, markPickedUp)}>Mark picked up</button>}
              {order.status === 'PICKED_UP' && <button onClick={() => void handleOrderAction(order.id, markDelivered)}>Mark delivered</button>}
            </div>
          </li>)}</ul>}
        </div>
      </div>}
    </section>
  );
}
