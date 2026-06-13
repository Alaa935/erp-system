SELECT 'suppliers' as tbl, name::text, COUNT(*)::int as cnt FROM suppliers GROUP BY name HAVING COUNT(*) > 1
UNION ALL
SELECT 'branches', name::text, COUNT(*)::int FROM branches GROUP BY name HAVING COUNT(*) > 1
UNION ALL
SELECT 'warehouses', name::text, COUNT(*)::int FROM warehouses GROUP BY name HAVING COUNT(*) > 1
UNION ALL
SELECT 'employees', email::text, COUNT(*)::int FROM employees WHERE email != '' GROUP BY email HAVING COUNT(*) > 1
UNION ALL
SELECT 'sales_reps', phone::text, COUNT(*)::int FROM sales_reps WHERE phone != '' GROUP BY phone HAVING COUNT(*) > 1
UNION ALL
SELECT 'vehicles', "plateNumber"::text, COUNT(*)::int FROM vehicles GROUP BY "plateNumber" HAVING COUNT(*) > 1
UNION ALL
SELECT 'stock_transfers', "transferNumber"::text, COUNT(*)::int FROM stock_transfers GROUP BY "transferNumber" HAVING COUNT(*) > 1
UNION ALL
SELECT 'tax_configs', name::text, COUNT(*)::int FROM tax_configs GROUP BY name HAVING COUNT(*) > 1
ORDER BY tbl;
