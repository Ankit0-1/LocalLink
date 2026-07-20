import { Role } from '@prisma/client';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { authHeader, createUser } from './helpers.js';

describe('order and delivery lifecycle', () => {
  it('walks a single order through every status from placement to delivered', async () => {
    const { token: vendorToken } = await createUser(Role.VENDOR);
    const { token: customerToken } = await createUser(Role.CUSTOMER);
    const { user: partner, token: partnerToken } = await createUser(Role.DELIVERY_PARTNER);

    const storeRes = await request(app)
      .post('/api/vendor/stores')
      .set(...authHeader(vendorToken))
      .send({ name: 'Test Store', address: '123 Main St' });
    expect(storeRes.status).toBe(201);
    const storeId = storeRes.body.store.id;

    const productRes = await request(app)
      .post(`/api/vendor/stores/${storeId}/products`)
      .set(...authHeader(vendorToken))
      .send({ name: 'Widget', price: 9.99 });
    expect(productRes.status).toBe(201);
    const productId = productRes.body.product.id;

    // Checkout: PENDING
    await request(app)
      .post('/api/customer/cart/items')
      .set(...authHeader(customerToken))
      .send({ productId, quantity: 2 })
      .expect(201);

    const checkoutRes = await request(app).post('/api/customer/orders').set(...authHeader(customerToken));
    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.order.status).toBe('PENDING');
    expect(checkoutRes.body.order.total).toBe('19.98');
    const orderId = checkoutRes.body.order.id;

    // Vendor: PENDING -> ACCEPTED
    const acceptRes = await request(app).patch(`/api/vendor/orders/${orderId}/accept`).set(...authHeader(vendorToken));
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.order.status).toBe('ACCEPTED');

    // Out-of-order transitions are rejected
    await request(app).patch(`/api/vendor/orders/${orderId}/accept`).set(...authHeader(vendorToken)).expect(409);
    await request(app)
      .patch(`/api/vendor/orders/${orderId}/ready-for-pickup`)
      .set(...authHeader(vendorToken))
      .expect(409);

    // Vendor: ACCEPTED -> PREPARING
    const preparingRes = await request(app).patch(`/api/vendor/orders/${orderId}/preparing`).set(...authHeader(vendorToken));
    expect(preparingRes.status).toBe(200);
    expect(preparingRes.body.order.status).toBe('PREPARING');

    // Vendor: PREPARING -> READY_FOR_PICKUP, atomically creates the delivery request
    const readyRes = await request(app)
      .patch(`/api/vendor/orders/${orderId}/ready-for-pickup`)
      .set(...authHeader(vendorToken));
    expect(readyRes.status).toBe(200);
    expect(readyRes.body.order.status).toBe('READY_FOR_PICKUP');

    const deliveryRequest = await prisma.deliveryRequest.findUniqueOrThrow({ where: { orderId } });
    expect(deliveryRequest.status).toBe('PENDING');
    expect(deliveryRequest.deliveryPartnerId).toBeNull();

    // Delivery partner sees the job and accepts it
    const jobsRes = await request(app).get('/api/delivery/jobs').set(...authHeader(partnerToken));
    expect(jobsRes.status).toBe(200);
    expect(jobsRes.body.jobs).toHaveLength(1);
    const jobId = jobsRes.body.jobs[0].id;

    const acceptJobRes = await request(app).patch(`/api/delivery/jobs/${jobId}/accept`).set(...authHeader(partnerToken));
    expect(acceptJobRes.status).toBe(200);
    expect(acceptJobRes.body.order.status).toBe('DELIVERY_ACCEPTED');

    const acceptedOrder = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(acceptedOrder.deliveryPartnerId).toBe(partner.id);

    // The job is no longer offered once claimed
    const jobsAfterAccept = await request(app).get('/api/delivery/jobs').set(...authHeader(partnerToken));
    expect(jobsAfterAccept.body.jobs).toHaveLength(0);

    // Out-of-order pickup/delivery transitions are rejected
    await request(app).patch(`/api/delivery/orders/${orderId}/delivered`).set(...authHeader(partnerToken)).expect(409);

    // Delivery partner: DELIVERY_ACCEPTED -> PICKED_UP -> DELIVERED
    const pickedUpRes = await request(app).patch(`/api/delivery/orders/${orderId}/picked-up`).set(...authHeader(partnerToken));
    expect(pickedUpRes.status).toBe(200);
    expect(pickedUpRes.body.order.status).toBe('PICKED_UP');

    const deliveredRes = await request(app).patch(`/api/delivery/orders/${orderId}/delivered`).set(...authHeader(partnerToken));
    expect(deliveredRes.status).toBe(200);
    expect(deliveredRes.body.order.status).toBe('DELIVERED');

    // Customer's tracking view reflects the final state
    const trackingRes = await request(app).get(`/api/customer/orders/${orderId}`).set(...authHeader(customerToken));
    expect(trackingRes.status).toBe(200);
    expect(trackingRes.body.order.status).toBe('DELIVERED');
    expect(trackingRes.body.order.deliveryPartner.id).toBe(partner.id);
  });

  it('rejecting a pending order stops the lifecycle there', async () => {
    const { token: vendorToken } = await createUser(Role.VENDOR);
    const { token: customerToken } = await createUser(Role.CUSTOMER);

    const storeRes = await request(app)
      .post('/api/vendor/stores')
      .set(...authHeader(vendorToken))
      .send({ name: 'Store' });
    const productRes = await request(app)
      .post(`/api/vendor/stores/${storeRes.body.store.id}/products`)
      .set(...authHeader(vendorToken))
      .send({ name: 'Widget', price: 5 });

    await request(app)
      .post('/api/customer/cart/items')
      .set(...authHeader(customerToken))
      .send({ productId: productRes.body.product.id, quantity: 1 });
    const checkoutRes = await request(app).post('/api/customer/orders').set(...authHeader(customerToken));

    const rejectRes = await request(app)
      .patch(`/api/vendor/orders/${checkoutRes.body.order.id}/reject`)
      .set(...authHeader(vendorToken));
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.order.status).toBe('REJECTED');

    // A rejected order can never move forward
    await request(app)
      .patch(`/api/vendor/orders/${checkoutRes.body.order.id}/preparing`)
      .set(...authHeader(vendorToken))
      .expect(409);
  });
});
