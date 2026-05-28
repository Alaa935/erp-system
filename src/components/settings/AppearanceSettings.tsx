import React from 'react';
import { Palette } from 'lucide-react';
import { Card } from '../../components/design-system/Card';
import type { SystemConfig } from '../../types';

interface AppearanceSettingsProps {
  localConfig: Partial<SystemConfig>;
  setLocalConfig: React.Dispatch<React.SetStateAction<Partial<SystemConfig>>>;
  handleSaveConfig: () => void;
}

export function AppearanceSettings({ 
  localConfig, 
  setLocalConfig 
}: AppearanceSettingsProps) {
  const themeLabel = localConfig.theme === 'dark' ? 'ليلي' : 'فاتح';
  const fontSizeLabel = localConfig.fontSize === 'large' ? 'كبير' : localConfig.fontSize === 'small' ? 'صغير' : 'متوسط';
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">السمة</p>
            <Palette className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{themeLabel}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">حجم الخط</p>
            <Palette className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{fontSizeLabel}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">اللون الأساسي</p>
            <Palette className="w-4 h-4 text-gray-300" />
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="w-5 h-5 rounded-full ring-2 ring-gray-200 shrink-0" style={{ backgroundColor: localConfig.primaryColor || '#000' }} />
            <span className="text-sm font-black truncate">{localConfig.primaryColor || '#000000'}</span>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-black">المظهر وتجربة المستخدم</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card padding="lg" className="space-y-8">
            <div className="space-y-4">
               <span className="font-black text-sm">سمة النظام (Theme)</span>
               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setLocalConfig({...localConfig, theme: 'light'})}
                    className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${localConfig.theme === 'light' ? "border-black shadow-lg" : "border-transparent bg-gray-50"}`}
                  >
                     <div className="w-full h-12 bg-gray-50 rounded-lg flex items-center px-3 gap-2">
                        <div className="w-2 h-2 bg-black rounded-full" />
                        <div className="w-8 h-1 bg-gray-200 rounded" />
                     </div>
                     <span className="text-[10px] font-black">الوضع الفاتح</span>
                  </button>
                  <button 
                    onClick={() => setLocalConfig({...localConfig, theme: 'dark'})}
                    className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${localConfig.theme === 'dark' ? "border-black shadow-lg" : "border-transparent bg-gray-50"}`}
                  >
                     <div className="w-full h-12 bg-slate-900 rounded-lg flex items-center px-3 gap-2 border border-slate-700">
                        <div className="w-2 h-2 bg-white rounded-full" />
                        <div className="w-8 h-1 bg-slate-700 rounded" />
                     </div>
                     <span className="text-[10px] font-black">الوضع الليلي</span>
                  </button>
               </div>
            </div>

            <div className="space-y-4">
               <span className="font-black text-sm">حجم الخط</span>
               <div className="flex gap-2">
                  {[
                    { id: 'small', label: 'صغير' },
                    { id: 'medium', label: 'متوسط' },
                    { id: 'large', label: 'كبير' }
                  ].map((size) => (
                     <button 
                        key={size.id} 
                        onClick={() => setLocalConfig({...localConfig, fontSize: size.id as any})}
                        className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all ${localConfig.fontSize === size.id ? "bg-black text-white shadow-xl shadow-black/20" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                     >
                        {size.label}
                     </button>
                  ))}
               </div>
            </div>
         </Card>

         <Card padding="lg" className="bg-gray-100 border-4 border-white shadow-inner flex flex-col items-center justify-center text-center gap-4">
            <Palette className="w-12 h-12 text-gray-300" />
            <h4 className="font-black text-lg">تخصيص الألوان</h4>
            <div className="flex flex-wrap gap-3">
               {[
                 { color: '#000000', label: 'أسود ليلي' },
                 { color: '#2563eb', label: 'أزرق احترافي' },
                 { color: '#16a34a', label: 'أخضر نمو' },
                 { color: '#dc2626', label: 'أحمر تنبؤ' },
                 { color: '#ca8a04', label: 'ذهبي طموح' }
               ].map(item => (
                  <div 
                    key={item.color} 
                    onClick={() => setLocalConfig({...localConfig, primaryColor: item.color})}
                    style={{ backgroundColor: item.color }} 
                    title={item.label}
                    className={`w-10 h-10 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-md border-4 ${localConfig.primaryColor === item.color ? "border-black scale-110" : "border-white"}`}
                  />
               ))}
            </div>
            <p className="text-[10px] font-bold text-gray-400 mt-2">اختر اللون الأساسي للنظام والأزرار</p>
         </Card>
      </div>
    </div>
  );
}
