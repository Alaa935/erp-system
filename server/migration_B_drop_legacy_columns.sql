-- Migration B: Drop legacy snake_case created_at/updated_at columns (if they exist)
-- Run this ONLY after confirming these columns exist in production
-- Check first: SELECT column_name FROM information_schema.columns WHERE table_name = '<table>' AND column_name IN ('created_at', 'updated_at');

-- Items table
ALTER TABLE items DROP COLUMN IF EXISTS created_at;
ALTER TABLE items DROP COLUMN IF EXISTS updated_at;

-- Suppliers table
ALTER TABLE suppliers DROP COLUMN IF EXISTS created_at;

-- Customers table
ALTER TABLE customers DROP COLUMN IF EXISTS created_at;

-- Sales reps table
ALTER TABLE sales_reps DROP COLUMN IF EXISTS created_at;

-- Branches table
ALTER TABLE branches DROP COLUMN IF EXISTS created_at;

-- Tax configs table
ALTER TABLE tax_configs DROP COLUMN IF EXISTS created_at;
ALTER TABLE tax_configs DROP COLUMN IF EXISTS updated_at;

-- Verify no snake_case columns remain
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name IN ('created_at', 'updated_at')
ORDER BY table_name, column_name;
