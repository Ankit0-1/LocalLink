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

## Next up

Per `TASKS.md`, Phase 1 backend and frontend login/register views are done, and `RequireAuth` exists but is unused. Remaining Phase 1 frontend work: `RequireRole`, at least one protected route to actually wire `RequireAuth` into `router.tsx`, and (loosely) some way to reach `/login`/`/register` via UI navigation rather than only by typing the URL. Each phase in `TASKS.md` now has an explicit Definition of Done checklist to verify against before moving to the next phase.
