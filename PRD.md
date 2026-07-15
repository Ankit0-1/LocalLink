# Product Requirements

## Goal

Build a grocery marketplace that connects customers with vendor-owned stores and delivery partners.

## Marketplace rules

- A vendor owns one or more stores.
- A store owns its products.
- A customer selects a store before adding products to a cart.
- A cart and its resulting order contain products from exactly one store.
- Every order belongs to exactly one store.
- Only the owning store's vendor can accept or reject that order.
- Delivery assignment starts only after the vendor marks the order ready for pickup.

## Roles and capabilities

### Customer

Register and log in; browse stores and their products; select one store; manage a single-store cart; check out; and track the order.

### Vendor

Register and log in; create and edit stores; create, edit, and delete products belonging to owned stores; receive orders for owned stores; accept or reject them; prepare accepted orders; and mark them ready for pickup.

### Delivery partner

Register and log in; receive delivery jobs only for ready-for-pickup orders; accept a job; mark pickup; and mark delivery.

### Admin

View dashboard summaries, users, stores, orders, and current order states.

## Success criteria

1. A vendor creates a store and adds products.
2. A customer chooses that store and places a single-store order.
3. Only that store's vendor receives, accepts, or rejects the order.
4. The vendor marks the accepted order ready for pickup.
5. Delivery partners receive the resulting delivery job and one partner accepts it.
6. The customer and admin receive live order updates through completion.

## Out of scope

Maps, inventory management, payments, OTP, coupons, reviews, ratings, chat, analytics, and product approval.
