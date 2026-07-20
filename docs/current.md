# Current State

## Database schema

All models use PostgreSQL native `uuid` primary/foreign keys (`@db.Uuid`, `dbgenerated("gen_random_uuid()")`), not `cuid()`. This was migrated in `use_uuid_identifiers` / `use_db_uuid_defaults`.

`DeliveryRequest.orderId` is `@unique` — each order may have exactly one delivery request, matching the "atomically creates the order's one delivery request" invariant in the README. This constraint was accidentally dropped when `use_uuid_identifiers` rebuilt the column as a plain (non-unique) index, and was restored by migration `20260716120000_restore_delivery_request_uniqueness`.

Verified 2026-07-17 by applying all 7 migrations to a throwaway Postgres 16 container: `prisma migrate deploy` succeeds, `prisma migrate diff` against the schema shows zero drift, and `prisma generate` succeeds.

Known minor issue (not fixed, pre-existing, low priority): `DeliveryRequest` carries both a `@unique` constraint and a separate `@@index([orderId])` on the same column — the plain index is redundant since the unique index already serves lookups.

## Authentication (Phase 1 — backend complete)

`POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/auth/me` are implemented (`apps/api/src/routes/auth.ts`), backed by `requireAuth` / `requireRole` middleware (`apps/api/src/middleware/auth.ts`) and JWT helpers (`apps/api/src/lib/auth.ts`, 1-day expiry, `sub`/`role` claims).

The API CORS middleware (`apps/api/src/middleware/cors.ts`) allows the local Vite origins by default and responds to browser preflight requests. Deployments configure allowed UI origins through the comma-separated `CORS_ALLOWED_ORIGINS` environment variable.

All three endpoints now share a single response contract: `register` and `login` return `{ user, accessToken }`, `me` returns `{ user }` — and `user` is always the same field set (`safeUserSelect`: id, name, email, role, phone, profileImage, isActive, verificationStatus, createdAt) regardless of endpoint. Previously `login` returned `{ data, accessToken }` with extra fields (`verificationDocumentUrl`, `verificationNotes`, `updatedAt`) not present in the other two responses; this drift is fixed.

Debug/PII `console.log` calls that logged full user objects and error details in the auth routes have been removed.

JWT issuance/verification logic itself is unchanged.

Known gaps (tracked in `TASKS.md` Phase 1, not yet done):
- No admin-provisioning path exists (`ADMIN` can't self-register and there's no seed/admin-creation route).
- No rate limiting on `/login`.
- `requireRole` is not yet combined with ownership checks anywhere (no route uses it yet) — README explicitly calls out that ownership must be checked in the handler in addition to role.

## Frontend routing foundation (Phase 1 — first frontend slice)

`react-router-dom` (v7) is installed and wired in. `apps/web/src/App.tsx` now only composes `RouterProvider` around the router; it no longer renders any UI itself.

- `apps/web/src/app/routePaths.ts` — centralized route path constants (currently just `home: '/'`).
- `apps/web/src/app/RootLayout.tsx` — the only layout so far; renders a heading and an `<Outlet />`, nothing else.
- `apps/web/src/app/router.tsx` — `createBrowserRouter` route tree: `RootLayout` at `/` with one nested index route (inline placeholder element, not a page file).

No auth: no `AuthContext`, no protected/role-gated routes, no feature folders, no pages, no hooks yet. This is routing scaffolding only, deliberately structured so `RequireAuth`/`RequireRole` guards and per-role route subtrees can be added later without restructuring what's here.

## Frontend API/token foundation (Phase 1 — second frontend slice)

- `apps/web/src/config/env.ts` — validates `import.meta.env.VITE_API_URL` and throws at module-load time if unset (same fail-fast pattern as the backend's `JWT_SECRET` check). `apps/web/src/vite-env.d.ts` was extended with an `ImportMetaEnv` interface so `VITE_API_URL` is typed. No `.env`/`.env.example` exists yet for `apps/web` — one will be needed (with `VITE_API_URL`) before this can run in a browser.
- `apps/web/src/lib/tokenStorage.ts` — `getToken`/`setToken`/`clearToken`/`hasToken` wrapping `localStorage` under the key `locallink.accessToken`.
- `apps/web/src/lib/apiClient.ts` — `apiClient.{get,post,put,patch,delete}`, all routed through one `request()` that: prefixes `env.apiUrl`, attaches `Authorization: Bearer <token>` when a token exists, JSON-encodes request bodies, JSON-parses responses, and throws `ApiError` (with `status`, `message`, `data`) on non-OK responses.

Nothing calls these yet — no `AuthContext`, no login/register pages exist in this slice, per scope. Verified by temporarily forcing usage in `main.tsx` (not committed) and inspecting the built bundle directly: with `VITE_API_URL` set, `import.meta.env` is inlined correctly and no error throws; with it unset, the fail-fast throw is present and reachable in the output. Reverted after verification — the real `main.tsx`/`App.tsx` are unchanged by this slice.

Verified: `tsc --noEmit`, `eslint` (0 warnings/errors), and `npm run build` all pass; `vite preview` serves the built app and returns the expected HTML/JS without server errors. Full in-browser interaction wasn't verified (no headless browser available in this environment).

## Frontend auth context (Phase 1 — third frontend slice)

- `apps/web/src/features/auth/types.ts` — `User`, `Role`, `VerificationStatus`, `LoginPayload`, `RegisterPayload`, `AuthResponse` (`{ user, accessToken }`), `MeResponse` (`{ user }`), mirroring the backend's `safeUserSelect` field set and the `register`/`login`/`me` response contract exactly (see Authentication section above).
- `apps/web/src/features/auth/api.ts` — `login`, `register`, `fetchMe`, each a thin typed wrapper around `apiClient.post`/`apiClient.get` against `/api/auth/login`, `/api/auth/register`, `/api/auth/me`. No fetch/axios calls outside `apiClient`.
- `apps/web/src/features/auth/AuthContext.tsx` — `AuthProvider` (Context + `useReducer`, state: `{ user, isInitializing }`) and `useAuth()` hook. Exposes `user`, `isAuthenticated`, `isInitializing`, `login(payload)`, `logout()`.
  - `login` calls the API, persists the token via `tokenStorage.setToken`, and updates state.
  - `logout` clears the token via `tokenStorage.clearToken` and resets state.
  - On mount, rehydrates the session: if `tokenStorage.hasToken()` is false, state resolves to logged-out immediately; otherwise it calls `GET /api/auth/me` — success populates `user`, failure clears the (invalid) token via `tokenStorage.clearToken` and resolves to logged-out. `isInitializing` is true only until this resolves.

Not in this slice, per scope: no pages, no `RequireAuth`/`RequireRole` guards, `AuthProvider` is not yet mounted into `App.tsx`/the router.

Verified: `tsc --noEmit`, `eslint apps/web/src/features/auth` (0 warnings/errors), and `npm run build` all pass.

## Frontend login slice (Phase 1 — fourth frontend slice)

- `apps/web/src/App.tsx` — now wraps `RouterProvider` in `AuthProvider`, so `useAuth()` is available app-wide. This was the "mount `AuthProvider`" step deferred from the previous slice.
- `apps/web/src/app/routePaths.ts` — added `login: '/login'` and placeholder role-dashboard paths (`vendorDashboard`, `customerDashboard`, `deliveryDashboard`, `adminDashboard`). The dashboard paths are not yet registered as routes (no dashboard pages exist) — they exist so `getDefaultRoute` has real targets to return now, ready for the dashboard pages that later phases will add at those exact paths.
- `apps/web/src/app/getDefaultRoute.ts` — `getDefaultRoute(role: Role): string`, a single switch mapping each `Role` to its dashboard path (falls back to `routePaths.home` for safety). This is the one place role→route logic lives; nothing else hardcodes a redirect target.
- `apps/web/src/app/router.tsx` — added a `login` child route under `RootLayout` rendering `LoginPage`.
- `apps/web/src/features/auth/LoginForm.tsx` — presentational form only: controlled `email`/`password` inputs, calls `onSubmit(email, password)`, renders an `error` string and disables the submit button while `isSubmitting`. No knowledge of `AuthContext` or routing.
- `apps/web/src/features/auth/LoginPage.tsx` — calls `useAuth().login(...)`, then navigates to `location.state.from` if present (set by a future `RequireAuth` guard redirecting here), otherwise to `getDefaultRoute(user.role)`. Catches `ApiError` from `apiClient` to show the backend's message; falls back to a generic message for other failures.
- `apps/web/src/features/auth/AuthContext.tsx` — `login()` now returns the authenticated `User` (was `Promise<void>`) so `LoginPage` can compute the redirect target from the just-returned role without waiting on a stale render/closure of context state.

Not in this slice, per scope: no register page, no `RequireAuth`/`RequireRole` guards, no vendor/customer/delivery/admin dashboard pages (their route paths are reserved but unregistered).

Verified end-to-end against a real backend: a throwaway `postgres:16-alpine` container + `prisma migrate deploy` + the actual `apps/api` server (JWT auth unchanged), then exercised `features/auth/api.ts`'s `login`/`fetchMe`, `lib/tokenStorage.ts`, and `app/getDefaultRoute.ts` directly via `vite-node` (so `import.meta.env` resolves like it does in the real app) against that live server: register → login → `getDefaultRoute('VENDOR')` → `/vendor`, token persisted and sent back correctly on `fetchMe`, `clearToken` removes it, and a wrong-password login is correctly rejected with the backend's error message. Also confirmed `tsc --noEmit`, `eslint` (0 warnings/errors), and `npm run build` pass, and that `dist/assets/*.js` contains the expected `/api/auth/login` and `locallink.accessToken` strings. Full mouse/keyboard interaction in an actual browser wasn't verified — no headless browser is available in this environment (same limitation noted in the prior slice). All verification containers/servers/`.env` files were torn down afterward; nothing from this verification was committed.

## Frontend register slice (Phase 1 — fifth frontend slice)

- `apps/web/src/features/auth/components/RegisterForm.tsx` — presentational form only, same shape as `LoginForm`: controlled inputs (`name`, `email`, `password`, `phone`, `role`), an `error` string, and `isSubmitting` disabling the submit button. `role` is a `<select>` restricted to the three publicly-registrable roles (`CUSTOMER`, `VENDOR`, `DELIVERY_PARTNER`) — matches the backend's `publicRegistrationRoles` allowlist in `apps/api/src/routes/auth.ts`; `ADMIN` is intentionally not offered. No knowledge of `AuthContext` or routing, same as `LoginForm`. Placed under a new `components/` subfolder per this slice's scope — `LoginForm` was left where it already was (flat in `features/auth/`) since restructuring it wasn't part of this slice.
- `apps/web/src/features/auth/pages/RegisterPage.tsx` — calls `useAuth().register(...)`, then navigates to `getDefaultRoute(user.role)` on success. Catches `ApiError` from `apiClient` to surface the backend's validation message (duplicate email, weak password, invalid role, etc.) verbatim; falls back to a generic message otherwise. Same structure as `LoginPage`, placed under a new `pages/` subfolder per this slice's scope (`LoginPage` likewise left in place).
- `apps/web/src/features/auth/AuthContext.tsx` — added `register(payload): Promise<User>`, mirroring `login()` exactly: calls `features/auth/api.ts`'s `register`, persists the token via `tokenStorage.setToken`, dispatches `AUTH_SUCCESS`, and returns the new `User` so the caller can redirect off the fresh role. This was necessary plumbing for "on successful registration, `AuthContext` should authenticate the user" — not listed as a file to create in this slice's scope, but `RegisterPage` has nothing to call without it.
- `apps/web/src/app/routePaths.ts` — added `register: '/register'`.
- `apps/web/src/app/router.tsx` — added a `register` child route under `RootLayout` rendering `RegisterPage`.

No shared base component/hook was extracted between `LoginForm`/`LoginPage` and `RegisterForm`/`RegisterPage` — per scope, two forms don't justify the abstraction; the parallel structure alone keeps them consistent.

Not in this slice: no `RequireAuth`/`RequireRole` guards, no dashboards, no link/navigation between the login and register pages (each is reachable only by URL for now).

Verified end-to-end against a real backend, same method as the login slice: a throwaway `postgres:16-alpine` container + `prisma migrate deploy` + the actual `apps/api` server, then exercised `features/auth/api.ts`'s `register()`, `tokenStorage`, and `getDefaultRoute` via `vite-node` against that live server: successful registration returns `{ user, accessToken }`, token persists, `getDefaultRoute('VENDOR')` → `/vendor`, empty-string phone normalizes to `null` (matches backend behavior), and three backend validation paths were confirmed to surface through `ApiError.message` exactly as `RegisterPage` would display them — duplicate email (409, "An account already exists for this email"), weak password (400, "Password must contain at least 8 characters"), and an `ADMIN` registration attempt (400, "Invalid registration role"). Also confirmed `tsc --noEmit`, `eslint` (0 warnings/errors), and `npm run build` pass. Full mouse/keyboard interaction in an actual browser wasn't verified — no headless browser is available in this environment. All verification containers/servers/`.env` files were torn down afterward; nothing from this verification was committed.

## Frontend RequireAuth slice (Phase 1 — sixth frontend slice)

- `apps/web/src/routes/RouteLoadingFallback.tsx` — minimal loading placeholder (`<p>Loading…</p>`), no props, no logic.
- `apps/web/src/routes/RequireAuth.tsx` — layout-route guard reading `useAuth()`'s `isInitializing`/`isAuthenticated`: renders `RouteLoadingFallback` while `isInitializing` is true, redirects to `routePaths.login` with `state={{ from: location }}` (via `useLocation()`) when unauthenticated, otherwise renders `<Outlet />`. Ordering the `isInitializing` check first is what prevents the redirect flicker — the component never reaches the "redirect" branch until rehydration has actually resolved.
- `apps/web/src/features/auth/LoginPage.tsx` — `LoginLocationState.from` changed from `string` to `Location` (imported from `react-router-dom`), since `RequireAuth` now passes the whole `location` object as `from`, not just a path string. `navigate(state?.from ?? getDefaultRoute(user.role), ...)` already accepted this unchanged — `Location` is structurally assignable to react-router's `To` type.

No `AuthContext` behavior changed — `isInitializing` already existed from the earlier auth-context slice and was sufficient.

Not in this slice, per scope: no `RequireRole`, no dashboard pages, no navigation/links, no layouts, and `RequireAuth` is not wired into `router.tsx` — there are no protected routes to wrap yet, so wiring it in would have nothing to guard.

Verified with the same real-backend method as prior slices (throwaway `postgres:16-alpine` container + `prisma migrate deploy` + the actual `apps/api` server), but this slice needed genuine DOM rendering (not just API-call verification) to prove the loading/redirect timing, so a jsdom + `react-dom/client` harness was built for this session only: it mounted the real `AuthProvider` + `RequireAuth` + `react-router-dom`'s `MemoryRouter` in a jsdom document and recorded every DOM snapshot over time for four scenarios — missing token, valid token, invalid/garbage token, and valid token with an artificially delayed `/api/auth/me` response (to force-capture the loading frame, since the real request normally resolves faster than is observable). All 9 assertions passed: missing/invalid tokens redirect to the login route and never render protected content; a valid token renders protected content and the login route is never rendered at any captured point (no flash); with a deliberately slow `/me`, `RouteLoadingFallback` is confirmed actually on screen while the request is in flight, and still no login flash before the session resolves. `jsdom` was installed only into a scratchpad directory (never added to any `package.json`/lockfile) and symlinked into `apps/web/node_modules` for the duration of the test, then removed. Also confirmed `tsc --noEmit`, `eslint` (0 warnings/errors), and `npm run build` pass. All verification containers/servers/symlinks/`.env` files were torn down afterward; nothing from this verification was committed.

## Role-gated routing wired in; Vendor store/product and Customer browsing/cart/checkout landed (Phase 1 completion + Phase 2–4)

This work landed outside this doc's slice-by-slice narration (PR "Vendor and customer routes") — documenting it here since `docs/current.md` wasn't updated alongside it beyond the CORS note above.

- `apps/web/src/routes/RequireRole.tsx` — new guard: `<RequireRole allowedRoles={Role[]} />` reads `useAuth().user` and renders `<Outlet />` if the user's role is in `allowedRoles`, otherwise `<Navigate to={routePaths.home} replace />`. Unlike `RequireAuth`, it does not check `isInitializing` itself — it's meant to be nested *inside* a `RequireAuth` subtree, which has already resolved loading/auth by the time `RequireRole` runs.
- `apps/web/src/app/router.tsx` — `RequireAuth` and `RequireRole` are now both wired in: a `RequireAuth` layout route wraps two `RequireRole`-gated branches, `/customer` (`allowedRoles={['CUSTOMER']}` → `CustomerDashboard`) and `/vendor` (`allowedRoles={['VENDOR']}` → `VendorDashboard`). Phase 1's "gate routes/UI by role" is now actually done, not just scaffolded.
- `apps/api/src/middleware/cors.ts` + `apps/api/.env.example` — CORS middleware allowing local Vite origins by default, configurable via `CORS_ALLOWED_ORIGINS`.
- `apps/api/src/routes/vendor.ts` (Phase 2 backend) — `requireAuth, requireRole(Role.VENDOR)` applied to the whole router. `GET/POST /stores`, `PATCH/DELETE /stores/:storeId` (soft-delete via `isActive: false`), `GET/POST /stores/:storeId/products`, `PATCH/DELETE /products/:productId` (soft-delete). Every store/product lookup is scoped by `vendorId: req.user!.id` (stores) or `store: { vendorId: req.user!.id }` (products) — a vendor can't see or touch another vendor's data; an unowned ID reads as a plain 404, not a 403.
- `apps/web/src/features/vendor/{types,api,VendorDashboard}.tsx` (Phase 2 frontend) — store create/edit form, product create/edit form scoped to the selected store, deactivate buttons for both (with a native `confirm()` prompt), reflecting changes without a full reload.
- `apps/api/src/routes/customer.ts` (Phase 3 + Phase 4 backend) — `requireAuth, requireRole(Role.CUSTOMER)` applied to the whole router.
  - Phase 3: `GET /stores` (active stores only), `GET /stores/:storeId` (store + its active products), `GET /stores/:storeId/products`; `GET/POST /cart`, `POST /cart/items` (rejects with 409 if the cart already holds items from a different store — `getCartPayload` derives the cart's current store from its first item), `PATCH /cart/items/:itemId` (quantity 0 deletes the line), `DELETE /cart/items/:itemId`.
  - Phase 4: `POST /orders` — re-validates the cart is single-store and every item's product/store is still active (defends against a product being deactivated between add-to-cart and checkout), computes `total` server-side from current product prices (never trusts a client-supplied total), and creates the `Order`+`OrderItem`s and clears the cart's `CartItem`s inside one `prisma.$transaction`. `GET /orders`, `GET /orders/:orderId` list/read the customer's own orders.
- `apps/web/src/features/customer/{types,api,CustomerDashboard}.tsx` (Phase 3 + Phase 4 frontend) — store list, selected-store product catalog with an "Add to cart" quantity control, a cart panel (quantity edit / remove / running total), a checkout button that calls `POST /orders` and clears local cart state on success, and an order history list. Cart state is server-backed (`Cart`/`CartItem` rows keyed by `userId`), so it survives a page refresh via the bootstrap `getCart()` call — there's no separate client-side cart persistence layer.

Known gap this surfaced: until this session's Phase 5 work (below), orders had no vendor-facing read path at all — `vendor.ts` had no `/orders` route — so Phase 4's Definition of Done ("order is visible to the owning vendor immediately after creation") wasn't actually met despite checkout working. Fixed by the Phase 5 slice.

## Vendor order fulfillment (Phase 5)

- `apps/api/src/routes/vendor.ts` — added, scoped to `store: { vendorId: req.user!.id }` throughout:
  - `GET /orders` — every order across all of the vendor's stores, most recent first, including customer (`id`, `name`, `phone`) and item/product summaries.
  - `PATCH /orders/:orderId/accept` — `PENDING` → `ACCEPTED`.
  - `PATCH /orders/:orderId/reject` — `PENDING` → `REJECTED`.
  - `PATCH /orders/:orderId/preparing` — `ACCEPTED` → `PREPARING`.
  - `PATCH /orders/:orderId/ready-for-pickup` — `PREPARING` → `READY_FOR_PICKUP`, and atomically creates the order's `DeliveryRequest` inside a `prisma.$transaction` (order status update + `deliveryRequest.create` together). Each transition handler first does an ownership-scoped lookup (404 if the order doesn't belong to this vendor) then checks the order is in the required prior status (409 otherwise) — so a vendor can never act on another vendor's order, and out-of-order transitions (e.g. `preparing` before `accept`) are rejected. The existing `orderId @unique` constraint on `DeliveryRequest` (see the Database schema section above) is the backstop against a duplicate delivery request under a race between two concurrent `ready-for-pickup` calls; the second one's `deliveryRequest.create` throws Prisma error `P2002`, which is caught and turned into a 409 rather than a 500.
- `apps/web/src/features/vendor/types.ts` — added `OrderItem`/`Order` (mirrors the vendor order response shape, including `customer`).
- `apps/web/src/features/vendor/api.ts` — added `listOrders`, `acceptOrder`, `rejectOrder`, `markOrderPreparing`, `markOrderReadyForPickup`, all thin `apiClient` wrappers.
- `apps/web/src/features/vendor/VendorDashboard.tsx` — added an "Orders" section (third column in the dashboard grid) listing every order across the vendor's stores with its status and total, and status-conditional action buttons (`PENDING` → Accept/Reject, `ACCEPTED` → Start preparing, `PREPARING` → Ready for pickup). Actions refetch the order list on success; failures surface the backend's `ApiError` message the same way the rest of the dashboard does.

Not in this slice: delivery-partner-facing endpoints/UI (Phase 6 — offering the `READY_FOR_PICKUP` job, first-eligible-acceptance assignment, pickup/delivery transitions) are still entirely unbuilt; the `DeliveryRequest` row this phase creates just sits at `PENDING` with no consumer yet.

Verified end-to-end against a real backend (throwaway `postgres:16-alpine` container + `prisma migrate deploy` + the actual `apps/api` server): registered a vendor and a customer, created a store and product, added to cart and checked out, then drove the resulting order through the full vendor lifecycle via `curl` — confirmed `GET /api/vendor/orders` shows the order immediately after checkout (closing the Phase 4 DoD gap noted above); `preparing` before `accept` correctly 409s; `accept` → `preparing` → `ready-for-pickup` each succeed once and correctly 409 on repeat; exactly one `delivery_requests` row exists after `ready-for-pickup` (checked directly via `psql`); a second, unrelated vendor sees an empty order list and gets 404 (not 403 — consistent with the store/product routes) when trying to act on an order it doesn't own; and a reject on a separate `PENDING` order succeeds. Also confirmed `tsc --noEmit`, `eslint` (0 new errors — 2 pre-existing unrelated errors in `auth.ts`/`server.ts` and 1 pre-existing unused-import error in `features/customer/api.ts` were already present before this session and are untouched), and `npm run build` pass for both `apps/api` and `apps/web`. All verification containers/servers were torn down afterward; nothing from this verification was committed.

## Delivery partner flow (Phase 6)

- `apps/api/src/routes/delivery.ts` — new router, `requireAuth, requireRole(Role.DELIVERY_PARTNER)` applied to the whole router, mounted at `/api/delivery` in `apps/api/src/server.ts`:
  - `GET /jobs` — every `DeliveryRequest` still `status: PENDING` (i.e. not yet claimed), oldest first, with the order's store/customer summary. Visible to every delivery partner — there's no per-partner offer/assignment queue yet, just "first to claim it wins."
  - `PATCH /jobs/:deliveryRequestId/accept` — the concurrency-safe claim. Inside one `prisma.$transaction`: a conditional `deliveryRequest.updateMany({ where: { id, status: PENDING, deliveryPartnerId: null }, data: { status: ACCEPTED, deliveryPartnerId } })` is the atomic compare-and-set — Postgres serializes concurrent `UPDATE`s against the same row via the row lock, so only the request that acquires the lock while the row is still `PENDING` updates it; every later concurrent request re-evaluates the `WHERE` clause against the now-`ACCEPTED` row and matches zero rows. `claimed.count === 0` (lost the race, or the job no longer exists/is already taken) → the transaction returns `null` and the route responds 409. On a win, the same transaction updates the `Order` (`deliveryPartnerId`, `status: DELIVERY_ACCEPTED`) so the delivery request and the order never disagree about who's assigned.
  - `GET /orders` — orders assigned to the current partner (`deliveryPartnerId: req.user!.id`), most recently updated first — covers accepted, picked-up, and delivered in one list.
  - `PATCH /orders/:orderId/picked-up` — `DELIVERY_ACCEPTED` → `PICKED_UP`, ownership-scoped via `findAssignedOrder` (looks up by `id` **and** `deliveryPartnerId` together, so an order assigned to someone else reads as a plain 404, matching the vendor routes' convention).
  - `PATCH /orders/:orderId/delivered` — `PICKED_UP` → `DELIVERED`, same ownership scoping.
  - `OrderStatus.SEARCHING_DELIVERY` (defined in the schema) is not used anywhere in this flow — the order sits at `READY_FOR_PICKUP` from the moment the vendor marks it ready (Phase 5) until a partner accepts, at which point it jumps straight to `DELIVERY_ACCEPTED`. Flagging this in case a later phase intends `SEARCHING_DELIVERY` to mean something distinct (e.g. "delivery request exists but no partner has looked yet") — as built, there's no state that maps to it.
- `apps/web/src/features/delivery/types.ts` — `Order` (store/customer summary shape returned by every delivery endpoint) and `Job` (wraps `Order` with the delivery request's own `id`/`status`/`createdAt`).
- `apps/web/src/features/delivery/api.ts` — `listJobs`, `acceptJob`, `listMyOrders`, `markPickedUp`, `markDelivered`; thin `apiClient` wrappers, same pattern as `features/vendor/api.ts`.
- `apps/web/src/features/delivery/DeliveryDashboard.tsx` — two-column layout matching `VendorDashboard`/`CustomerDashboard`'s style: "Available jobs" (Accept button per job) and "My deliveries" (status-conditional "Mark picked up"/"Mark delivered" buttons). Accepting refetches both lists (a lost race removes the job from "Available jobs" without a page reload) and shows the backend's `ApiError` message on a lost race rather than a generic failure.
- `apps/web/src/app/router.tsx` — added a `RequireRole allowedRoles={['DELIVERY_PARTNER']}` branch under the existing `RequireAuth` layout route, gating `/delivery` → `DeliveryDashboard` (mirrors how `/customer` and `/vendor` are already gated).

Verified end-to-end against a real backend (throwaway `postgres:16-alpine` container + `prisma migrate deploy` + the actual `apps/api` server): registered a vendor, a customer, and two delivery partners; built a store/product, checked out an order, and drove it through the vendor lifecycle to `READY_FOR_PICKUP` (creating the delivery request per Phase 5). Confirmed both partners see the resulting job via `GET /jobs`. Fired 8 concurrent `accept` requests at the same job (4 from each partner, via backgrounded `curl` + `wait`) — exactly 1 returned 200, the other 7 all returned 409 "This job has already been accepted by another delivery partner"; confirmed via `psql` that the `delivery_requests` row and the `orders` row agree on exactly one `deliveryPartnerId`. Then confirmed the losing partner gets 404 (not 403) trying to act on the order it doesn't own, `delivered` before `picked-up` correctly 409s, and the full `picked-up` → `delivered` sequence succeeds and removes the job from every partner's available-jobs list. Also confirmed `tsc --noEmit`, `eslint` (0 new errors — `delivery.ts` and `features/delivery/` are clean; the pre-existing unrelated errors in `auth.ts`/`server.ts`/`customer/api.ts` are untouched), and `npm run build` pass for both `apps/api` and `apps/web`. All verification containers/servers were torn down afterward; nothing from this verification was committed.

## Next up

Per `TASKS.md`, Phases 1–5 are now done. Phase 6 (Delivery Partner Flow) is next: offering `READY_FOR_PICKUP` jobs to delivery partners, concurrency-safe first-eligible-acceptance assignment, and pickup/delivery status transitions — both backend endpoints and a delivery dashboard UI. Each phase in `TASKS.md` has an explicit Definition of Done checklist to verify against before moving to the next phase.
