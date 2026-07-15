# API

All protected endpoints require a JWT. Controllers validate input and delegate business rules to services. Responses use a consistent JSON envelope.

## Authentication

- `POST /auth/register`
- `POST /auth/login`

## Stores

- `GET /stores` — customer-visible store list
- `GET /stores/:storeId` — store and its products
- `POST /vendor/stores` — create a store
- `PATCH /vendor/stores/:storeId` — update an owned store

Only a vendor may create stores, and only the owning vendor may update them.

## Products

- `GET /stores/:storeId/products`
- `GET /products/:productId`
- `POST /vendor/stores/:storeId/products`
- `PATCH /vendor/products/:productId`
- `DELETE /vendor/products/:productId`

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

## Admin

- `GET /admin/dashboard`
- `GET /admin/users`
- `GET /admin/stores`
- `GET /admin/orders`
