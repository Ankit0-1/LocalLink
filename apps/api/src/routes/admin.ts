import { Prisma, Role } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';

const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(Role.ADMIN));

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  isActive: true,
  verificationStatus: true,
  createdAt: true,
} as const;

adminRouter.get('/users', async (_req: AuthenticatedRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
});

const storeSelect = {
  id: true,
  name: true,
  address: true,
  isActive: true,
  createdAt: true,
  vendor: { select: { id: true, name: true, email: true } },
} as const;

adminRouter.get('/stores', async (_req: AuthenticatedRequest, res, next) => {
  try {
    const stores = await prisma.store.findMany({
      select: storeSelect,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ stores });
  } catch (error) {
    return next(error);
  }
});

const adminOrderSelect = {
  id: true,
  status: true,
  total: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { id: true, name: true, email: true } },
  store: { select: { id: true, name: true, vendor: { select: { id: true, name: true } } } },
  deliveryPartner: { select: { id: true, name: true, phone: true } },
} as const;

type AdminOrder = Prisma.OrderGetPayload<{ select: typeof adminOrderSelect }>;

function serializeOrder(order: AdminOrder) {
  return {
    id: order.id,
    status: order.status,
    total: order.total.toString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: order.customer,
    store: order.store,
    deliveryPartner: order.deliveryPartner,
  };
}

adminRouter.get('/orders', async (_req: AuthenticatedRequest, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      select: adminOrderSelect,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ orders: orders.map(serializeOrder) });
  } catch (error) {
    return next(error);
  }
});

export default adminRouter;
