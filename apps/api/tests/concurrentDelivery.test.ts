import { Role } from '@prisma/client';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { authHeader, createUser } from './helpers.js';

async function createReadyForPickupOrder() {
  const { token: vendorToken } = await createUser(Role.VENDOR);
  const { token: customerToken } = await createUser(Role.CUSTOMER);

  const storeRes = await request(app)
    .post('/api/vendor/stores')
    .set(...authHeader(vendorToken))
    .send({ name: 'Store' });
  const productRes = await request(app)
    .post(`/api/vendor/stores/${storeRes.body.store.id}/products`)
    .set(...authHeader(vendorToken))
    .send({ name: 'Widget', price: 9.99 });

  await request(app)
    .post('/api/customer/cart/items')
    .set(...authHeader(customerToken))
    .send({ productId: productRes.body.product.id, quantity: 1 });
  const checkoutRes = await request(app).post('/api/customer/orders').set(...authHeader(customerToken));
  const orderId = checkoutRes.body.order.id;

  await request(app).patch(`/api/vendor/orders/${orderId}/accept`).set(...authHeader(vendorToken));
  await request(app).patch(`/api/vendor/orders/${orderId}/preparing`).set(...authHeader(vendorToken));
  await request(app).patch(`/api/vendor/orders/${orderId}/ready-for-pickup`).set(...authHeader(vendorToken));

  const deliveryRequest = await prisma.deliveryRequest.findUniqueOrThrow({ where: { orderId } });
  return { orderId, jobId: deliveryRequest.id };
}

describe('concurrent delivery acceptance', () => {
  it('assigns exactly one of several concurrently-accepting delivery partners', async () => {
    const { orderId, jobId } = await createReadyForPickupOrder();

    const partnerCount = 8;
    const partners = await Promise.all(
      Array.from({ length: partnerCount }, () => createUser(Role.DELIVERY_PARTNER)),
    );

    const responses = await Promise.all(
      partners.map(({ token }) => request(app).patch(`/api/delivery/jobs/${jobId}/accept`).set(...authHeader(token))),
    );

    const succeeded = responses.filter((res) => res.status === 200);
    const conflicted = responses.filter((res) => res.status === 409);
    expect(succeeded).toHaveLength(1);
    expect(conflicted).toHaveLength(partnerCount - 1);

    // The database agrees: the delivery request and the order were assigned to the same
    // single partner, never two different ones and never left unassigned.
    const deliveryRequest = await prisma.deliveryRequest.findUniqueOrThrow({ where: { orderId } });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(deliveryRequest.deliveryPartnerId).not.toBeNull();
    expect(order.deliveryPartnerId).toBe(deliveryRequest.deliveryPartnerId);
    expect(order.status).toBe('DELIVERY_ACCEPTED');

    const winningPartnerId = partners.find((_p, i) => responses[i].status === 200)!.user.id;
    expect(order.deliveryPartnerId).toBe(winningPartnerId);
  });

  it('rejects accepting a job that was already claimed, on a later separate request', async () => {
    const { jobId } = await createReadyForPickupOrder();
    const { token: firstToken } = await createUser(Role.DELIVERY_PARTNER);
    const { token: secondToken } = await createUser(Role.DELIVERY_PARTNER);

    const first = await request(app).patch(`/api/delivery/jobs/${jobId}/accept`).set(...authHeader(firstToken));
    expect(first.status).toBe(200);

    const second = await request(app).patch(`/api/delivery/jobs/${jobId}/accept`).set(...authHeader(secondToken));
    expect(second.status).toBe(409);
  });
});
