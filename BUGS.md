# BUGS — سجل المشاكل والأخطاء

**آخر تحديث:** 2026-05-15
**الإصدار:** RC-1

---

## مفتاح الخطورة

| الدرجة | اللون | المعنى |
|--------|-------|--------|
| 🔴 Critical | تعطيل كامل للميزة أو النظام | يجب الإصلاح فوراً |
| 🟠 High | الميزة لا تعمل بشكل صحيح | إصلاح قبل الإصدار |
| 🟡 Medium | مشكلة في UX أو أداء | إصلاح قريباً |
| 🔵 Low | تحسين أو مشكلة تجميلية | إصلاح عند التفرغ |

---

## نشط (Active)

### B001 — 🟠 Dashboard Chart يستخدم بيانات ثابتة
- **الصفحة:** `src/pages/Dashboard.tsx:98-108`
- **الوصف:** `movementData` عبارة عن 12 قيمة ثابتة غير متصلة بقاعدة البيانات
- **خطوات إعادة المشكلة:** افتح Dashboard → انظر Chart الشهر → البيانات لا تتغير
- **التأثير:** Medium — الرسم البياني لا يعكس الواقع
- **الحالة:** مفتوح

### B002 — 🟠 Accounting يحمل جميع الجداول على mount
- **الصفحة:** `src/pages/Accounting.tsx:73-84`
- **الوصف:** 12+ `useLiveQuery` hook تشتغل فوراً حتى للتبويبات غير المرئية
- **خطوات إعادة المشكلة:** افتح Accounting → افتح Network/Console → جميع الجداول تُحمل
- **التأثير:** أداء بطيء مع كميات كبيرة من البيانات
- **الحالة:** مفتوح

### B003 — 🟡 Settings.tsx ضخم (1,129 سطر)
- **الصفحة:** `src/pages/Settings.tsx`
- **الوصف:** 10 تبويبات في ملف واحد، الصيانة صعبة
- **خطوات إعادة المشكلة:** افتح Settings.tsx → 1,129 سطر
- **التأثير:** صعوبة الصيانة، خطر حدوث regressions
- **الحالة:** مفتوح — تم استخراج BackupSettings فقط

### B004 — 🟡 SalesRepPortal.tsx ضخم (1,569 سطر)
- **الصفحة:** `src/pages/SalesRepPortal.tsx`
- **الوصف:** 6 تبويبات و sub-components كلها في ملف واحد
- **التأثير:** صعوبة الصيانة، إعادة تحميل كاملة عند تغيير التبويب
- **الحالة:** مفتوح

### B005 — 🔵 لا يوجد Pagination في الجداول
- **الصفحات:** جميع صفحات الجداول
- **الوصف:** `toArray()` يحمل كل السجلات دفعة واحدة
- **خطوات إعادة المشكلة:** أضف 1000+ سجل → لاحظ بطء التصفح
- **التأثير:** أداء ضعيف مع بيانات كبيرة
- **الحالة:** مفتوح

### B006 — 🔵 TypeScript strict mode معطل
- **المشروع كامل:** `tsconfig.json` — `strict: false`
- **الوصف:** يسمح بـ `any` الضمني
- **خطوات إعادة المشكلة:** `tsc --noEmit` لا يكتشف أنواع `any`
- **التأثير:** مخفي أخطاء typescript محتملة
- **الحالة:** مفتوح

### B007 — 🔵 Employee.permissions غير مربوط بـ route guard
- **الصفحة:** `src/pages/Settings.tsx` (employees tab)
- **الوصف:** الموظف لديه حقول `permissions` لكن غير مفعلة في `canAccessPage()`
- **التأثير:** صلاحيات الموظفين غير محمية
- **الحالة:** مفتوح

### B008 — 🔵 Express و dotenv في dependencies
- **الملف:** `package.json`
- **الوصف:** `express` و `dotenv` غير مستخدمين (Vite يستخدم `loadEnv` المدمج)
- **خطوات إعادة المشكلة:** `npm ls express dotenv` — موجودين لكن لا import لهم
- **التأثير:** زيادة حجم node_modules
- **الحالة:** مفتوح

### B009 — 🔵 DB version(13) بدون upgrade() callback
- **الملف:** `src/db/schema.ts:53`
- **الوصف:** `version(13).stores(...)` بدون `upgrade()` — عند تغيير schema تُمسح البيانات
- **خطوات إعادة المشكلة:** غيّر schema → حدث الصفحة → البيانات القديمة تختفي
- **التأثير:** فقدان بيانات عند التحديث
- **الحالة:** مفتوح

---

## تم الإصلاح (Fixed)

### B010 — ✅ 🔴 كلمات المرور نص عادي
- **تم الإصلاح في:** Commit `e59d357`
- **الإصلاح:** استخدام bcryptjs مع hashing + migration عند تسجيل الدخول
- **الملفات:** `src/lib/auth.ts`, `LoginPage.tsx`, `src/db/seed.ts`

### B011 — ✅ 🔴 GEMINI_API_KEY في bundle
- **تم الإصلاح في:** Commit `e59d357`
- **الإصلاح:** إزالة `process.env.GEMINI_API_KEY` من vite.config، إضافة حقل في Settings
- **الملفات:** `vite.config.ts`, `Settings.tsx`, `AISalesInsight.tsx`

### B012 — ✅ 🟠 لا يوجد حماية للمسارات
- **تم الإصلاح في:** Commit `e59d357`
- **الإصلاح:** `canAccessPage()` و `getDefaultPage()` في route guard
- **الملفات:** `src/lib/permissions.ts`, `App.tsx`

### B013 — ✅ 🟠 resetTransactionData() يعمل تلقائياً
- **تم الإصلاح في:** Commit `af94d71`
- **الإصلاح:** إزالة auto-execution من onload
- **الملف:** `src/db/db.ts` → `src/db/schema.ts`

### B014 — ✅ 🟠 Backup/Restore لا يحفظ جميع الجداول
- **تم الإصلاح في:** Commit `af94d71`
- **الإصلاح:** `exportAllData()` + `importAllData()` لجميع 24 جدول
- **الملف:** `src/db/services.ts`

### B015 — ✅ 🟡 alert() في Settings.tsx و BackupSettings.tsx
- **تم الإصلاح في:** مرحلة Production Stabilization
- **الإصلاح:** استبدال 13 `alert()` + 2 `alert()` بـ `toast.success/error`
- **الملفات:** `Settings.tsx`, `BackupSettings.tsx`

### B016 — ✅ 🟡 confirm() في Suppliers.tsx و TaxManagement.tsx
- **تم الإصلاح في:** مرحلة Production Stabilization
- **الإصلاح:** استبدال `window.confirm` بـ `ConfirmDialog` component
- **الملفات:** `Suppliers.tsx`, `TaxManagement.tsx`, `ui/ConfirmDialog.tsx`

### B017 — ✅ 🔵 Warehouses.tsx بدون EmptyState
- **تم الإصلاح في:** مرحلة Production Stabilization
- **الإصلاح:** إضافة `<EmptyState>` عند `warehouses.length === 0`
- **الملف:** `Warehouses.tsx`

### B018 — ✅ 🔵 main.tsx بدون ErrorBoundary
- **تم الإصلاح في:** مرحلة Production Stabilization
- **الإصلاح:** لف `<App>` داخل `<ErrorBoundary>` في `main.tsx`
- **الملف:** `main.tsx`

### B019 — ✅ 🔵 عدم وجود Build optimization
- **تم الإصلاح في:** مرحلة Production Stabilization
- **الإصلاح:** إضافة `manualChunks` لـ vendor, db, charts, ai
- **الملف:** `vite.config.ts`

---

## إحصائيات

| الحالة | العدد |
|--------|-------|
| 🔴 Critical (مفتوح) | 0 |
| 🟠 High (مفتوح) | 2 |
| 🟡 Medium (مفتوح) | 2 |
| 🔵 Low (مفتوح) | 5 |
| **الإجمالي المفتوح** | **9** |
| ✅ تم الإصلاح | 10 |
