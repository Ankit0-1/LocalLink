import { Prisma, Role } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { emitOrderUpdated } from '../lib/socket.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';

const customerRouter = Router();

customerRouter.use(requireAuth, requireRole(Role.CUSTOMER));

type ProductSummary = {
  id: string;
  name: string;
  price: Prisma.Decimal | string | number;
  description: string | null;
  image: string | null;
  isActive: boolean;
  storeId: string;
  store?: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
};

type CartItemSummary = {
  id: string;
  productId: string;
  quantity: number;
  product: ProductSummary;
};

type CartPayload = {
  id: string | null;
  items: CartItemSummary[];
};

function formatPrice(value: Prisma.Decimal | string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value.toString();
}

function serializeProduct(product: ProductSummary) {
  return {
    id: product.id,
    name: product.name,
    price: formatPrice(product.price) ?? '0',
    description: product.description,
    image: product.image,
    isActive: product.isActive,
    storeId: product.storeId,
    store: product.store
      ? {
          id: product.store.id,
          name: product.store.name,
          isActive: product.store.isActive,
        }
      : null,
  };
}

function serializeStore(store: {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  image: string | null;
  isActive: boolean;
}) {
  return {
    id: store.id,
    name: store.name,
    description: store.description,
    address: store.address,
    image: store.image,
    isActive: store.isActive,
  };
}

function serializeCart(cart: CartPayload) {
  return {
    id: cart.id,
    items: cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: serializeProduct(item.product),
    })),
  };
}

function serializeOrder(order: {
  id: string;
  status: string;
  total: Prisma.Decimal | string | number;
  createdAt: Date;
  updatedAt: Date;
  store: {
    id: string;
    name: string;
    vendorId?: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: Prisma.Decimal | string | number;
    product: { id: string; name: string };
  }>;
}) {
  return {
    id: order.id,
    status: order.status,
    total: formatPrice(order.total) ?? '0',
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    store: { id: order.store.id, name: order.store.name },
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: formatPrice(item.price) ?? '0',
      product: item.product,
    })),
  };
}

async function getCartPayload(userId: string): Promise<CartPayload> {
  const cart = await prisma.cart.findFirst({
    where: { userId },
    include: { items: true },
  });

  if (!cart) {
    return { id: null, items: [] };
  }

  const productIds = [...new Set(cart.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
      image: true,
      isActive: true,
      storeId: true,
      store: { select: { id: true, name: true, isActive: true } },
    },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));
  const items: CartItemSummary[] = [];
  for (const item of cart.items) {
    const product = productMap.get(item.productId);
    if (!product) continue;
    items.push({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product,
    });
  }

  return { id: cart.id, items };
}

customerRouter.get('/stores', async (_req: AuthenticatedRequest, res, next) => {
  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        image: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ stores: stores.map(serializeStore) });
  } catch (error) {
    return next(error);
  }
});

customerRouter.get('/stores/:storeId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const store = await prisma.store.findFirst({
      where: { id: req.params.storeId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        image: true,
        isActive: true,
        products: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
            image: true,
            isActive: true,
            storeId: true,
          },
        },
      },
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    return res.json({
      store: {
        ...serializeStore(store),
        products: store.products.map((product) => serializeProduct({ ...product, store: null })),
      },
    });
  } catch (error) {
    return next(error);
  }
});

customerRouter.get('/stores/:storeId/products', async (req: AuthenticatedRequest, res, next) => {
  try {
    const store = await prisma.store.findFirst({
      where: { id: req.params.storeId, isActive: true },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const products = await prisma.product.findMany({
      where: { storeId: store.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        image: true,
        isActive: true,
        storeId: true,
      },
    });

    return res.json({ products: products.map((product) => serializeProduct({ ...product, store: null })) });
  } catch (error) {
    return next(error);
  }
});

customerRouter.get('/cart', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cart = await getCartPayload(req.user!.id);
    return res.json({ cart: serializeCart(cart) });
  } catch (error) {
    return next(error);
  }
});

customerRouter.post('/cart/items', async (req: AuthenticatedRequest, res, next) => {
  try {
    const productId = req.body?.productId;
    const quantity = req.body?.quantity ?? 1;

    if (typeof productId !== 'string' || !productId.trim()) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        image: true,
        isActive: true,
        storeId: true,
        store: { select: { id: true, name: true, isActive: true } },
      },
    });

    if (!product || !product.store?.isActive) {
      return res.status(404).json({ message: 'Product is unavailable' });
    }

    const existingCart = await prisma.cart.findFirst({
      where: { userId: req.user!.id },
      include: { items: true },
    });

    const existingCartPayload = await getCartPayload(req.user!.id);
    if (existingCartPayload.items.length > 0) {
      const existingStoreId = existingCartPayload.items[0].product.storeId;
      if (existingStoreId !== product.storeId) {
        return res.status(409).json({ message: 'Your cart already contains items from another store. Please checkout or clear it first.' });
      }
    }

    let cart = existingCart;
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user!.id },
        include: { items: true },
      });
    }

    const cartItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
    const existingCartItem = cartItems.find((item) => item.productId === product.id);
    if (existingCartItem) {
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity,
        },
      });
    }

    const updatedCart = await getCartPayload(req.user!.id);
    return res.status(201).json({ cart: serializeCart(updatedCart) });
  } catch (error) {
    return next(error);
  }
});

customerRouter.patch('/cart/items/:itemId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const quantity = req.body?.quantity;

    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ message: 'Quantity must be a non-negative integer' });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: req.params.itemId, cart: { userId: req.user!.id } },
      select: { id: true, quantity: true, cartId: true },
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: cartItem.id } });
    } else {
      await prisma.cartItem.update({ where: { id: cartItem.id }, data: { quantity } });
    }

    const updatedCart = await getCartPayload(req.user!.id);
    return res.json({ cart: serializeCart(updatedCart) });
  } catch (error) {
    return next(error);
  }
});

customerRouter.delete('/cart/items/:itemId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cartItem = await prisma.cartItem.findFirst({
      where: { id: req.params.itemId, cart: { userId: req.user!.id } },
      select: { id: true },
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await prisma.cartItem.delete({ where: { id: cartItem.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

customerRouter.post('/orders', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cartPayload = await getCartPayload(req.user!.id);

    if (!cartPayload.id || cartPayload.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const storeIds = Array.from(new Set(cartPayload.items.map((item) => item.product.storeId)));
    if (storeIds.length !== 1) {
      return res.status(409).json({ message: 'Your cart can only contain items from one store at checkout' });
    }

    const storeId = storeIds[0];
    const invalidItems = cartPayload.items.filter((item) => !item.product.isActive || !item.product.store?.isActive);
    if (invalidItems.length > 0) {
      return res.status(400).json({ message: 'One or more cart items are no longer available' });
    }

    const total = cartPayload.items.reduce((sum, item) => sum + Number(item.product.price.toString()) * item.quantity, 0);

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          customerId: req.user!.id,
          storeId,
          total: new Prisma.Decimal(total.toFixed(2)),
          status: 'PENDING',
          items: {
            create: cartPayload.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          store: { select: { id: true, name: true, vendorId: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cartPayload.id! } });
      return createdOrder;
    });

    emitOrderUpdated({
      id: order.id,
      status: order.status,
      customerId: order.customerId,
      vendorId: order.store.vendorId,
      deliveryPartnerId: null,
    });

    return res.status(201).json({ order: serializeOrder(order) });
  } catch (error) {
    return next(error);
  }
});

customerRouter.get('/orders', async (req: AuthenticatedRequest, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    return res.json({ orders: orders.map(serializeOrder) });
  } catch (error) {
    return next(error);
  }
});

customerRouter.get('/orders/:orderId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.orderId, customerId: req.user!.id },
      include: {
        store: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json({ order: serializeOrder(order) });
  } catch (error) {
    return next(error);
  }
});

export default customerRouter;
