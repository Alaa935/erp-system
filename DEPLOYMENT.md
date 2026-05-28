# دليل النشر — Deployment Guide

## المتطلبات الأساسية

| المتطلب | الإصدار الأدنى |
|---------|----------------|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| متصفح حديث | Chrome/Firefox/Edge (آخر إصدار) |

## خطوات النشر

### 1. تثبيت الاعتماديات

```bash
npm install
```

### 2. بناء نسخة الإنتاج

```bash
npm run build
```

الملفات المنتجة في مجلد `dist/`:
- `index.html` — الصفحة الرئيسية
- `assets/` — ملفات JS و CSS مقسمة (vendor, db, charts, ai, كل صفحة)

### 3. رفع الملفات للسيرفر

ارفع محتوى مجلد `dist/` إلى أي سيرفر static:

#### خيارات النشر

| الخيار | الطريقة |
|--------|---------|
| **Nginx / Apache** | انسخ `dist/*` إلى `/var/www/html/` |
| **Cloudflare Pages** | اربط المستودع ← اختر مجلد `dist` |
| **Vercel** | `vercel --prod` |
| **Netlify** | اسحب `dist/` إلى واجهة Netlify |
| **GitHub Pages** | استخدم `gh-pages` أو GitHub Actions |
| **Express (اختياري)** | `npx serve dist` |

### 4. إعدادات المتصفح

- **تأكد من تمكين JavaScript**
- **تأكد من تمكين IndexedDB** (مدعوم في جميع المتصفحات الحديثة)
- **يفضل استخدام Chrome أو Edge** لأفضل أداء مع IndexedDB

### 5. أول تسجيل دخول

النظام يأتي ببيانات افتراضية:
- **admin**: `admin` / `admin123`
- **manager**: `manager` / `manager123`
- **rep1**: `rep1` / `rep123`

## إعدادات ما بعد النشر

### 1. مفتاح Gemini API (اختياري)
- سجّل الدخول كـ admin
- اذهب إلى Settings → Security
- أدخل مفتاح Gemini API في حقل "مفتاح API للذكاء الاصطناعي"

### 2. النسخ الاحتياطي الأول
- اذهب إلى Settings → Backup
- حمل نسخة احتياطية (Export) فور إدخال بياناتك

### 3. إعدادات الشركة
- اذهب إلى Settings → General
- أدخل اسم الشركة، العنوان، الرقم الضريبي، السجل التجاري

### 4. تغيير كلمة المرور
- اذهب إلى Settings → Security
- غيّر كلمة المرور للحسابات الافتراضية فوراً

## البنية التحتية الموصى بها للإنتاج

```
Cloudflare CDN
    ↓
Nginx / Apache (SSL)
    ↓
Static files (dist/)
    ↓
Client Browser ← IndexedDB (local storage)
```

**ملاحظة:** النظام بالكامل يعمل على متصفح المستخدم (client-side only). لا يوجد سيرفر خلفي. يتم تخزين البيانات في IndexedDB المحلي.
