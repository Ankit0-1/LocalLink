import bcrypt from 'bcryptjs';
import type { Role } from '@prisma/client';
import { createAccessToken } from '../src/lib/auth.js';
import { prisma } from '../src/lib/prisma.js';

export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "notifications", "delivery_requests", "order_items", "orders",
      "cart_items", "carts", "products", "stores", "addresses", "users"
    RESTART IDENTITY CASCADE;
  `);
}

let emailCounter = 0;
function uniqueEmail(prefix: string): string {
  emailCounter += 1;
  return `${prefix}.${Date.now()}.${emailCounter}@example.com`;
}

interface CreateUserOptions {
  name?: string;
  email?: string;
  isActive?: boolean;
}

// Creates a user directly via Prisma (bcrypt cost 4, not the app's production cost 15) so
// test setup stays fast; the token is signed with the same helper the real auth routes use.
export async function createUser(role: Role, options: CreateUserOptions = {}) {
  const passwordHash = await bcrypt.hash('password123', 4);
  const user = await prisma.user.create({
    data: {
      name: options.name ?? `${role} Test User`,
      email: options.email ?? uniqueEmail(role.toLowerCase()),
      passwordHash,
      role,
      isActive: options.isActive ?? true,
    },
  });
  const token = createAccessToken(user);
  return { user, token };
}

export function authHeader(token: string): [string, string] {
  return ['Authorization', `Bearer ${token}`];
}
