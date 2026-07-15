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

`delivery-request-created` is emitted only after the order becomes `READY_FOR_PICKUP`.

## Admin

- `dashboard-updated`
- `order-status-updated`

Admins receive aggregate and order status updates.
