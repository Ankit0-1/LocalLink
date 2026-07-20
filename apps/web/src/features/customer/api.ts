import { apiClient } from '../../lib/apiClient';
import type { Cart, Order, OrderTracking, Product, Store, StoreDetail } from './types';

export function listStores(): Promise<{ stores: Store[] }> {
  return apiClient.get('/api/customer/stores');
}

export function getStore(storeId: string): Promise<{ store: StoreDetail }> {
  return apiClient.get(`/api/customer/stores/${storeId}`);
}

export function getCart(): Promise<{ cart: Cart }> {
  return apiClient.get('/api/customer/cart');
}

export function addToCart(productId: string, quantity = 1): Promise<{ cart: Cart }> {
  return apiClient.post('/api/customer/cart/items', { productId, quantity });
}

export function updateCartItem(itemId: string, quantity: number): Promise<{ cart: Cart }> {
  return apiClient.patch(`/api/customer/cart/items/${itemId}`, { quantity });
}

export function removeCartItem(itemId: string): Promise<void> {
  return apiClient.delete(`/api/customer/cart/items/${itemId}`);
}

export function checkoutCart(): Promise<{ order: Order }> {
  return apiClient.post('/api/customer/orders');
}

export function listOrders(): Promise<{ orders: Order[] }> {
  return apiClient.get('/api/customer/orders');
}

export function getOrder(orderId: string): Promise<{ order: OrderTracking }> {
  return apiClient.get(`/api/customer/orders/${orderId}`);
}
