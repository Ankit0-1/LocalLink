# LocalLink

Turn local grocery stores into quick-commerce storefronts.

## Marketplace model

Vendors own stores, and stores own their products. Customers choose one store before adding products to a cart. Each order belongs to exactly one store, and only the vendor who owns that store may accept or reject it.

After the vendor prepares the order and marks it ready for pickup, LocalLink atomically creates the order's one delivery request and offers that job to delivery partners. The first eligible delivery partner to accept is assigned to the order.

## Roles

- Customer: browse stores and products, order from one store, and track delivery.
- Vendor: create and manage stores and products; accept, reject, prepare, and ready their stores' orders.
- Delivery partner: accept ready-for-pickup delivery jobs, pick up, and deliver.
- Admin: monitor users, stores, orders, and live status.

## Core flow

Customer chooses store → adds that store's products → checks out → vendor accepts → vendor marks ready for pickup → delivery partner accepts → pickup → delivery → completed.

## Technology

- Frontend: React, TypeScript, Tailwind
- Backend: Express, TypeScript, Prisma, PostgreSQL
- Realtime: Socket.IO
- Authentication: JWT with role-based authorization

## Authentication API

The API loads `apps/api/.env`. Set a strong, private `JWT_SECRET` (at least 32 random characters) before running it.

- `POST /api/auth/register` — accepts `name`, `email`, `password` (minimum 8 characters), optional `phone`, and optional role: `CUSTOMER`, `VENDOR`, or `DELIVERY_PARTNER`. `ADMIN` cannot be self-registered.
- `POST /api/auth/login` — accepts `email` and `password`, and returns `{ user, accessToken }`.
- `GET /api/auth/me` — requires `Authorization: Bearer <accessToken>` and returns the current user.

Passwords are salted and bcrypt-hashed before they are stored; password hashes are never returned by these endpoints. Reusable `requireAuth` and `requireRole(...)` middleware lives in `apps/api/src/middleware/auth.ts`. Apply both to every future protected route, then also check record ownership (for example, ensure a vendor owns the requested store) within its handler.

## MVP exclusions

Maps, inventory management, payments, OTP, coupons, reviews, ratings, chat, and product approval are not part of the MVP.
