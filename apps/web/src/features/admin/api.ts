import { apiClient } from '../../lib/apiClient';
import type { AdminOrder, AdminStore, AdminUser } from './types';

export function listUsers(): Promise<{ users: AdminUser[] }> {
  return apiClient.get('/api/admin/users');
}

export function listStores(): Promise<{ stores: AdminStore[] }> {
  return apiClient.get('/api/admin/stores');
}

export function listOrders(): Promise<{ orders: AdminOrder[] }> {
  return apiClient.get('/api/admin/orders');
}
