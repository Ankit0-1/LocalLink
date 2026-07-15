# Architecture Change: Vendor-Owned Store Marketplace

The prior retailer-broadcast design has been retired. LocalLink now uses direct store fulfillment.

- Vendors own stores.
- Stores own products.
- Customers choose a store before adding products to a cart.
- A cart and order contain products from one store only.
- Every order belongs to exactly one store.
- Only the vendor who owns that store may accept or reject the order.
- Delivery assignment starts only after the vendor marks the order ready for pickup.
- `RetailerRequest` and retailer broadcasts are removed completely.

Inventory management, product approval, and maps remain outside the MVP.
