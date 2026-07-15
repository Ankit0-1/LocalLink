# Database Model

## Users

`id`, `name`, `email`, `passwordHash`, `role`, `createdAt`, `updatedAt`

Roles are `CUSTOMER`, `VENDOR`, `DELIVERY_PARTNER`, and `ADMIN`.

## Stores

`id`, `vendorId`, `name`, `description`, `address`, `image`, `createdAt`, `updatedAt`

Each store belongs to one vendor (`Stores.vendorId → Users.id`). A vendor may own multiple stores.

## Products

`id`, `storeId`, `name`, `price`, `description`, `image`, `createdAt`, `updatedAt`

Each product belongs to one store (`Products.storeId → Stores.id`).

## Orders

`id`, `customerId`, `storeId`, `deliveryPartnerId`, `status`, `total`, `createdAt`, `updatedAt`

Each order belongs to exactly one customer and one store. `deliveryPartnerId` is null until a delivery partner accepts the ready-for-pickup delivery job.

## OrderItems

`id`, `orderId`, `productId`, `quantity`, `price`

Each item belongs to one order and references a product. The order service must ensure every referenced product belongs to the order's store.

## DeliveryRequests

`id`, `orderId`, `deliveryPartnerId`, `status`, `createdAt`, `updatedAt`

A delivery request is created or made available only for an order in `READY_FOR_PICKUP`. At most one accepted request may exist per order.

## Relationships

```text
User (Vendor) 1 ── * Store 1 ── * Product
User (Customer) 1 ── * Order * ── 1 Store
Order 1 ── * OrderItem * ── 1 Product
Order 1 ── * DeliveryRequest * ── 1 User (Delivery Partner)
```

There is no `RetailerRequest` entity.
