# PROJECT_MEMORY.md — United Egyptian Warehouses ERP

## Current Architecture

```
Browser ←→ Render CDN (frontend static)
         ←→ Render Web Service (backend API)
              ←→ PostgreSQL (Render managed)
```

- **Frontend**: Static SPA deployed on Render Static Site
- **Backend**: Express API deployed on Render Web Service
- **Database**: PostgreSQL hosted on Render

## Frontend Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 + motion (framer-motion) |
| State | React Query (TanStack) + React hooks |
| Routing | Hash-based (#/page) — no React Router |
| HTTP | Custom `api-client.ts` wrapper around fetch |
| Notifications | sonner (toasts) |
| Icons | lucide-react |
| Charts | recharts |
| QR | qrcode.react |
| AI | @google/genai (client-side, API key in localStorage) |
| DB (local) | Dexie.js / IndexedDB (for offline/backup) |

## Backend Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 + TypeScript + tsx |
| Framework | Express 4 |
| ORM | Prisma 6 + PostgreSQL |
| Auth | JWT (access + refresh tokens) + bcryptjs |
| Validation | Zod |
| Security | helmet, cors |
| Build | tsc compiler |

## Database Structure (PostgreSQL via Prisma)

Key models (see `server/prisma/schema.prisma` for full schema):
- **user_accounts** — login credentials, roles (admin/manager/rep)
- **items** — inventory items with SKU, pricing, quantities
- **customers** — customer records
- **suppliers** — supplier records
- **sales_orders** + **sales_order_items** — sales transactions
- **purchase_orders** + **purchase_order_items** — purchase transactions
- **sales_reps** — sales representatives
- **rep_inventory** — rep-specific inventory (many-to-many with items)
- **financial_transactions** — accounting entries
- **payment_collections** — payment tracking
- **notifications** — system notifications
- **activity_logs** — audit trail
- **stock_transfers** / **stock_requests** — inventory movement
- **employees** + **employee_payrolls** — HR
- **vehicles** — fleet management
- **branches** — branch management
- **warehouses** — warehouse management
- **system_config** — company settings (single row)
- **invoice_settings** — invoice configuration
- **tax_configs** — tax rates
- **refresh_tokens** — JWT refresh token storage

## Deployment Flow

- **GitHub**: `https://github.com/Alaa935/erp-system.git` (public)
- **Branch**: `main`
- **Frontend**: Auto-deployed to Render Static Site (`erp-system-pf8p`)
- **Backend**: Auto-deployed to Render Web Service (`server-e6y4`)
- **No render.yaml** — all config via Render dashboard
- **Production URLs**:
  - Frontend: `https://erp-system-pf8p.onrender.com`
  - API: `https://server-e6y4.onrender.com`
  - API Health: `https://server-e6y4.onrender.com/api/health`

## Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `VITE_USE_SUPPLIER_INVOICE_PAGE` | `false` | When `true`, purchase order creation uses dedicated page (`/supplier-invoice-create`) instead of Modal. Set in `.env.production`. |

## Known Constraints

1. **No render.yaml** — deployment config is dashboard-only, not reproducible
2. **No Render API key** — cannot trigger manual deploys or check logs programmatically
3. **Error handler hides Prisma details in production** — `server/src/middleware/errorHandler.ts:25-32` returns generic "Internal server error" for all non-AppError in production
4. **TypeScript strict mode disabled** — `strict: false` in tsconfig
5. **No pagination in most tables** — loads all records at once via Dexie
6. **Password defaults** (from DEPLOYMENT.md, may differ in prod):
   - admin: `admin / Admin@123`
   - manager: `manager / manager123`
   - rep: `rep1 / rep123`

## Environment Variables (Backend)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 4000 | Server port |
| NODE_ENV | No | development | Environment |
| DATABASE_URL | **Yes** | — | PostgreSQL connection string |
| JWT_SECRET | **Yes** | — | JWT signing secret |
| JWT_REFRESH_SECRET | **Yes** | — | Refresh token secret |
| JWT_EXPIRES_IN | No | 15m | Access token TTL |
| JWT_REFRESH_EXPIRES_IN | No | 7d | Refresh token TTL |
| CORS_ORIGIN | No | http://localhost:3000 | Allowed CORS origins (comma-separated) |
| CORS_WILDCARD_ORIGINS | No | (empty) | Wildcard CORS origins |
| BCRYPT_SALT_ROUNDS | No | 12 | bcrypt cost factor |

## Important Business Rules

- **Roles**: admin (full access), manager (ops), rep (field sales)
- **Sales Orders** use `orderNumber` with prefix `SO-YYYY-XXXX`
- **Financial Transactions** use `transactionNumber` with prefix `TXN-{timestamp}-{random}`
- **Soft deletes** used throughout — `deletedAt` + `deleteReason` fields
- **Inventory transactions** track all quantity changes with old/new/diff
- **Sales reps** have `currentSales`, `balance`, and `commissionRate`
- **Payment statuses**: paid / partial / unpaid
- **Order statuses**: pending → shipped (dispatched) → delivered / cancelled
