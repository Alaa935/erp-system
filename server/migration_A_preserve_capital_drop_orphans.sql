-- Migration A: Preserve capital value, then drop orphan tables
-- Run this AFTER migration C (idempotency constraints) is applied and backend is stable

-- Step 1: Preserve capital from orphan company_settings into financial_transactions
INSERT INTO financial_transactions (type, category, amount, description, transactionNumber, date)
SELECT 'equity', 'capital_injection', CAST(value AS DECIMAL(12,2)), 'رأس المال الأولي', 'CAP-MIGRATE-' || NOW(), NOW()
FROM company_settings
WHERE id = 'capital' AND value IS NOT NULL AND CAST(value AS DECIMAL(12,2)) > 0;

-- Step 2: Drop orphan tables (order matters due to FK)
DROP TABLE IF EXISTS employee_permissions CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;

-- Verify
SELECT COUNT(*) as remaining_company_settings FROM information_schema.tables WHERE table_name = 'company_settings';
SELECT COUNT(*) as remaining_employee_permissions FROM information_schema.tables WHERE table_name = 'employee_permissions';
