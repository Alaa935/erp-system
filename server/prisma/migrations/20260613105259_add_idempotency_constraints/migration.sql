-- Add @unique on Supplier.name
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_name_key" UNIQUE ("name");

-- Add @unique on Warehouse.name
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_name_key" UNIQUE ("name");

-- Add @unique on Branch.name
ALTER TABLE "branches" ADD CONSTRAINT "branches_name_key" UNIQUE ("name");

-- Add @unique on TaxConfig.name
ALTER TABLE "tax_configs" ADD CONSTRAINT "tax_configs_name_key" UNIQUE ("name");

-- Add @unique on Vehicle.plateNumber
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_plateNumber_key" UNIQUE ("plateNumber");

-- Make SalesRep.phone nullable and add @unique
-- First remove the default empty string, set null where empty, then add unique
UPDATE "sales_reps" SET "phone" = NULL WHERE "phone" = '';
ALTER TABLE "sales_reps" ADD CONSTRAINT "sales_reps_phone_key" UNIQUE ("phone");

-- Make Employee.email nullable and add @unique
UPDATE "employees" SET "email" = NULL WHERE "email" = '';
ALTER TABLE "employees" ADD CONSTRAINT "employees_email_key" UNIQUE ("email");

-- Add @unique on StockTransfer.transferNumber
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_transferNumber_key" UNIQUE ("transferNumber");

-- Add collectionNumber to PaymentCollection
ALTER TABLE "payment_collections" ADD COLUMN "collectionNumber" TEXT;
UPDATE "payment_collections" SET "collectionNumber" = CONCAT('COL-', LPAD(CAST("id" AS TEXT), 8, '0'));
ALTER TABLE "payment_collections" ALTER COLUMN "collectionNumber" SET NOT NULL;
ALTER TABLE "payment_collections" ADD CONSTRAINT "payment_collections_collectionNumber_key" UNIQUE ("collectionNumber");

-- Add requestNumber to StockRequest
ALTER TABLE "stock_requests" ADD COLUMN "requestNumber" TEXT;
UPDATE "stock_requests" SET "requestNumber" = CONCAT('SR-', LPAD(CAST("id" AS TEXT), 8, '0'));
ALTER TABLE "stock_requests" ALTER COLUMN "requestNumber" SET NOT NULL;
ALTER TABLE "stock_requests" ADD CONSTRAINT "stock_requests_requestNumber_key" UNIQUE ("requestNumber");

-- Add transactionNumber to FinancialTransaction
ALTER TABLE "financial_transactions" ADD COLUMN "transactionNumber" TEXT;
UPDATE "financial_transactions" SET "transactionNumber" = CONCAT('TXN-', LPAD(CAST("id" AS TEXT), 8, '0'));
ALTER TABLE "financial_transactions" ALTER COLUMN "transactionNumber" SET NOT NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_transactionNumber_key" UNIQUE ("transactionNumber");
