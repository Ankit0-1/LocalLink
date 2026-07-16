# Architecture

```text
React + TypeScript + Tailwind clients
  Customer | Vendor | Delivery Partner | Admin
                    |
              REST API + Socket.IO
                    |
           Express controllers and middleware
                    |
                 Service layer
  Store ownership | Product catalog | Order lifecycle | Delivery assignment
                    |
                Prisma ORM
                    |
                PostgreSQL
```

## Ownership and fulfillment boundaries

```text
Vendor ─owns→ Store ─owns→ Product
                    └─owns→ Order ─creates after ready→ Delivery request
Customer ─chooses→ Store ─places→ Order
```

The order service validates that all order items belong to the selected store. Authorization derives vendor order access from `order.store.vendorId`; no retailer-request or retailer-broadcast service exists. The vendor's ready-for-pickup action atomically creates the order's one pending delivery request, advances the order to `SEARCHING_DELIVERY`, and exposes the delivery job.
