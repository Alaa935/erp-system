# DEPLOYMENT_LOG.md — Deployment History

## Commit: fe5b445 — Fix: unify default API fallback URL to online Render backend
- **Files changed**: `src/App.tsx`, `src/lib/api-client.ts`
- **Why**: Changed frontend default API URL from `http://localhost:4000` to `https://server-e6y4.onrender.com`
- **Expected behavior**: Frontend connects to production API by default
- **Deployment status**: DEPLOYED
- **Rollback**: Revert to previous API URL

## Commit: 4d76139 — Fix: parse CORS_ORIGIN as list of origins
- **Files changed**: `server/src/app.ts`
- **Why**: Simplified CORS config to handle comma-separated origins
- **Expected behavior**: CORS allows frontend origin(s)
- **Deployment status**: DEPLOYED
- **Rollback**: Revert app.ts CORS section

## Commit: 779795d — Fix: unwrap data field from authentication API responses
- **Files changed**: `src/App.tsx`
- **Why**: API returns `{ success: true, data: ... }` format; need to unwrap `.data`
- **Expected behavior**: Auth flow works with wrapped API responses
- **Deployment status**: DEPLOYED

## Commit: 6cc5a50 — Fix: unwrap data field from SalesRepPortal query responses
- **Files changed**: `src/pages/SalesRepPortal.tsx`, various hooks
- **Why**: API responses wrapped in `{ success, data }` object
- **Deployment status**: DEPLOYED

## Commit: 27559f4 — Fix: unwrap data from notificationsData in App.tsx
- **Files changed**: `src/App.tsx`
- **Why**: Notifications API returns `{ success, data }` format
- **Deployment status**: DEPLOYED

## Commit: 883b442 — Feat: erp and wms refactoring, pagination, database migration, and strict verification
- **Files changed**: 107 files (major refactoring)
- **Why**: Large refactoring across frontend and backend
- **⚠️ REGRESSION INTRODUCED**: Reverted `Number(customerId)` and `Number(supplierId)` coercion from `5dc44ee`
- **Expected behavior**: Various improvements
- **Deployment status**: DEPLOYED (requires Number() fix re-apply)

## Commit: 22a558d — Fix infinite GlobalLoader loop (ORIGINAL, superseded)
- **Status**: SUPERSEDED by later commits that modified App.tsx differently

## Commit: 5dc44ee — Fix Prisma numeric query param type errors (ORIGINAL, superseded)
- **Status**: SUPERSEDED by `883b442` which reverted the fix

## Commit: 797c39b — Add repName to sales-orders API response
- **Files changed**: `server/src/services/salesOrders.service.ts`
- **Why**: Expose rep name in sales order responses for UI
- **Deployment status**: DEPLOYED

## Current Production State (as of 2026-06-17)

- **Remote SHA**: `c49574c` (latest on origin/main)
- **Frontend**: Deployed — bundle hash unknown
- **Backend**: Deployed — login works, sales-orders with customerId=2 returns 500 (regression)
- **Known issues**:
  1. `GET /api/sales-orders?customerId=N` — 500 due to reverted Number() coercion
  2. `GET /api/inventory?supplierId=N` — 500 due to reverted Number() coercion

## Rollback Instructions

To rollback the backend to a working state:
```bash
git revert c49574c --no-commit  # revert the regression-introducing commits
# OR manually re-apply Number() coercion
```

To rollback specific file:
```bash
git checkout <working-sha> -- server/src/services/salesOrders.service.ts
```
