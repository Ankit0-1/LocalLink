import type { Server as HttpServer } from 'http';
import { Role } from '@prisma/client';
import { Server } from 'socket.io';
import { verifyAccessToken } from './auth.js';
import { prisma } from './prisma.js';

let io: Server | undefined;

function roleRoom(role: Role): string {
  return `role:${role}`;
}

function customerRoom(customerId: string): string {
  return `customer:${customerId}`;
}

function vendorRoom(vendorId: string): string {
  return `vendor:${vendorId}`;
}

function deliveryPartnerRoom(deliveryPartnerId: string): string {
  return `deliveryPartner:${deliveryPartnerId}`;
}

function getAllowedOrigins(): string[] {
  const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS;

  if (!configuredOrigins) {
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }

  return configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: getAllowedOrigins() },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string' || !token) {
        return next(new Error('Authentication is required'));
      }

      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new Error('This account is unavailable'));
      }

      socket.data.userId = user.id;
      socket.data.role = user.role;
      return next();
    } catch {
      return next(new Error('Invalid or expired access token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, role } = socket.data as { userId: string; role: Role };

    socket.join(roleRoom(role));
    if (role === Role.CUSTOMER) socket.join(customerRoom(userId));
    if (role === Role.VENDOR) socket.join(vendorRoom(userId));
    if (role === Role.DELIVERY_PARTNER) socket.join(deliveryPartnerRoom(userId));
  });

  return io;
}

function getIo(): Server {
  if (!io) {
    throw new Error('Socket.IO server has not been initialized');
  }
  return io;
}

export interface OrderEventPayload {
  id: string;
  status: string;
  customerId: string;
  vendorId: string;
  deliveryPartnerId: string | null;
}

// Fans an order status change out to every room with a legitimate interest in it: the
// customer who placed it, the vendor who owns its store, the delivery partner it's
// assigned to (if any), and admins (Phase 8 consumes this; nothing does yet).
export function emitOrderUpdated(order: OrderEventPayload): void {
  const rooms = [customerRoom(order.customerId), vendorRoom(order.vendorId), roleRoom(Role.ADMIN)];
  if (order.deliveryPartnerId) {
    rooms.push(deliveryPartnerRoom(order.deliveryPartnerId));
  }
  getIo()
    .to(rooms)
    .emit('order:updated', order);
}

export interface DeliveryJobEventPayload {
  id: string;
  orderId: string;
}

// A new ready-for-pickup job: broadcast to every delivery partner, since assignment is
// first-eligible-acceptance rather than offered to a specific partner.
export function emitJobOffered(job: DeliveryJobEventPayload): void {
  getIo()
    .to([roleRoom(Role.DELIVERY_PARTNER), roleRoom(Role.ADMIN)])
    .emit('delivery:job-offered', job);
}

// A job was claimed: tells every other delivery partner's dashboard to drop it from
// their available-jobs list without waiting for a manual refresh.
export function emitJobClaimed(job: DeliveryJobEventPayload): void {
  getIo()
    .to([roleRoom(Role.DELIVERY_PARTNER), roleRoom(Role.ADMIN)])
    .emit('delivery:job-claimed', job);
}
