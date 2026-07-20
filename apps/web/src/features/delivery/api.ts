import { apiClient } from '../../lib/apiClient';
import type { Job, Order } from './types';

export function listJobs(): Promise<{ jobs: Job[] }> {
  return apiClient.get('/api/delivery/jobs');
}

export function acceptJob(deliveryRequestId: string): Promise<{ order: Order }> {
  return apiClient.patch(`/api/delivery/jobs/${deliveryRequestId}/accept`);
}

export function listMyOrders(): Promise<{ orders: Order[] }> {
  return apiClient.get('/api/delivery/orders');
}

export function markPickedUp(orderId: string): Promise<{ order: Order }> {
  return apiClient.patch(`/api/delivery/orders/${orderId}/picked-up`);
}

export function markDelivered(orderId: string): Promise<{ order: Order }> {
  return apiClient.patch(`/api/delivery/orders/${orderId}/delivered`);
}
