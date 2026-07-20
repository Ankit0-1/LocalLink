import { DeliveryRequestStatus, OrderStatus, Prisma, Role } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';

const deliveryRouter = Router();

deliveryRouter.use(requireAuth, requireRole(Role.DELIVERY_PARTNER));

const jobOrderSelect = {
  id: true,
  status: true,
  total: true,
  createdAt: true,
  updatedAt: true,
  store: { select: { id: true, name: true, address: true } },
  customer: { select: { id: true, name: true, phone: true } },
} as const;

type JobOrder = Prisma.OrderGetPayload<{ select: typeof jobOrderSelect }>;

function serializeOrder(order: JobOrder) {
  return {
    id: order.id,
    status: order.status,
    total: order.total.toString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    store: order.store,
    customer: order.customer,
  };
}

function serializeJob(job: { id: string; status: DeliveryRequestStatus; createdAt: Date; order: JobOrder }) {
  return {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    order: serializeOrder(job.order),
  };
}

function findAssignedOrder(deliveryPartnerId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, deliveryPartnerId },
    select: { id: true, status: true },
  });
}

// Available jobs: delivery requests still waiting for a partner to accept them.
deliveryRouter.get('/jobs', async (_req: AuthenticatedRequest, res, next) => {
  try {
    const jobs = await prisma.deliveryRequest.findMany({
      where: { status: DeliveryRequestStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        order: { select: jobOrderSelect },
      },
    });
    return res.json({ jobs: jobs.map(serializeJob) });
  } catch (error) {
    return next(error);
  }
});

// First-eligible-acceptance: the conditional updateMany only matches a row that is still
// PENDING and unassigned, so under concurrent acceptance only one request's WHERE clause
// still holds by the time it acquires the row lock — every later one updates zero rows.
deliveryRouter.patch('/jobs/:deliveryRequestId/accept', async (req: AuthenticatedRequest, res, next) => {
  try {
    const deliveryRequest = await prisma.deliveryRequest.findUnique({
      where: { id: req.params.deliveryRequestId },
      select: { id: true, orderId: true },
    });
    if (!deliveryRequest) return res.status(404).json({ message: 'Delivery job not found' });

    const partnerId = req.user!.id;
    const order = await prisma.$transaction(async (tx) => {
      const claimed = await tx.deliveryRequest.updateMany({
        where: { id: deliveryRequest.id, status: DeliveryRequestStatus.PENDING, deliveryPartnerId: null },
        data: { status: DeliveryRequestStatus.ACCEPTED, deliveryPartnerId: partnerId },
      });
      if (claimed.count === 0) return null;

      return tx.order.update({
        where: { id: deliveryRequest.orderId },
        data: { deliveryPartnerId: partnerId, status: OrderStatus.DELIVERY_ACCEPTED },
        select: jobOrderSelect,
      });
    });

    if (!order) {
      return res.status(409).json({ message: 'This job has already been accepted by another delivery partner' });
    }
    return res.json({ order: serializeOrder(order) });
  } catch (error) {
    return next(error);
  }
});

// Orders assigned to the current delivery partner (accepted, picked up, or delivered).
deliveryRouter.get('/orders', async (req: AuthenticatedRequest, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { deliveryPartnerId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      select: jobOrderSelect,
    });
    return res.json({ orders: orders.map(serializeOrder) });
  } catch (error) {
    return next(error);
  }
});

deliveryRouter.patch('/orders/:orderId/picked-up', async (req: AuthenticatedRequest, res, next) => {
  try {
    const order = await findAssignedOrder(req.user!.id, req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== OrderStatus.DELIVERY_ACCEPTED) {
      return res.status(409).json({ message: 'Only accepted deliveries can be marked picked up' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PICKED_UP },
      select: jobOrderSelect,
    });
    return res.json({ order: serializeOrder(updatedOrder) });
  } catch (error) {
    return next(error);
  }
});

deliveryRouter.patch('/orders/:orderId/delivered', async (req: AuthenticatedRequest, res, next) => {
  try {
    const order = await findAssignedOrder(req.user!.id, req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== OrderStatus.PICKED_UP) {
      return res.status(409).json({ message: 'Only picked-up deliveries can be marked delivered' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.DELIVERED },
      select: jobOrderSelect,
    });
    return res.json({ order: serializeOrder(updatedOrder) });
  } catch (error) {
    return next(error);
  }
});

export default deliveryRouter;
