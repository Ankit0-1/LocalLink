# Socket Events

Events are emitted only to authorized role- and resource-scoped rooms.

## Customer

- `order-created`
- `order-status-updated`

The customer receives events only for their own orders.

## Vendor

- `vendor-order-created`
- `vendor-order-status-updated`

Events are sent only to the vendor who owns the order's store. There is no retailer broadcast event.

## Delivery partner

- `delivery-request-created`
- `delivery-request-assigned`
- `delivery-order-picked-up`
- `delivery-order-delivered`

The vendor's ready-for-pickup action atomically creates the single pending delivery request, advances the order to `SEARCHING_DELIVERY`, and emits `delivery-request-created`. There is no separate delivery notification before that transaction completes.

## Admin

- `dashboard-updated`
- `order-status-updated`

Admins receive aggregate and order status updates.
