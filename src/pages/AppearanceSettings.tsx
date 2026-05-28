import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  Palette, Sun, Moon, Monitor, Type, TextSelect, LayoutDashboard,
  AlignRight, AlignLeft, Eye, Save, CheckCircle2, X, RefreshCw,
  Bold, Italic, Underline, Smartphone, Laptop
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { toast } from 'sonner';

const fonts = [
  { value: 'tajawal', label: 'Tajawal', sample: 'المخازن المصرية', style: { fontFamily: 'Tajawal' } },
  { value: 'cairo', label: 'Cairo', sample: 'المخازن المصرية', style: { fontFamily: 'Cairo' } },
  { value: 'noto', label: 'Noto Kufi', sample: 'المخازن المصرية', style: { fontFamily: 'Noto Kufi Arabic' } },
  { value: 'almarai', label: 'Almarai', sample: 'المخازن المصرية', style: { fontFamily: 'Almarai' } },
];

const layouts = [
  { value: 'sidebar', label: 'شريط جانبي', icon: LayoutDashboard, desc: 'قائمة جانبية ثابتة' },
  { value: 'topbar', label: 'شريط علوي', icon: Monitor, desc: 'قائمة أفقية علوية' },
];

export default function AppearanceSettings() {
  const config = useLiveQuery(() => db.systemConfig.get('default'));
  const [theme, setTheme] = useState<'light' | 'dark'>(config?.theme || 'light');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(config?.fontSize || 'medium');
  const [layout, setLayout] = useState<'sidebar' | 'topbar'>(config?.layout || 'sidebar');
  const [selectedFont, setSelectedFont] = useState('tajawal');
  const [compactMode, setCompactMode] = useState(false);

  const sizeMap = { small: 'صغير', medium: 'متوسط', large: 'كبير' };

  const handleSave = async () => {
    try {
      await db.systemConfig.update('default', { theme, fontSize, layout: layout as any });
      toast.success('تم حفظ إعدادات المظهر');
    } catch { toast.error('فشل حفظ الإعدادات'); }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-black">المظهر والواجهة</h1>
          <p className="text-sm text-gray-500 mt-1">تخصيص مظهر النظام والخطوط والألوان</p>
        </div>
        <button onClick={handleSave}
          className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
        ><Save className="w-4 h-4" />حفظ</button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Theme */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-black" />
              <h3 className="font-black text-black text-sm">السمة</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'light', label: 'فاتح', icon: Sun, preview: 'bg-white border-gray-200' },
                { value: 'dark', label: 'داكن', icon: Moon, preview: 'bg-gray-900 border-gray-700' },
              ].map(t => (
                <button key={t.value} onClick={() => setTheme(t.value as any)}
                  className={cn("p-5 rounded-xl border-2 transition-all", theme === t.value ? 'border-black' : 'border-gray-100')}
                >
                  <div className={cn("h-20 rounded-lg mb-3 flex items-center justify-center border", t.preview)}>
                    <t.icon className={cn("w-8 h-8", t.value === 'dark' ? 'text-white' : 'text-black')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-bold", theme === t.value ? 'text-black' : 'text-gray-500')}>{t.label}</span>
                    {theme === t.value && <CheckCircle2 className="w-4 h-4 text-black" />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Font Selector */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-4 h-4 text-black" />
              <h3 className="font-black text-black text-sm">الخط</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {fonts.map(f => (
                <button key={f.value} onClick={() => setSelectedFont(f.value)}
                  className={cn("p-4 rounded-xl border-2 transition-all text-center", selectedFont === f.value ? 'border-black' : 'border-gray-100')}
                >
                  <p className="text-lg font-bold mb-1" style={f.style}>{f.sample.split(' ')[0]}</p>
                  <p className={cn("text-[10px] font-bold", selectedFont === f.value ? 'text-black' : 'text-gray-500')}>{f.label}</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Layout & Font Size */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5"
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <LayoutDashboard className="w-4 h-4 text-black" />
                <h3 className="font-black text-black text-sm">تخطيط الواجهة</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {layouts.map(l => (
                  <button key={l.value} onClick={() => setLayout(l.value as any)}
                    className={cn("p-4 rounded-xl border-2 transition-all", layout === l.value ? 'border-black bg-gray-50' : 'border-gray-100')}
                  >
                    <l.icon className={cn("w-6 h-6 mb-2", layout === l.value ? 'text-black' : 'text-gray-400')} />
                    <p className={cn("text-xs font-bold", layout === l.value ? 'text-black' : 'text-gray-500')}>{l.label}</p>
                    <p className="text-[9px] text-gray-400">{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <TextSelect className="w-4 h-4 text-black" />
                <h3 className="font-black text-black text-sm">حجم الخط</h3>
              </div>
              <div className="flex gap-3">
                {(['small', 'medium', 'large'] as const).map(s => (
                  <button key={s} onClick={() => setFontSize(s)}
                    className={cn("flex-1 py-3 rounded-xl border-2 text-center transition-all",
                      fontSize === s ? 'border-black bg-gray-50' : 'border-gray-100'
                    )}
                  >
                    <span className={cn("font-bold block", s === 'small' ? 'text-xs' : s === 'medium' ? 'text-sm' : 'text-lg')}>أب</span>
                    <span className={cn("text-[10px] font-bold mt-1 block", fontSize === s ? 'text-black' : 'text-gray-500')}>{sizeMap[s]}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Live Preview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-black" />
            <h3 className="font-black text-black text-sm">معاينة حية</h3>
          </div>
          <div className={cn("rounded-xl overflow-hidden border", theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200')}>
            {/* Preview Header */}
            <div className={cn("p-4 border-b", theme === 'dark' ? 'border-gray-700' : 'border-gray-100')}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
            </div>
            {/* Preview Body */}
            <div className={cn("p-5 space-y-3", compactMode ? 'space-y-2' : 'space-y-3')}>
              <div className={cn("font-black", compactMode ? 'text-sm' : fontSize === 'large' ? 'text-xl' : fontSize === 'medium' ? 'text-lg' : 'text-base')}
                style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
                {selectedFont === 'tajawal' ? 'مرحباً بك في النظام' : 'أهلاً بك'}
              </div>
              <div className={cn("text-gray-400", compactMode ? 'text-[10px]' : 'text-xs')}>
                هذا معاينة حية للمظهر الحالي للنظام مع جميع التغييرات المطبقة.
              </div>
              <div className={cn("flex gap-2", compactMode && 'gap-1')}>
                <div className={cn("rounded-lg px-3 py-1.5 font-bold", compactMode ? 'text-[9px]' : 'text-[10px]',
                  theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black')}>
                  زر تجريبي
                </div>
                <div className={cn("rounded-lg px-3 py-1.5 font-bold", compactMode ? 'text-[9px]' : 'text-[10px]',
                  theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white')}>
                  زر رئيسي
                </div>
              </div>
            </div>
          </div>

          {/* Compact Mode Toggle */}
          <div className="flex items-center justify-between mt-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs font-bold text-black">الوضع المضغوط</p>
              <p className="text-[10px] text-gray-400">تقليل المسافات بين العناصر</p>
            </div>
            <button onClick={() => setCompactMode(!compactMode)}
              className={cn("p-2 rounded-lg transition-all", compactMode ? 'bg-green-50 text-green-600' : 'bg-gray-200 text-gray-400')}
            >{compactMode ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
