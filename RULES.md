# Engineering and Domain Rules

- Use TypeScript, Prisma, and clean architecture; do not use raw SQL.
- Keep controllers thin; business logic belongs in services.
- Validate every request body and never trust frontend input.
- Enforce JWT authentication and role-based authorization on protected actions.
- A vendor may access only stores, products, and orders belonging to that vendor.
- A product must belong to the selected store; an order must contain products from exactly one store.
- Every order belongs to exactly one store.
- Only the vendor who owns the order's store may accept, reject, prepare, or mark it ready for pickup.
- Do not create or expose a delivery request before `READY_FOR_PICKUP`.
- Only one delivery partner may accept a delivery request; enforce this transactionally.
- Each order has exactly one delivery request. It is created as `PENDING` only by the ready-for-pickup action.
- The ready-for-pickup action atomically records readiness, creates the delivery request, advances the order to `SEARCHING_DELIVERY`, and emits the delivery notification.
- Products and stores use soft deletion through `isActive`; do not hard-delete them.
- JWTs expire after 24 hours. Do not implement refresh tokens; provision the MVP admin through seeding.
- Return `{ success: true, data }` for success and `{ success: false, message }` for errors.
- Return consistent JSON responses, keep files small, and avoid duplicated code.
- Do not implement retailer broadcasts or `RetailerRequest` behavior.
