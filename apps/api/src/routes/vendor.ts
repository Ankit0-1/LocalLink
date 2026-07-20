import { OrderStatus, Prisma, Role } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { emitJobOffered, emitOrderUpdated } from '../lib/socket.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';

const vendorRouter = Router();

const storeSelect = {
  id: true,
  name: true,
  description: true,
  address: true,
  image: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const productSelect = {
  id: true,
  storeId: true,
  name: true,
  price: true,
  description: true,
  image: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

function optionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return undefined;
  return value.trim() || null;
}

function requiredText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function validPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

vendorRouter.use(requireAuth, requireRole(Role.VENDOR));

vendorRouter.get('/stores', async (req: AuthenticatedRequest, res, next) => {
  try {
    const stores = await prisma.store.findMany({
      where: { vendorId: req.user!.id },
      select: storeSelect,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ stores });
  } catch (error) {
    return next(error);
  }
});

vendorRouter.post('/stores', async (req: AuthenticatedRequest, res, next) => {
  try {
    const name = requiredText(req.body?.name);
    if (!name) return res.status(400).json({ message: 'Store name is required' });

    const store = await prisma.store.create({
      data: {
        vendorId: req.user!.id,
        name,
        description: optionalText(req.body?.description) ?? null,
        address: optionalText(req.body?.address) ?? null,
        image: optionalText(req.body?.image) ?? null,
      },
      select: storeSelect,
    });
    return res.status(201).json({ store });
  } catch (error) {
    return next(error);
  }
});

vendorRouter.patch('/stores/:storeId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const store = await prisma.store.findFirst({ where: { id: req.params.storeId, vendorId: req.user!.id } });
    if (!store) return res.status(404).json({ message: 'Store not found' });

    const data: { name?: string; description?: string | null; address?: string | null; image?: string | null } = {};
    if (req.body?.name !== undefined) {
      const name = requiredText(req.body.name);
      if (!name) return res.status(400).json({ message: 'Store name cannot be empty' });
      data.name = name;
    }
    for (const field of ['description', 'address', 'image'] as const) {
      if (req.body?.[field] !== undefined) {
        const value = optionalText(req.body[field]);
        if (value === undefined) return res.status(400).json({ message: `${field} must be a string` });
        data[field] = value;
      }
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ message: 'Provide at least one store field to update' });

    const updatedStore = await prisma.store.update({ where: { id: store.id }, data, select: storeSelect });
    return res.json({ store: updatedStore });
  } catch (error) {
    return next(error);
  }
});

vendorRouter.delete('/stores/:storeId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const store = await prisma.store.findFirst({ where: { id: req.params.storeId, vendorId: req.user!.id } });
    if (!store) return res.status(404).json({ message: 'Store not found' });

    await prisma.store.update({ where: { id: store.id }, data: { isActive: false } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

vendorRouter.get('/stores/:storeId/products', async (req: AuthenticatedRequest, res, next) => {
  try {
    const store = await prisma.store.findFirst({ where: { id: req.params.storeId, vendorId: req.user!.id } });
    if (!store) return res.status(404).json({ message: 'Store not found' });

    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      select: productSelect,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ products });
  } catch (error) {
    return next(error);
  }
});

vendorRouter.post('/stores/:storeId/products', async (req: AuthenticatedRequest, res, next) => {
  try {
    const store = await prisma.store.findFirst({ where: { id: req.params.storeId, vendorId: req.user!.id } });
    if (!store) return res.status(404).json({ message: 'Store not found' });

    const name = requiredText(req.body?.name);
    if (!name || !validPrice(req.body?.price)) {
      return res.status(400).json({ message: 'Product name and a positive price are required' });
    }
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name,
        price: req.body.price,
        description: optionalText(req.body?.description) ?? null,
        image: optionalText(req.body?.image) ?? null,
      },
      select: productSelect,
    });
    return res.status(201).json({ product });
  } catch (error) {
    return next(error);
  }
});

vendorRouter.patch('/products/:productId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.productId, store: { vendorId: req.user!.id } } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const data: { name?: string; price?: number; description?: string | null; image?: string | null } = {};
    if (req.body?.name !== undefined) {
      const name = requiredText(req.body.name);
      if (!name) return res.status(400).json({ message: 'Product name cannot be empty' });
      data.name = name;
    }
    if (req.body?.price !== undefined) {
      if (!validPrice(req.body.price)) return res.status(400).json({ message: 'Price must be a positive number' });
      data.price = req.body.price;
    }
    for (const field of ['description', 'image'] as const) {
      if (req.body?.[field] !== undefined) {
        const value = optionalText(req.body[field]);
        if (value === undefined) return res.status(400).json({ message: `${field} must be a string` });
        data[field] = value;
      }
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ message: 'Provide at least one product field to update' });

    const updatedProduct = await prisma.product.update({ where: { id: product.id }, data, select: productSelect });
    return res.json({ product: updatedProduct });
  } catch (error) {
    return next(error);
  }
});

vendorRouter.delete('/products/:productId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.productId, store: { vendorId: req.user!.id } } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

const vendorOrderSelect = {
  id: true,
  status: true,
  total: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { id: true, name: true, phone: true } },
  store: { select: { id: true, name: true } },
  items: {
    select: {
      id: true,
      quantity: true,
      price: true,
      product: { select: { id: true, name: true } },
    },
  },
} as const;

type VendorOrder = Prisma.OrderGetPayload<{ select: typeof vendorOrderSelect }>;

function serializeOrder(order: VendorOrder) {
  return {
    id: order.id,
    status: order.status,
    total: order.total.toString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: order.customer,
    store: order.store,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price.toString(),
      product: item.product,
    })),
  };
}

function findOwnedOrder(vendorId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, store: { vendorId } },
    select: { id: true, status: true },
  });
}

function toOrderEvent(order: VendorOrder, vendorId: string) {
  return {
    id: order.id,
    status: order.status,
    customerId: order.customer.id,
    vendorId,
    deliveryPartnerId: null,
  };
}

vendorRouter.get('/orders', async (req: AuthenticatedRequest, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { store: { vendorId: req.user!.id } },
      orderBy: { createdAt: 'desc' },
      select: vendorOrderSelect,
    });
    return res.json({ orders: orders.map(serializeOrder) });
  } catch (error) {
    return next(error);
  }
});

vendorRouter.patch('/orders/:orderId/accept', async (req: AuthenticatedRequest, res, next) => {
  try {
    const order = await findOwnedOrder(req.user!.id, req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== OrderStatus.PENDING) {
      return res.status(409).json({ message: 'Only pending orders can be accepted' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.ACCEPTED },
      select: vendorOrderSelect,
    });
    emitOrderUpdated(toOrderEvent(updatedOrder, req.user!.id));
    return res.json({ order: serializeOrder(updatedOrder) });
  } catch (error) {
    return next(error);
  }
});

vendorRouter.patch('/orders/:orderId/reject', async (req: AuthenticatedRequest, res, next) => {
  try {
    const order = await findOwnedOrder(req.user!.id, req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== OrderStatus.PENDING) {
      return res.status(409).json({ message: 'Only pending orders can be rejected' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.REJECTED },
      select: vendorOrderSelect,
    });
    emitOrderUpdated(toOrderEvent(updatedOrder, req.user!.id));
    return res.json({ order: serializeOrder(updatedOrder) });
  } catch (error) {
    return next(error);
  }
});

vendorRouter.patch('/orders/:orderId/preparing', async (req: AuthenticatedRequest, res, next) => {
  try {
    const order = await findOwnedOrder(req.user!.id, req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== OrderStatus.ACCEPTED) {
      return res.status(409).json({ message: 'Only accepted orders can be marked preparing' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PREPARING },
      select: vendorOrderSelect,
    });
    emitOrderUpdated(toOrderEvent(updatedOrder, req.user!.id));
    return res.json({ order: serializeOrder(updatedOrder) });
  } catch (error) {
    return next(error);
  }
});

vendorRouter.patch('/orders/:orderId/ready-for-pickup', async (req: AuthenticatedRequest, res, next) => {
  try {
    const order = await findOwnedOrder(req.user!.id, req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== OrderStatus.PREPARING) {
      return res.status(409).json({ message: 'Only preparing orders can be marked ready for pickup' });
    }

    let updatedOrder: VendorOrder;
    let deliveryRequestId: string;
    try {
      ({ order: updatedOrder, deliveryRequestId } = await prisma.$transaction(async (tx) => {
        const result = await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.READY_FOR_PICKUP },
          select: vendorOrderSelect,
        });
        const deliveryRequest = await tx.deliveryRequest.create({
          data: { orderId: order.id },
          select: { id: true },
        });
        return { order: result, deliveryRequestId: deliveryRequest.id };
      }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'A delivery request already exists for this order' });
      }
      throw error;
    }

    emitOrderUpdated(toOrderEvent(updatedOrder, req.user!.id));
    emitJobOffered({ id: deliveryRequestId, orderId: updatedOrder.id });

    return res.json({ order: serializeOrder(updatedOrder) });
  } catch (error) {
    return next(error);
  }
});

export default vendorRouter;
