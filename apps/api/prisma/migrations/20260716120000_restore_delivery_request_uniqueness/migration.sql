-- The UUID conversion rebuilds the delivery-request order index. Restore the
-- one-request-per-order invariant required by the MVP.
CREATE UNIQUE INDEX "delivery_requests_orderId_key" ON "delivery_requests"("orderId");
