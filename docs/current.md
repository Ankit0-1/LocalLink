# Current State

## Database schema

All models use PostgreSQL native `uuid` primary/foreign keys (`@db.Uuid`, `dbgenerated("gen_random_uuid()")`), not `cuid()`. This was migrated in `use_uuid_identifiers` / `use_db_uuid_defaults`.

`DeliveryRequest.orderId` is `@unique` — each order may have exactly one delivery request, matching the "atomically creates the order's one delivery request" invariant in the README. This constraint was accidentally dropped when `use_uuid_identifiers` rebuilt the column as a plain (non-unique) index, and was restored by migration `20260716120000_restore_delivery_request_uniqueness`.

Verified 2026-07-17 by applying all 7 migrations to a throwaway Postgres 16 container: `prisma migrate deploy` succeeds, `prisma migrate diff` against the schema shows zero drift, and `prisma generate` succeeds.

Known minor issue (not fixed, pre-existing, low priority): `DeliveryRequest` carries both a `@unique` constraint and a separate `@@index([orderId])` on the same column — the plain index is redundant since the unique index already serves lookups.

## Authentication (Phase 1 — backend complete)

`POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/auth/me` are implemented (`apps/api/src/routes/auth.ts`), backed by `requireAuth` / `requireRole` middleware (`apps/api/src/middleware/auth.ts`) and JWT helpers (`apps/api/src/lib/auth.ts`, 1-day expiry, `sub`/`role` claims).

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

## Next up

Per `TASKS.md`, Phase 1 backend is done. Remaining Phase 1 frontend work: mount `AuthProvider` in the app, build login/register pages, and add `RequireAuth`/`RequireRole` route guards. Each phase in `TASKS.md` now has an explicit Definition of Done checklist to verify against before moving to the next phase.
