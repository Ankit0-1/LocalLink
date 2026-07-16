# API

All protected endpoints require a JWT. Controllers validate input and delegate business rules to services. JWTs expire after 24 hours; refresh tokens are not part of the MVP. The admin account is seeded rather than registered through the public API.

Responses use this JSON envelope:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "message": "..." }
```

## Authentication

- `POST /auth/register`
- `POST /auth/login`

## Stores

- `GET /stores` — customer-visible store list
- `GET /stores/:storeId` — store and its products
- `POST /vendor/stores` — create a store
- `PATCH /vendor/stores/:storeId` — update an owned store
- `DELETE /vendor/stores/:storeId` — soft-delete an owned store (set `isActive` to `false`)

Only a vendor may create stores, and only the owning vendor may update or soft-delete them. Customer store listings and catalog views include only active stores and products.

## Products

- `GET /stores/:storeId/products`
- `GET /products/:productId`
- `POST /vendor/stores/:storeId/products`
- `PATCH /vendor/products/:productId`
- `DELETE /vendor/products/:productId` — soft-delete (set `isActive` to `false`)

Vendor product mutations are authorized through the product's store owner.

## Orders

- `POST /orders` — create an order for one selected store
- `GET /orders` — current customer's orders
- `GET /orders/:orderId` — an authorized order view
- `GET /vendor/orders` — orders for stores owned by the current vendor
- `POST /vendor/orders/:orderId/accept`
- `POST /vendor/orders/:orderId/reject`
- `POST /vendor/orders/:orderId/preparing`
- `POST /vendor/orders/:orderId/ready-for-pickup`

Order creation rejects items from more than one store. Vendor actions are limited to the vendor that owns `order.storeId`.

## Delivery

- `GET /delivery/requests` — ready-for-pickup delivery jobs
- `POST /delivery/requests/:requestId/accept`
- `POST /delivery/orders/:orderId/pickup`
- `POST /delivery/orders/:orderId/deliver`

Delivery jobs are unavailable until the corresponding order is `READY_FOR_PICKUP`.

When the vendor marks an order ready for pickup, the service atomically sets it to `READY_FOR_PICKUP`, creates its one `DeliveryRequest` with status `PENDING`, transitions the order to `SEARCHING_DELIVERY`, and emits the delivery notification. The delivery-request acceptance endpoint accepts only that pending request and assigns its delivery partner to the order.

## Admin

- `GET /admin/dashboard`
- `GET /admin/users`
- `GET /admin/stores`
- `GET /admin/orders`
