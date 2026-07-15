# Architecture Decisions

## Direct store fulfillment

Orders belong to a chosen store rather than being broadcast to retailers. This makes fulfillment authorization deterministic: the store's owning vendor is the only actor who may accept, reject, prepare, or ready that order.

## Single-store cart

A cart is limited to one store so that each order has one vendor fulfillment boundary, one pickup location, and one delivery lifecycle.

## Deferred delivery assignment

Delivery matching starts only at `READY_FOR_PICKUP`, preventing delivery partners from accepting jobs for orders that are not yet prepared.

## Technology

Prisma supports the relational ownership model, Socket.IO delivers live role-scoped updates, React enables fast UI development, and JWT supports stateless authorization.
