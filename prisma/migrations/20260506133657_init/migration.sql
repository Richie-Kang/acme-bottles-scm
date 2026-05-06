-- CreateEnum
CREATE TYPE "Product" AS ENUM ('ONE_LITER', 'ONE_GALLON');

-- CreateEnum
CREATE TYPE "Material" AS ENUM ('PET_RESIN', 'PTA', 'EG');

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "product" "Product" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "expectedEta" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyOrder" (
    "id" TEXT NOT NULL,
    "material" "Material" NOT NULL,
    "quantityKg" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eta" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_orderDate_idx" ON "PurchaseOrder"("orderDate");

-- CreateIndex
CREATE INDEX "SupplyOrder_eta_idx" ON "SupplyOrder"("eta");
