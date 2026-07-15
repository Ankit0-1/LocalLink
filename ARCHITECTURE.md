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

The order service validates that all order items belong to the selected store. Authorization derives vendor order access from `order.store.vendorId`; no retailer-request or retailer-broadcast service exists. The delivery-assignment service can create or expose a delivery job only when the order state is `READY_FOR_PICKUP`.
