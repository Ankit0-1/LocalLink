import { Role } from '@prisma/client';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { authHeader, createUser } from './helpers.js';

describe('authentication: unauthenticated requests', () => {
  it('rejects requests with no token on every role-protected router', async () => {
    const routes = ['/api/vendor/stores', '/api/customer/stores', '/api/delivery/jobs', '/api/admin/users'];
    for (const route of routes) {
      const res = await request(app).get(route);
      expect(res.status).toBe(401);
    }
  });

  it('rejects a garbage bearer token', async () => {
    const res = await request(app).get('/api/vendor/stores').set('Authorization', 'Bearer not-a-real-jwt');
    expect(res.status).toBe(401);
  });
});

describe('authorization: role enforcement', () => {
  it('rejects a customer calling vendor-only routes', async () => {
    const { token } = await createUser(Role.CUSTOMER);
    const res = await request(app).get('/api/vendor/stores').set(...authHeader(token));
    expect(res.status).toBe(403);
  });

  it('rejects a vendor calling admin-only routes', async () => {
    const { token } = await createUser(Role.VENDOR);
    const res = await request(app).get('/api/admin/users').set(...authHeader(token));
    expect(res.status).toBe(403);
  });

  it('rejects a delivery partner calling customer-only routes', async () => {
    const { token } = await createUser(Role.DELIVERY_PARTNER);
    const res = await request(app).get('/api/customer/stores').set(...authHeader(token));
    expect(res.status).toBe(403);
  });

  it('rejects a deactivated user even with a previously-valid token', async () => {
    const { token } = await createUser(Role.VENDOR, { isActive: false });
    const res = await request(app).get('/api/vendor/stores').set(...authHeader(token));
    expect(res.status).toBe(401);
  });
});

describe('authorization: ownership enforcement', () => {
  it("a vendor cannot read another vendor's store (404, not 403)", async () => {
    const { token: vendorA } = await createUser(Role.VENDOR);
    const { user: vendorB } = await createUser(Role.VENDOR);
    const store = await prisma.store.create({ data: { vendorId: vendorB.id, name: "Vendor B's Store" } });

    const res = await request(app).get(`/api/vendor/stores/${store.id}/products`).set(...authHeader(vendorA));
    expect(res.status).toBe(404);
  });

  it("a vendor cannot edit another vendor's store", async () => {
    const { token: vendorA } = await createUser(Role.VENDOR);
    const { user: vendorB } = await createUser(Role.VENDOR);
    const store = await prisma.store.create({ data: { vendorId: vendorB.id, name: "Vendor B's Store" } });

    const res = await request(app)
      .patch(`/api/vendor/stores/${store.id}`)
      .set(...authHeader(vendorA))
      .send({ name: 'Hijacked' });
    expect(res.status).toBe(404);

    const untouched = await prisma.store.findUniqueOrThrow({ where: { id: store.id } });
    expect(untouched.name).toBe("Vendor B's Store");
  });

  it("a vendor cannot act on another vendor's order", async () => {
    const { user: vendorB } = await createUser(Role.VENDOR);
    const { token: vendorAToken } = await createUser(Role.VENDOR);
    const { user: customer } = await createUser(Role.CUSTOMER);
    const store = await prisma.store.create({ data: { vendorId: vendorB.id, name: 'Store B' } });
    const product = await prisma.product.create({ data: { storeId: store.id, name: 'Widget', price: 9.99 } });
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        storeId: store.id,
        total: 9.99,
        status: 'PENDING',
        items: { create: [{ productId: product.id, quantity: 1, price: 9.99 }] },
      },
    });

    const res = await request(app).patch(`/api/vendor/orders/${order.id}/accept`).set(...authHeader(vendorAToken));
    expect(res.status).toBe(404);
  });

  it("a customer cannot view another customer's order", async () => {
    const { token: customerAToken } = await createUser(Role.CUSTOMER);
    const { user: customerB } = await createUser(Role.CUSTOMER);
    const { user: vendor } = await createUser(Role.VENDOR);
    const store = await prisma.store.create({ data: { vendorId: vendor.id, name: 'Store' } });
    const product = await prisma.product.create({ data: { storeId: store.id, name: 'Widget', price: 9.99 } });
    const order = await prisma.order.create({
      data: {
        customerId: customerB.id,
        storeId: store.id,
        total: 9.99,
        status: 'PENDING',
        items: { create: [{ productId: product.id, quantity: 1, price: 9.99 }] },
      },
    });

    const res = await request(app).get(`/api/customer/orders/${order.id}`).set(...authHeader(customerAToken));
    expect(res.status).toBe(404);
  });

  it('a delivery partner cannot mark picked-up an order assigned to a different partner', async () => {
    const { token: partnerAToken } = await createUser(Role.DELIVERY_PARTNER);
    const { user: partnerB } = await createUser(Role.DELIVERY_PARTNER);
    const { user: customer } = await createUser(Role.CUSTOMER);
    const { user: vendor } = await createUser(Role.VENDOR);
    const store = await prisma.store.create({ data: { vendorId: vendor.id, name: 'Store' } });
    const product = await prisma.product.create({ data: { storeId: store.id, name: 'Widget', price: 9.99 } });
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        storeId: store.id,
        deliveryPartnerId: partnerB.id,
        total: 9.99,
        status: 'DELIVERY_ACCEPTED',
        items: { create: [{ productId: product.id, quantity: 1, price: 9.99 }] },
      },
    });

    const res = await request(app).patch(`/api/delivery/orders/${order.id}/picked-up`).set(...authHeader(partnerAToken));
    expect(res.status).toBe(404);
  });
});
