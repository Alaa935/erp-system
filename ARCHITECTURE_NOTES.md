# ARCHITECTURE_NOTES.md

## API Flows

### Authentication Flow
```
POST /api/auth/login { username, password }
  → validate(loginSchema) — Zod validation (returns 400 on failure)
  → authController.login
    → authService.login(username, password)
      → prisma.user.findUnique({ where: { username } })
      → bcrypt.compare(password, user.password)
      → jwt.sign({ userId, username, role }, JWT_SECRET, { expiresIn })
      → prisma.refreshToken.create({ token, userId, expiresAt })
  → Response: { success: true, data: { user, accessToken, refreshToken } }

POST /api/auth/refresh { refreshToken }
  → authService.refresh(refreshToken)
    → prisma.refreshToken.findUnique({ where: { token } })
    → jwt.sign new access token
    → prisma.refreshToken.create (rotate)
  → Response: { success: true, data: { accessToken, refreshToken } }
```

### Sales Orders Flow
```
GET /api/sales-orders?customerId=N&status=X&page=1&pageSize=10
  → authenticate middleware (JWT check)
  → salesOrdersController.listOrders
    → salesOrdersService.listOrders({ customerId, status, ... })
      → prisma.salesOrder.findMany({ where: { customerId: Number(customerId), ... } })
      → prisma.salesOrder.count({ where })
      → prisma.salesRep.findMany (for rep name resolution)
  → Response: { success: true, data: { orders: [...], meta: { page, pageSize, total } } }
```

⚠️ **CRITICAL**: `customerId` comes from query params as string. Must use `Number(customerId)` before passing to Prisma Int where clause. Same for `supplierId` in inventory. This has been reverted once already — guard against future regressions.

### Notifications Flow
```
GET /api/notifications?limit=50
  → authenticate middleware
  → notificationsController.list
    → prisma.notification.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: limit })
  → Response: { success: true, data: [...notifications] }
```

⚠️ **Known issue**: Frontend calls this on mount unconditionally. Before auth, returns 401. Old api-client redirected to /login causing infinite loop. New api-client just throws ApiError.

## Database Triggers

No database triggers exist — all business logic is in application layer (services).

## Prisma Mappings

Table names are mapped from camelCase to snake_case:
- `user_accounts` = `User` model (`@@map("user_accounts")`)
- `sales_orders` = `SalesOrder` model (`@@map("sales_orders")`)
- `sales_order_items` = `SalesOrderItem` model
- `refresh_tokens` = `RefreshToken` model
- `inventory_transactions` = `InventoryTransaction` model
- `financial_transactions` = `FinancialTransaction` model
- `payment_collections` = `PaymentCollection` model
- `stock_transfers` / `stock_transfer_items` = StockTransfer / StockTransferItem
- `stock_requests` / `stock_request_items` = StockRequest / StockRequestItem
- `rep_inventory` = RepInventory model (composite unique: repId + itemId)
- `employee_payrolls` = EmployeePayroll model (composite unique: employeeId + month)
- `system_config` = SystemConfig model (single row, id="default")
- `activity_logs` = ActivityLog model
- `tax_configs` = TaxConfig model

## Business Logic

### Sales Order Creation (createOrder)
1. Validate customer exists
2. Validate all items exist and are not deleted
3. Calculate subtotal from items × prices
4. Apply tax if taxId provided (inclusive or exclusive calculation)
5. Generate order number (SO-YYYY-XXXX)
6. Create order + items in transaction
7. If paid, create financial transaction
8. If has repId, update rep's currentSales and balance

### Order Dispatch (dispatchOrder)
1. Validate order is pending
2. In transaction: decrement item quantities, create inventory transactions, update order status to 'shipped', create financial transaction
3. Fails if insufficient quantity

### Soft Delete Pattern
All major entities use soft delete:
- Fields: `deletedAt: DateTime?`, `deleteReason: String?`
- All list queries filter: `where: { deletedAt: null }`
- Audit log entry created on delete

## Critical Routes

| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| POST | /api/auth/login | No | Public login endpoint |
| POST | /api/auth/refresh | No | Token rotation |
| GET | /api/health | No | Health check |
| GET | /api/sales-orders | JWT | Query params: customerId, status, page, pageSize |
| GET | /api/inventory | JWT | Query params: supplierId, category, search |
| GET | /api/notifications | JWT | Query params: limit |
| POST | /api/auth/register | JWT+admin | Create user accounts |
| All POST/PUT/DELETE | various | JWT+rbac | Role-based access |

## Known Technical Debt

1. **Error handler hides details**: In production, ALL non-AppError returns "Internal server error" with no details (even Prisma errors). Makes debugging impossible without server logs.

2. **Prisma Int param handling**: Multiple endpoints accept numeric IDs as query params (strings). Must coerce to Number. Pattern has been reverted once — needs systematic fix.

3. **API response envelope**: All endpoints return `{ success, data }` or `{ success, error }` — but frontend api-client.ts has inconsistent unwrapping. Some places unwrap `.data`, others expect raw response.

4. **Hash routing**: No React Router. Page navigation via hash + state machine in App.tsx. Limits URL-based features (deep linking, SSR).

5. **Mixed DB architecture**: Production uses PostgreSQL via Prisma, but codebase still has legacy Dexie/IndexedDB code for local storage/backup.

6. **Monolith App.tsx**: Despite previous splits, still handles auth init, routing, notifications, sidebar, header all in one component.

7. **No request timeout**: New api-client.ts removed the 15s timeout. Requests can hang indefinitely.

8. **Prisma query logging in production**: database.ts logs ALL queries to stdout — potential performance issue and log noise.

9. **Missing render.yaml**: All Render config is dashboard-only. Infrastructure as code missing.

10. **SupplierInvoiceCreate page (feature-flagged)**: Dedicated page restored from commit `a0c0be0` (was created in `9ce4586`, enhanced in `df9f647`, deleted in `883b442`). Controlled by `VITE_USE_SUPPLIER_INVOICE_PAGE` env var. Default `false` → Modal; `true` → full-page create form at route `supplier-invoice-create`.
