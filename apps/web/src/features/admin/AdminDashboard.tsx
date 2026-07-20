import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routePaths } from '../../app/routePaths';
import { ApiError } from '../../lib/apiClient';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../auth/AuthContext';
import { listOrders, listStores, listUsers } from './api';
import type { AdminOrder, AdminStore, AdminUser } from './types';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOrders() {
    const { orders: nextOrders } = await listOrders();
    setOrders(nextOrders);
  }

  useEffect(() => {
    Promise.all([
      listUsers().then(({ users: nextUsers }) => setUsers(nextUsers)),
      listStores().then(({ stores: nextStores }) => setStores(nextStores)),
      loadOrders(),
    ])
      .catch((err) => setError(messageFor(err, 'Could not load the admin dashboard.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleOrdersChanged() {
      loadOrders().catch((err) => setError(messageFor(err, 'Could not refresh orders.')));
    }

    socket.on('order:updated', handleOrdersChanged);
    socket.on('delivery:job-offered', handleOrdersChanged);
    socket.on('delivery:job-claimed', handleOrdersChanged);
    return () => {
      socket.off('order:updated', handleOrdersChanged);
      socket.off('delivery:job-offered', handleOrdersChanged);
      socket.off('delivery:job-claimed', handleOrdersChanged);
    };
  }, []);

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <div><h2>Admin dashboard</h2><p>Welcome, {user?.name}</p></div>
        <button onClick={() => { logout(); navigate(routePaths.login, { replace: true }); }}>Log out</button>
      </header>
      {error && <p role="alert" className="error">{error}</p>}
      {isLoading ? <p>Loading system overview…</p> : <div className="dashboard-grid">
        <div>
          <h3>Users ({users.length})</h3>
          <ul className="item-list">
            {users.map((u) => (
              <li key={u.id}>
                <div>
                  <strong>{u.name}</strong> — {u.email}
                  <div>{u.role} {!u.isActive && <small>Inactive</small>}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Stores ({stores.length})</h3>
          <ul className="item-list">
            {stores.map((store) => (
              <li key={store.id}>
                <div>
                  <strong>{store.name}</strong> — {store.vendor.name}
                  <div>{store.address ?? 'No address listed'} {!store.isActive && <small>Inactive</small>}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Orders ({orders.length})</h3>
          <ul className="item-list">
            {orders.map((order) => (
              <li key={order.id}>
                <div>
                  <strong>{order.store.name}</strong> — {order.customer.name}
                  <div>{order.status} · ₹{Number(order.total).toFixed(2)}</div>
                  {order.deliveryPartner && <div>Delivery: {order.deliveryPartner.name}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>}
    </section>
  );
}
