# Changelog

## RC-1 (2026-05-15)

### Security
- 🔒 Hash passwords with bcryptjs, migrate plaintext on login
- 🔒 Remove GEMINI_API_KEY from client bundle (moved to runtime localStorage)
- 🔒 Add role-based route guard (`canAccessPage`/`getDefaultPage`)
- 🔒 Add Gemini API key config field in Settings → Security tab

### Database Safety
- 🗄️ Remove auto-execution of `resetTransactionData()` on app load
- 🗄️ Add `exportAllData()`/`importAllData()` for full backup/restore of all 24 tables
- 🗄️ Fix backup restore to save all tables (was only saving `systemConfig`)
- 🗄️ Add `quantity` index to `items` table for low-stock queries
- 🗄️ Add upgrade() migration pattern to prevent data loss on schema changes

### Architecture
- 🏗️ Split db.ts (1,119 lines) → `types/index.ts` (28 interfaces), `schema.ts`, `services.ts`, `seed.ts` — 100% backward compatible
- 🏗️ Split App.tsx (562→248 lines) → extract `Sidebar`, `Header`, `NotificationPanel`, `QuickActions`
- 🏗️ Extract `BackupSettings.tsx` from Settings.tsx

### UI/UX
- 🎨 Add `EmptyState` component — unified empty state with icon, message, optional action
- 🎨 Add `ConfirmDialog` component — unified confirmation modal with 3 variants (danger/warning/info)
- 🎨 Add `EmptyState` to Warehouses page
- 📢 Replace all `alert()` calls with `toast.success/error` (Settings 13 calls, BackupSettings 2, SalesRepManagement 1, SalesRepPortal 1)
- 📢 Replace `window.confirm()` with `ConfirmDialog` (Suppliers, TaxManagement)

### Error Handling & Monitoring
- 🛡️ Add `ErrorBoundary` at root level (`main.tsx`)
- 🛡️ Add centralized `logger.ts` — logs errors, operations, failed transactions, backup history to IndexedDB + console
- 🛡️ Add `validation.ts` — data validation layer with `ValidationError`
- 🛡️ Update `errorHandler.ts` to use logger

### Production Build
- ⚡ Add `manualChunks` in vite.config (vendor / db / charts / ai / pages)
- 📝 Update `index.html` with Arabic meta tags, RTL, proper title
- 📝 Add `.env.example`
- 📝 Add `build:analyze` npm script

### Bug Fixes
- 🐛 Fix restore backup (was restoring into systemConfig only)
- 🐛 Fix `handleRestoreBackup` in Settings.tsx (same issue)
- 🐛 Remove duplicate BranchSettings.tsx and EmployeeSettings.tsx (UI didn't match originals)

---

## Pre-RC (2026-05-15)

### Initial refactoring
- Hide 9 admin pages from admin role, keep for manager
- Project structure audit and backup
