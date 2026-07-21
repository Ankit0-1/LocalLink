import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useToast } from '../../components/ui';
import { ApiError } from '../../lib/apiClient';
import { getSocket } from '../../lib/socket';
import { listOrders, listStores, listUsers } from './api';
import type { AdminOrder, AdminStore, AdminUser } from './types';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

interface AdminDataContextValue {
  users: AdminUser[];
  stores: AdminStore[];
  orders: AdminOrder[];
  isLoading: boolean;
}

const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function loadOrders() {
    return listOrders().then(({ orders: nextOrders }) => setOrders(nextOrders));
  }

  useEffect(() => {
    Promise.all([
      listUsers().then(({ users: nextUsers }) => setUsers(nextUsers)),
      listStores().then(({ stores: nextStores }) => setStores(nextStores)),
      loadOrders(),
    ])
      .catch((err) => toast({ title: 'Could not load admin data', description: messageFor(err, 'Please try again.'), variant: 'error' }))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function handleChanged() {
      loadOrders().catch(() => {});
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

  return <AdminDataContext.Provider value={{ users, stores, orders, isLoading }}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataContextValue {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error('useAdminData must be used within an AdminDataProvider');
  return context;
}
