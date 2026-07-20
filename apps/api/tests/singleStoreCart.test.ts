import { Role } from '@prisma/client';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { authHeader, createUser } from './helpers.js';

async function createStoreWithProduct(vendorToken: string, storeName: string, productName: string, price: number) {
  const storeRes = await request(app)
    .post('/api/vendor/stores')
    .set(...authHeader(vendorToken))
    .send({ name: storeName });
  const productRes = await request(app)
    .post(`/api/vendor/stores/${storeRes.body.store.id}/products`)
    .set(...authHeader(vendorToken))
    .send({ name: productName, price });
  return { storeId: storeRes.body.store.id, productId: productRes.body.product.id };
}

describe('single-store cart enforcement', () => {
  it('rejects adding a product from a second store while the cart already holds items from the first', async () => {
    const { token: vendorAToken } = await createUser(Role.VENDOR);
    const { token: vendorBToken } = await createUser(Role.VENDOR);
    const { token: customerToken } = await createUser(Role.CUSTOMER);

    const storeA = await createStoreWithProduct(vendorAToken, 'Store A', 'Widget A', 10);
    const storeB = await createStoreWithProduct(vendorBToken, 'Store B', 'Widget B', 20);

    const firstAdd = await request(app)
      .post('/api/customer/cart/items')
      .set(...authHeader(customerToken))
      .send({ productId: storeA.productId, quantity: 1 });
    expect(firstAdd.status).toBe(201);

    const secondAdd = await request(app)
      .post('/api/customer/cart/items')
      .set(...authHeader(customerToken))
      .send({ productId: storeB.productId, quantity: 1 });
    expect(secondAdd.status).toBe(409);

    // The cart still only contains the item from store A
    const cartRes = await request(app).get('/api/customer/cart').set(...authHeader(customerToken));
    expect(cartRes.body.cart.items).toHaveLength(1);
    expect(cartRes.body.cart.items[0].product.storeId).toBe(storeA.storeId);
  });

  it('allows a second store once the first store is fully removed from the cart', async () => {
    const { token: vendorAToken } = await createUser(Role.VENDOR);
    const { token: vendorBToken } = await createUser(Role.VENDOR);
    const { token: customerToken } = await createUser(Role.CUSTOMER);

    const storeA = await createStoreWithProduct(vendorAToken, 'Store A', 'Widget A', 10);
    const storeB = await createStoreWithProduct(vendorBToken, 'Store B', 'Widget B', 20);

    const addRes = await request(app)
      .post('/api/customer/cart/items')
      .set(...authHeader(customerToken))
      .send({ productId: storeA.productId, quantity: 1 });
    const cartItemId = addRes.body.cart.items[0].id;

    await request(app)
      .delete(`/api/customer/cart/items/${cartItemId}`)
      .set(...authHeader(customerToken))
      .expect(204);

    const addSecondStore = await request(app)
      .post('/api/customer/cart/items')
      .set(...authHeader(customerToken))
      .send({ productId: storeB.productId, quantity: 1 });
    expect(addSecondStore.status).toBe(201);
    expect(addSecondStore.body.cart.items).toHaveLength(1);
    expect(addSecondStore.body.cart.items[0].product.storeId).toBe(storeB.storeId);
  });

  it('rejects checkout with an empty cart', async () => {
    const { token: customerToken } = await createUser(Role.CUSTOMER);
    const res = await request(app).post('/api/customer/orders').set(...authHeader(customerToken));
    expect(res.status).toBe(400);
  });

  it('computes the order total from current product prices, not a client-supplied value', async () => {
    const { token: vendorToken } = await createUser(Role.VENDOR);
    const { token: customerToken } = await createUser(Role.CUSTOMER);
    const store = await createStoreWithProduct(vendorToken, 'Store', 'Widget', 4.5);

    await request(app)
      .post('/api/customer/cart/items')
      .set(...authHeader(customerToken))
      .send({ productId: store.productId, quantity: 3 });

    // The checkout endpoint takes no body at all — total is always server-computed.
    const checkoutRes = await request(app)
      .post('/api/customer/orders')
      .set(...authHeader(customerToken))
      .send({ total: '0.01' });
    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.order.total).toBe('13.5');
  });
});
