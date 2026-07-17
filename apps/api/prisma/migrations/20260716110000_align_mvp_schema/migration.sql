-- AlterEnum
ALTER TYPE "DeliveryRequestStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "products" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "stores" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- DropIndex
DROP INDEX "delivery_requests_orderId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "delivery_requests_orderId_key" ON "delivery_requests"("orderId");
