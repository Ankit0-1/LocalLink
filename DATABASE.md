# Database Model

## Users

`id`, `name`, `email`, `passwordHash`, `role`, `createdAt`, `updatedAt`

Roles are `CUSTOMER`, `VENDOR`, `DELIVERY_PARTNER`, and `ADMIN`.

## Stores

`id`, `vendorId`, `name`, `description`, `address`, `image`, `isActive`, `createdAt`, `updatedAt`

Each store belongs to one vendor (`Stores.vendorId → Users.id`). A vendor may own multiple stores. `isActive` implements soft deletion; customer-facing queries return active stores only.

## Products

`id`, `storeId`, `name`, `price`, `description`, `image`, `isActive`, `createdAt`, `updatedAt`

Each product belongs to one store (`Products.storeId → Stores.id`). `isActive` implements soft deletion; customer-facing queries return active products only.

## Orders

`id`, `customerId`, `storeId`, `deliveryPartnerId`, `status`, `total`, `createdAt`, `updatedAt`

Each order belongs to exactly one customer and one store. `deliveryPartnerId` is null until a delivery partner accepts the ready-for-pickup delivery job.

## OrderItems

`id`, `orderId`, `productId`, `quantity`, `price`

Each item belongs to one order and references a product. The order service must ensure every referenced product belongs to the order's store.

## DeliveryRequests

`id`, `orderId`, `deliveryPartnerId`, `status`, `createdAt`, `updatedAt`

A delivery request is created only by the owning vendor's ready-for-pickup action. Each order has exactly one delivery request (`orderId` is unique). Its status is one of `PENDING`, `ACCEPTED`, `EXPIRED`, or `CANCELLED`. The ready-for-pickup transaction creates it as `PENDING`, moves the order to `SEARCHING_DELIVERY`, and makes the job available. Acceptance atomically changes it to `ACCEPTED` and assigns the delivery partner to the order.

## Relationships

```text
User (Vendor) 1 ── * Store 1 ── * Product
User (Customer) 1 ── * Order * ── 1 Store
Order 1 ── * OrderItem * ── 1 Product
Order 1 ── 1 DeliveryRequest * ── 1 User (Delivery Partner)
```

There is no `RetailerRequest` entity.
