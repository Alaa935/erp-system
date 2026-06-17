# BUG_HISTORY.md — ERP Bug Tracking

## Active Bugs

### B001 — 🟠 Dashboard Chart uses static data
- **File**: `src/pages/Dashboard.tsx:98-108`
- **Description**: `movementData` is 12 hardcoded values, not connected to DB
- **Status**: OPEN

### B002 — 🟠 Accounting loads all tables on mount
- **File**: `src/pages/Accounting.tsx:73-84`
- **Description**: 12+ `useLiveQuery` hooks fire for invisible tabs
- **Status**: OPEN

### B003 — 🟡 Settings.tsx is 1,129 lines
- **File**: `src/pages/Settings.tsx`
- **Description**: 10 tabs in one file, hard to maintain
- **Status**: OPEN — only BackupSettings extracted

### B004 — 🟡 SalesRepPortal.tsx is 2,442 lines (after refactor, was 1,569)
- **File**: `src/pages/SalesRepPortal.tsx`
- **Description**: Multiple tabs + sub-components in one file
- **Status**: OPEN

### B005 — 🔵 No pagination in tables
- **Files**: All table pages
- **Description**: `toArray()` loads all records at once
- **Status**: OPEN

### B006 — 🔵 TypeScript strict mode disabled
- **File**: `tsconfig.json` — `strict: false`
- **Description**: Allows implicit `any`
- **Status**: OPEN

### B007 — 🔵 Employee.permissions not wired to route guard
- **File**: `src/pages/Settings.tsx` (employees tab)
- **Description**: `canAccessPage()` doesn't check employee permissions
- **Status**: OPEN

### B008 — 🔵 Express + dotenv in frontend dependencies (unused)
- **File**: `package.json`
- **Description**: express and dotenv in root package.json but not imported
- **Status**: OPEN

### B009 — 🔵 DB version(13) without upgrade() callback
- **File**: `src/db/schema.ts:53`
- **Description**: Schema changes cause data loss on version bump
- **Status**: OPEN

---

## Fixed Bugs

### B010 — ✅ 🔴 Plain text passwords
- **Fixed in**: Commit `e59d357`
- **Fix**: bcryptjs hashing + migration on login
- **Files**: `src/lib/auth.ts`, `LoginPage.tsx`, `src/db/seed.ts`

### B011 — ✅ 🔴 GEMINI_API_KEY exposed in bundle
- **Fixed in**: Commit `e59d357`
- **Fix**: Moved to runtime localStorage, removed from vite.config
- **Files**: `vite.config.ts`, `Settings.tsx`, `AISalesInsight.tsx`

### B012 — ✅ 🟠 No route protection
- **Fixed in**: Commit `e59d357`
- **Fix**: Added `canAccessPage()` and `getDefaultPage()`
- **Files**: `src/lib/permissions.ts`, `App.tsx`

### B013 — ✅ 🟠 resetTransactionData() auto-executes on load
- **Fixed in**: Commit `af94d71`
- **Fix**: Removed auto-execution from onload
- **Files**: `src/db/db.ts` → `src/db/schema.ts`

### B014 — ✅ 🟠 Backup/Restore doesn't save all tables
- **Fixed in**: Commit `af94d71`
- **Fix**: `exportAllData()` + `importAllData()` for all 24 tables
- **Files**: `src/db/services.ts`

### B015 — ✅ 🟡 alert() in Settings.tsx and BackupSettings.tsx
- **Fixed in**: Production Stabilization phase
- **Fix**: Replaced 15 alert() calls with toast.success/error
- **Files**: `Settings.tsx`, `BackupSettings.tsx`

### B016 — ✅ 🟡 confirm() in Suppliers.tsx and TaxManagement.tsx
- **Fixed in**: Production Stabilization phase
- **Fix**: Replaced window.confirm with ConfirmDialog component
- **Files**: `Suppliers.tsx`, `TaxManagement.tsx`, `ui/ConfirmDialog.tsx`

### B017 — ✅ 🔵 Warehouses.tsx missing EmptyState
- **Fixed in**: Production Stabilization phase
- **Fix**: Added `<EmptyState>` when warehouses.length === 0
- **File**: `Warehouses.tsx`

### B018 — ✅ 🔵 main.tsx missing ErrorBoundary
- **Fixed in**: Production Stabilization phase
- **Fix**: Wrapped `<App>` in `<ErrorBoundary>`
- **File**: `main.tsx`

### B019 — ✅ 🔵 No build optimization / code splitting
- **Fixed in**: Production Stabilization phase
- **Fix**: Added manualChunks for vendor, db, charts, ai
- **File**: `vite.config.ts`

### B020 — ✅ 🔴 Prisma Int param type error: customerId passed as string
- **Date**: 2026-06-17
- **Commit**: `5dc44ee` (original fix), REVERTED in `883b442` then re-applied
- **Severity**: CRITICAL — 500 on GET /api/sales-orders?customerId=2
- **Symptom**: Prisma error: "Expected IntFilter or Int, provided String"
- **Root Cause**: `salesOrders.service.ts:28` passed raw query string `customerId: "2"` to Prisma Int where clause
- **Files affected**: `server/src/services/salesOrders.service.ts:28`, `server/src/services/inventory.ts:39`
- **Fix applied**: Added `Number(customerId)` and `Number(supplierId)` coercion
- **Regression risk**: HIGH — reverted once already in commit `883b442`; any future merge from different branch may re-revert
- **Status**: FIXED (re-applied after regression)

### B021 — ✅ 🔴 Infinite GlobalLoader loop on production
- **Date**: 2026-06-17
- **Commit**: `22a558d` (original fix), regression risk from other dev changes
- **Severity**: CRITICAL — app stuck on loading screen
- **Symptom**: GlobalLoader never resolves, page stays blank
- **Root Cause**: `useNotifications(50)` and `useUnreadNotifications()` fired unconditionally on mount, called `/api/notifications` with no auth, backend returned 401, old api-client executed `window.location.href = '/login'` causing full page redirect before `setIsInitializing(false)` could fire at 800ms
- **Files affected**: `src/App.tsx:82-83`
- **Fix applied** (original): Changed to `useNotifications(50, !!currentUser)` and `useUnreadNotifications(!!currentUser)`, added init lifecycle logging
- **Note**: New api-client.ts (in `c49574c`) removed `window.location.href = '/login'` redirect — this alone breaks the infinite loop even without `!!currentUser` guard
- **Regression risk**: MEDIUM — unconditional notification hooks cause 401 errors on init (but no redirect loop anymore)
- **Status**: FIXED (re-applied the !currentUser guard after regression)

### B022 — ✅ 🔴 Backend login 500
- **Date**: 2026-06-17
- **Commit**: Fixed by commits in range `883b442..c49574c`
- **Severity**: CRITICAL — users cannot log in
- **Symptom**: `POST /api/auth/login` returned 500 "Internal server error"
- **Root Cause**: Unknown (error handler hid details). Possibly CORS misconfig, env var issue, or Prisma connection pooling — resolved by the batch of fixes in `883b442` through `c49574c` (CORS refactor, auth middleware defensive guards, database config changes)
- **Files affected**: Potentially `server/src/app.ts` (CORS), `server/src/middleware/auth.ts` (defensive JWT_SECRET), `server/src/config/database.ts` (Prisma log config)
- **Fix applied**: Multiple commits fixed the issue; login now returns 200
- **Verification**: `POST /api/auth/login` with admin/Admin@123 returns `{ success: true, data: { user, accessToken, refreshToken } }`
- **Regression risk**: LOW now that login is verified working
- **Status**: VERIFIED

### B023 — ✅ 🔴 Prisma Int param regression (B020 reverted)
- **Date**: 2026-06-17
- **Commit**: `883b442` introduced the revert
- **Severity**: CRITICAL
- **Symptom**: `GET /api/sales-orders?customerId=2` returns 500 "Internal server error"
- **Root Cause**: The `Number()` coercion fix from `5dc44ee` was reverted in commit `883b442` — `if (customerId) where.customerId = customerId;` instead of `if (customerId) where.customerId = Number(customerId);`
- **Files affected**: `server/src/services/salesOrders.service.ts:28`, `server/src/services/inventory.ts:39`
- **Fix applied**: Re-applied `Number(customerId)` and `Number(supplierId)` coercion
- **Verification**: `GET /api/sales-orders?customerId=2` returns 200 with order data
- **Regression risk**: HIGH — third time this pattern could be reverted. Need code review guard for Prisma Int param handling
- **Status**: FIXED (re-applied)

---

## Statistics

| Status | Count |
|--------|-------|
| 🔴 Critical (OPEN) | 0 |
| 🟠 High (OPEN) | 2 |
| 🟡 Medium (OPEN) | 2 |
| 🔵 Low (OPEN) | 5 |
| **Total OPEN** | **9** |
| ✅ Fixed | 14 |
