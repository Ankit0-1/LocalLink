import { apiClient } from '../../lib/apiClient';
import type { Order, Product, ProductPayload, Store, StorePayload } from './types';

export function listStores(): Promise<{ stores: Store[] }> {
  return apiClient.get('/api/vendor/stores');
}

export function createStore(payload: StorePayload): Promise<{ store: Store }> {
  return apiClient.post('/api/vendor/stores', payload);
}

export function updateStore(storeId: string, payload: StorePayload): Promise<{ store: Store }> {
  return apiClient.patch(`/api/vendor/stores/${storeId}`, payload);
}

export function deleteStore(storeId: string): Promise<void> {
  return apiClient.delete(`/api/vendor/stores/${storeId}`);
}

export function listProducts(storeId: string): Promise<{ products: Product[] }> {
  return apiClient.get(`/api/vendor/stores/${storeId}/products`);
}

export function createProduct(storeId: string, payload: ProductPayload): Promise<{ product: Product }> {
  return apiClient.post(`/api/vendor/stores/${storeId}/products`, payload);
}

export function updateProduct(productId: string, payload: ProductPayload): Promise<{ product: Product }> {
  return apiClient.patch(`/api/vendor/products/${productId}`, payload);
}

export function deleteProduct(productId: string): Promise<void> {
  return apiClient.delete(`/api/vendor/products/${productId}`);
}

export function listOrders(): Promise<{ orders: Order[] }> {
  return apiClient.get('/api/vendor/orders');
}

export function acceptOrder(orderId: string): Promise<{ order: Order }> {
  return apiClient.patch(`/api/vendor/orders/${orderId}/accept`);
}

export function rejectOrder(orderId: string): Promise<{ order: Order }> {
  return apiClient.patch(`/api/vendor/orders/${orderId}/reject`);
}

export function markOrderPreparing(orderId: string): Promise<{ order: Order }> {
  return apiClient.patch(`/api/vendor/orders/${orderId}/preparing`);
}

export function markOrderReadyForPickup(orderId: string): Promise<{ order: Order }> {
  return apiClient.patch(`/api/vendor/orders/${orderId}/ready-for-pickup`);
}
