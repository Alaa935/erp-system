-- ============================================================
-- Inspect Production PostgreSQL Schema for SalesOrder
-- Run against the production database
-- ============================================================

-- 1. All columns in sales_orders table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'sales_orders'
ORDER BY ordinal_position;

-- 2. Table constraints on sales_orders
SELECT
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'sales_orders';

-- 3. Indexes on sales_orders
SELECT
    i.relname AS index_name,
    a.attname AS column_name,
    ix.indisunique AS is_unique,
    ix.indisprimary AS is_primary
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname = 'sales_orders'
ORDER BY index_name, a.attnum;

-- 4. Enum types used by sales_orders
SELECT
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('OrderStatus', 'PaymentStatus')
ORDER BY t.typname, e.enumsortorder;

-- 5. Check if any column is named order_status
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sales_orders'
  AND column_name LIKE '%order%status%'
  OR column_name LIKE '%status%';

-- 6. Views referencing sales_orders
SELECT
    table_name AS view_name
FROM information_schema.views
WHERE view_definition ILIKE '%sales_orders%';

-- 7. Full table DDL (PostgreSQL)
SELECT
    'CREATE TABLE sales_orders (' ||
    string_agg(
        column_name || ' ' ||
        data_type ||
        CASE WHEN character_maximum_length IS NOT NULL
             THEN '(' || character_maximum_length || ')'
             ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL
             THEN ' DEFAULT ' || column_default
             ELSE ''
        END,
        E',\n'
        ORDER BY ordinal_position
    ) || E'\n);' AS ddl
FROM information_schema.columns
WHERE table_name = 'sales_orders'
  AND table_schema = 'public';
