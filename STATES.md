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

`SEARCHING_DELIVERY` begins only after the owning vendor marks the order `READY_FOR_PICKUP`. `PENDING` orders may be cancelled by the customer and become `CANCELLED`; cancellation is not available after vendor acceptance in the MVP.

There are no `SEARCHING_RETAILER` or `RETAILER_ACCEPTED` states.
