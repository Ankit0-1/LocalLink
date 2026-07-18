# Task List

Organized into implementation phases. Each feature phase is split into Backend Tasks and Frontend Tasks. "Depends on" lists what must be complete first. Each phase ends with a milestone checkpoint.

## Phase 0 — Foundation

**Backend Tasks**
- [x] Set up backend project
- [x] Configure Prisma, PostgreSQL, and migrations
- [x] Define users, stores, products, orders, order items, and delivery requests
- [x] Restore one-delivery-request-per-order uniqueness lost during UUID migration

**Frontend Tasks**
- [x] Set up frontend project

**Milestone checkpoint:** Backend and frontend projects run locally; database schema migrates cleanly and matches `schema.prisma` with no drift.

**Definition of Done:**
- Backend and frontend projects install and run locally
- Prisma schema defines users, stores, products, orders, order items, and delivery requests
- All migrations apply cleanly with zero drift against `schema.prisma`
- One-delivery-request-per-order uniqueness is enforced at the database level

---

## Phase 1 — Authentication & Authorization

Depends on: Phase 0

**Backend Tasks**
- [x] Implement JWT authentication (register, login, `/me`)
- [x] Implement role-based authorization middleware (`requireAuth`, `requireRole`)
- [x] Configure CORS for the web app origin and preflight requests

**Frontend Tasks**
- [x] Build registration and login views
  - [x] Login view built (`LoginPage`/`LoginForm`, mounted at `/login`, `AuthProvider` now mounted app-wide)
  - [x] Registration view built (`RegisterPage`/`RegisterForm`, mounted at `/register`, `AuthContext` gained a matching `register()` method)
- [x] Store and attach JWT access token to authenticated requests
  - [x] `apiClient` (get/post/put/patch/delete, base URL, auth header injection, JSON parsing, `ApiError`) and `tokenStorage` (getToken/setToken/clearToken/hasToken) built and now exercised by `LoginPage`/`RegisterPage` via `AuthContext`
  - [x] `AuthContext`/`AuthProvider` built (typed models, `login`/`register`/`fetchMe` API calls, `useReducer` state, session rehydration via `GET /api/auth/me`), mounted app-wide in `App.tsx`, and called by `LoginPage`/`RegisterPage`
- [ ] Gate routes/UI by role (customer, vendor, delivery partner, admin)
  - [x] Routing foundation in place (React Router, root layout, route path constants, `getDefaultRoute(role)` helper, `/login` and `/register` routes)
  - [x] `RequireAuth` route guard built (`routes/RequireAuth.tsx` + `routes/RouteLoadingFallback.tsx`) — handles loading/authenticated/unauthenticated states; not yet wired into the router since there are no protected routes to guard yet. `RequireRole` still not built.

**Milestone checkpoint:** A user can register, log in, and reach role-appropriate views; unauthenticated or wrong-role requests are rejected by the API. (Backend half met — auth endpoints and middleware verified with a consistent `{ user, accessToken }` / `{ user }` response contract; frontend half still pending.)

**Definition of Done:**
- Register works
- Login works
- JWT is issued
- Protected endpoints require authentication
- Role checks are enforced
- Frontend stores the token
- User remains logged in after refresh

---

## Phase 2 — Vendor Store & Product Management

Depends on: Phase 1

**Backend Tasks**
- [x] Implement vendor store creation and editing
- [x] Implement vendor product CRUD scoped to owned stores

**Frontend Tasks**
- [x] Build vendor store creation/editing views
- [x] Build vendor product CRUD views scoped to owned stores

**Milestone checkpoint:** A logged-in vendor can create a store and manage its products end-to-end through the UI; vendors cannot edit stores/products they don't own.

**Definition of Done:**
- Vendor can create a store
- Vendor can edit their own store
- Vendor can create, edit, and delete products scoped to owned stores
- A vendor cannot modify a store or product they don't own
- Store and product endpoints require authentication and the VENDOR role
- Frontend store/product management reflects changes without a full page reload

---

## Phase 3 — Customer Browsing & Cart

Depends on: Phase 2

**Backend Tasks**
- [ ] Build store listing and store-detail product endpoints
- [ ] Build single-store cart endpoints; reject mixed-store cart additions

**Frontend Tasks**
- [ ] Build customer store browsing and store-detail product views
- [ ] Build single-store cart UI; prevent mixed-store checkout in the UI

**Milestone checkpoint:** A customer can browse stores, view a store's products, and build a cart limited to a single store.

**Definition of Done:**
- Customer can view a list of stores
- Customer can view a store's product catalog
- Customer can add products from one store to a cart
- Adding a product from a different store is rejected
- Cart contents persist across a page refresh

---

## Phase 4 — Order Creation & Checkout

Depends on: Phase 3

**Backend Tasks**
- [ ] Create orders linked to the chosen store and validate product ownership

**Frontend Tasks**
- [ ] Build checkout flow that submits the cart as an order

**Milestone checkpoint:** A customer can check out a single-store cart and a corresponding order is created and visible to the owning vendor.

**Definition of Done:**
- Checkout creates an order linked to the correct store
- Order items reference valid products owned by that store
- Order total is calculated correctly
- Cart is cleared after a successful checkout
- The order is visible to the owning vendor immediately after creation

---

## Phase 5 — Vendor Order Fulfillment

Depends on: Phase 4

**Backend Tasks**
- [ ] Build vendor order dashboard endpoints scoped to owned stores
- [ ] Implement vendor accept, reject, preparation, and ready-for-pickup actions
- [ ] Create the order's delivery request only after ready-for-pickup, atomically

**Frontend Tasks**
- [ ] Build vendor order dashboard UI scoped to owned stores
- [ ] Build vendor controls for accept, reject, preparation, and ready-for-pickup actions

**Milestone checkpoint:** A vendor can move an order through accepted → preparing → ready-for-pickup, and exactly one delivery request is created at that point.

**Definition of Done:**
- Vendor can view orders scoped to their own stores only
- Vendor can accept, reject, mark preparing, and mark ready for pickup
- Exactly one delivery request is created when an order becomes ready for pickup
- A vendor cannot act on an order belonging to another vendor's store
- Order status changes are reflected in the vendor dashboard

---

## Phase 6 — Delivery Partner Flow

Depends on: Phase 5

**Backend Tasks**
- [ ] Offer ready-for-pickup delivery jobs to delivery partners
- [ ] Implement first-eligible-acceptance assignment (concurrency-safe)
- [ ] Implement pickup and delivery status transitions

**Frontend Tasks**
- [ ] Build delivery dashboard listing available jobs
- [ ] Build job acceptance, pickup, and delivery action UI

**Milestone checkpoint:** A delivery partner can accept a ready job, and only one of several concurrently-accepting delivery partners is assigned; the order can be moved through pickup to delivered.

**Definition of Done:**
- Delivery partners see ready-for-pickup jobs
- The first delivery partner to accept is assigned; other acceptance attempts are rejected
- Concurrent acceptance attempts never double-assign the same job
- Assigned delivery partner can mark a job picked up and delivered
- Order status updates accordingly through pickup and delivery

---

## Phase 7 — Realtime Updates

Depends on: Phase 6

**Backend Tasks**
- [ ] Add Socket.IO events scoped to customers, store vendors, delivery partners, and admins

**Frontend Tasks**
- [ ] Subscribe to and render realtime order/delivery status updates per role

**Milestone checkpoint:** Order and delivery status changes propagate live to the relevant customer, vendor, delivery partner, and admin clients without a page reload.

**Definition of Done:**
- Customers receive live updates for their own orders only
- Vendors receive live updates scoped to their own stores' orders
- Delivery partners receive live updates for jobs offered to or assigned to them
- Admins receive live updates across the system
- No realtime event is delivered to a client unauthorized to see it

---

## Phase 8 — Tracking & Admin Monitoring

Depends on: Phase 7

**Backend Tasks**
- [ ] Build customer order tracking endpoints
- [ ] Build admin monitoring endpoints (users, stores, orders, live status)

**Frontend Tasks**
- [ ] Build customer order tracking views
- [ ] Build admin monitoring views

**Milestone checkpoint:** A customer can track an order from placement to completion, and an admin can view live status across users, stores, and orders.

**Definition of Done:**
- Customer can view real-time status of their own order from placement to completion
- Admin can view all users, stores, and orders
- Admin view reflects live status without a manual refresh
- Tracking and admin endpoints enforce role-based access

---

## Phase 9 — Testing

Depends on: Phase 8 (exercises the full flow; individual test suites may start as soon as their corresponding phase lands)

**Backend Tasks**
- [ ] Add authorization tests (role and ownership enforcement)
- [ ] Add order/delivery lifecycle tests
- [ ] Add single-store cart/order tests
- [ ] Add concurrent delivery-acceptance tests

**Frontend Tasks**
- [ ] Add role-gated routing/UI tests
- [ ] Add single-store cart UI tests

**Milestone checkpoint:** Test suite covers authorization, full order/delivery lifecycle, single-store enforcement, and concurrent delivery acceptance; all tests pass in CI.

**Definition of Done:**
- Authorization tests cover role and ownership enforcement
- Order/delivery lifecycle tests cover the full status flow end-to-end
- Single-store cart/order tests confirm mixed-store orders are rejected
- Concurrent delivery-acceptance tests confirm exactly one partner is assigned
- All tests pass in CI

---

## Phase 10 — Deployment

Depends on: Phase 9

**Backend Tasks**
- [ ] Prepare backend deployment configuration (env, database, process)

**Frontend Tasks**
- [ ] Prepare frontend deployment configuration (build, hosting)

**Milestone checkpoint:** Backend and frontend deploy to a target environment and the full core flow works end-to-end outside local development.

**Definition of Done:**
- Backend deploys and connects to a production database
- Frontend builds and deploys to hosting
- Environment variables are documented and configured for the target environment
- The core flow (register → order → deliver) works end-to-end in the deployed environment

---

No retailer broadcast or retailer-request task is part of this architecture.
