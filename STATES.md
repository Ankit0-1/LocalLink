# Order States

```text
PENDING
  ├─ vendor rejects → REJECTED
  └─ vendor accepts → ACCEPTED
                     ↓
                 PREPARING
                     ↓
             READY_FOR_PICKUP
                     ↓
            SEARCHING_DELIVERY
                     ↓
            DELIVERY_ACCEPTED
                     ↓
                 PICKED_UP
                     ↓
                 DELIVERED
                     ↓
                 COMPLETED
```

The vendor's ready-for-pickup action atomically records `READY_FOR_PICKUP`, creates the order's single `PENDING` delivery request, advances the order to `SEARCHING_DELIVERY`, and notifies delivery partners. `READY_FOR_PICKUP` is therefore an atomic intermediate transition rather than a stable state exposed for a separate action. A delivery partner accepting the request changes the order to `DELIVERY_ACCEPTED`. Pickup and delivery change it to `PICKED_UP` and `DELIVERED`; the system then automatically transitions `DELIVERED` to `COMPLETED`.

`PENDING` orders may be cancelled by the customer and become `CANCELLED`; cancellation is not available after vendor acceptance in the MVP. `REJECTED`, `CANCELLED`, and `COMPLETED` are terminal states.

There are no `SEARCHING_RETAILER` or `RETAILER_ACCEPTED` states.
