import React, { useState } from 'react';
import { useSystemConfig, useUpdateSystemConfig } from '../hooks/useSystemConfig';
import {
  FileText, Printer, QrCode, Image, Plus, Trash2, Eye, Download,
  Monitor, Smartphone, Maximize, Minus, X, RefreshCw, CheckCircle2,
  Save, Settings2, AlignRight, AlignLeft, Type, Bold, Palette
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const paperSizes = [
  { value: 'A4', label: 'A4', icon: FileText, desc: '297 × 210 مم' },
  { value: 'Thermal 80mm', label: 'حراري 80مم', icon: Monitor, desc: '80 مم × غير محدد' },
  { value: 'Thermal 58mm', label: 'حراري 58مم', icon: Smartphone, desc: '58 مم × غير محدد' },
];

const templates = [
  { id: 1, name: 'القالب الكلاسيكي', preview: 'bg-gray-100' },
  { id: 2, name: 'القالب الحديث', preview: 'bg-gray-50' },
  { id: 3, name: 'القالب البسيط', preview: 'bg-white' },
];

export default function InvoicesPage() {
  const { data: configData } = useSystemConfig();
  const updateConfig = useUpdateSystemConfig();
  const config = configData?.data;
  const [paperSize, setPaperSize] = useState(config?.paperSize || 'A4');
  const [qrEnabled, setQrEnabled] = useState(config?.qrCodeEnabled ?? true);
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(config?.logo || null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync({ paperSize: paperSize as any, qrCodeEnabled: qrEnabled, logo: logoPreview || undefined } as any);
      toast.success('تم حفظ إعدادات الفواتير');
    } catch { toast.error('فشل حفظ الإعدادات'); }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-black">الفواتير والطباعة</h1>
          <p className="text-sm text-gray-500 mt-1">إعدادات قوالب الفواتير وأحجام الطباعة</p>
        </div>
        <button onClick={handleSave}
          className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
        >
          <Save className="w-4 h-4" />حفظ الإعدادات
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Printer className="w-4 h-4 text-black" />
              <h3 className="font-black text-black text-sm">حجم الورق</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {paperSizes.map(p => (
                <button key={p.value} onClick={() => setPaperSize(p.value as 'A4' | 'Thermal 80mm' | 'Thermal 58mm')}
                  className={cn("p-4 rounded-xl border-2 transition-all text-center",
                    paperSize === p.value ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                  )}
                >
                  <p.icon className={cn("w-6 h-6 mx-auto mb-2", paperSize === p.value ? 'text-black' : 'text-gray-400')} />
                  <p className={cn("text-xs font-bold", paperSize === p.value ? 'text-black' : 'text-gray-500')}>{p.label}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-black" />
              <h3 className="font-black text-black text-sm">قالب الفاتورة</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {templates.map(t => (
                <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                  className={cn("rounded-xl border-2 overflow-hidden transition-all",
                    selectedTemplate === t.id ? 'border-black' : 'border-gray-100'
                  )}
                >
                  <div className={cn("h-24 flex items-center justify-center", t.preview)}>
                    <FileText className={cn("w-8 h-8", selectedTemplate === t.id ? 'text-black' : 'text-gray-300')} />
                  </div>
                  <div className={cn("p-2 text-center text-[10px] font-bold", selectedTemplate === t.id ? 'bg-black text-white' : 'bg-gray-50 text-gray-500')}>
                    {t.name}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-4 h-4 text-black" />
              <h3 className="font-black text-black text-sm">شعار الشركة للفاتورة</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Image className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div>
                <label className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:opacity-90 transition-all inline-flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5" />اختيار صورة
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {logoPreview && (
                  <button onClick={() => setLogoPreview(null)} className="mr-2 text-red-500 text-xs font-bold hover:underline">إزالة</button>
                )}
                <p className="text-[10px] text-gray-400 mt-2">PNG, JPG. مقاس 200×200 بكسل</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-black" />
                <div>
                  <h3 className="font-black text-black text-sm">رمز QR للفاتورة</h3>
                  <p className="text-[10px] text-gray-400">رمز الاستجابة السريعة للتحقق من الفاتورة</p>
                </div>
              </div>
              <button onClick={() => setQrEnabled(!qrEnabled)}
                className={cn("p-2 rounded-lg transition-all", qrEnabled ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400')}
              >
                {qrEnabled ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-black" />
              <h3 className="font-black text-black text-sm">معاينة حية</h3>
            </div>
            <span className="text-[10px] text-gray-400">{paperSizes.find(p => p.value === paperSize)?.label}</span>
          </div>
          <div className={cn(
            "bg-white border border-gray-200 rounded-xl mx-auto shadow-sm overflow-hidden",
            paperSize === 'A4' ? 'max-w-sm' : paperSize === 'Thermal 80mm' ? 'max-w-[220px]' : 'max-w-[180px]'
          )}>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-gray-100 rounded" />
                <span className="text-[8px] font-bold text-gray-400">فاتورة ضريبية</span>
              </div>
              <p className="text-[9px] font-bold text-black mb-0.5">{config?.companyName || 'اسم الشركة'}</p>
              <p className="text-[7px] text-gray-400">{config?.taxId || '000-000-000'}</p>
              <p className="text-[7px] text-gray-400">{config?.address || 'العنوان'}</p>
            </div>
            <div className="px-4 py-2 space-y-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between text-[8px]">
                  <span className="text-gray-700">منتج {i}</span>
                  <span className="font-bold">1 × {i}00 ج.م</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-gray-100">
              <div className="flex justify-between text-[8px] mb-0.5">
                <span className="text-gray-500">الإجمالي</span>
                <span className="font-bold">600 ج.م</span>
              </div>
              <div className="flex justify-between text-[8px] mb-0.5">
                <span className="text-gray-500">الضريبة 14%</span>
                <span className="font-bold">84 ج.م</span>
              </div>
              <div className="flex justify-between text-[9px] font-black pt-1 border-t border-gray-100 mt-1">
                <span>الصافي</span>
                <span>684 ج.م</span>
              </div>
            </div>
            {qrEnabled && (
              <div className="px-4 py-2 border-t border-gray-100 flex justify-center">
                <QrCode className="w-8 h-8 text-gray-300" />
              </div>
            )}
          </div>
          <p className="text-[9px] text-gray-400 text-center mt-3">معاينة مباشرة - التغييرات محدثة فوراً</p>
        </motion.div>
      </div>
    </div>
  );
}
