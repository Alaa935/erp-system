import React from 'react';
import { Save, Building2, Palette, Upload } from 'lucide-react';
import { Card } from '../../components/design-system/Card';
import { FormField } from '../../components/design-system/FormField';
import { shadow } from '../../components/design-system/tokens';
import type { SystemConfig } from '../../types';

interface GeneralSettingsProps {
  config: SystemConfig | undefined;
  localConfig: Partial<SystemConfig>;
  setLocalConfig: React.Dispatch<React.SetStateAction<Partial<SystemConfig>>>;
  handleSaveConfig: () => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function GeneralSettings({ 
  localConfig, 
  setLocalConfig, 
  handleSaveConfig, 
  onLogoUpload 
}: GeneralSettingsProps) {
  const configFields = ['companyName', 'address', 'taxId', 'crNumber', 'currency', 'language'] as const;
  const filled = configFields.filter(f => localConfig[f]).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">اكتمال الإعدادات</p>
            <Building2 className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{filled}/{configFields.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">الشعار</p>
            <Upload className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-sm font-black truncate mt-1.5">{localConfig.logo ? 'تم الرفع ✓' : 'غير مرفوع'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">العملة</p>
            <Building2 className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-sm font-black truncate mt-1.5">{localConfig.currency || 'ج.م'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">اللغة</p>
            <Building2 className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-sm font-black truncate mt-1.5">{localConfig.language === 'en' ? 'English' : 'العربية'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black">إعدادات الشركة والهوية</h3>
        <button onClick={handleSaveConfig} className="bg-black text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Save className="w-4 h-4" /> حفظ التغييرات
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <span className="font-black">معلومات المنشأة</span>
          </div>
          <div className="space-y-3">
            <FormField label="اسم الشركة">
              <input 
                type="text" 
                className="w-full bg-gray-50 rounded-xl px-4 py-2 font-bold" 
                value={localConfig.companyName || ''}
                onChange={e => setLocalConfig({...localConfig, companyName: e.target.value})}
              />
            </FormField>
            <FormField label="العنوان بالتفصيل">
              <input 
                type="text" 
                className="w-full bg-gray-50 rounded-xl px-4 py-2 font-bold" 
                value={localConfig.address || ''}
                onChange={e => setLocalConfig({...localConfig, address: e.target.value})}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="الرقم الضريبي">
                <input 
                  type="text" 
                  className="w-full bg-gray-50 rounded-xl px-4 py-2 font-bold" 
                  value={localConfig.taxId || ''}
                  onChange={e => setLocalConfig({...localConfig, taxId: e.target.value})}
                />
              </FormField>
              <FormField label="السجل التجاري">
                <input 
                  type="text" 
                  className="w-full bg-gray-50 rounded-xl px-4 py-2 font-bold" 
                  value={localConfig.crNumber || ''}
                  onChange={e => setLocalConfig({...localConfig, crNumber: e.target.value})}
                />
              </FormField>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <span className="font-black">هوية النظام</span>
          </div>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl p-8 gap-3 bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors">
             <input type="file" className="hidden" accept="image/*" onChange={onLogoUpload} />
             {localConfig.logo ? (
               <img src={localConfig.logo} alt="Logo" className="w-20 h-20 object-contain rounded-2xl" />
             ) : (
               <div className="w-20 h-20 bg-white shadow-sm rounded-2xl flex items-center justify-center text-gray-300">
                  <Upload className="w-8 h-8" />
               </div>
             )}
             <span className="text-xs font-bold">رفع لوجو الشركة</span>
             <p className="text-[10px] text-gray-400">يفضل صيغة PNG بخلفية شفافة</p>
          </label>
          <div className="grid grid-cols-2 gap-3">
              <FormField label="العملة">
                <select 
                  className="w-full bg-gray-50 rounded-xl px-4 py-2 font-bold"
                  value={localConfig.currency}
                  onChange={e => setLocalConfig({...localConfig, currency: e.target.value})}
                >
                  <option value="ج.م">جنية مصري (ج.م)</option>
                  <option value="USD">Dollar ($)</option>
                  <option value="SAR">ريال سعودي</option>
                </select>
              </FormField>
              <FormField label="اللغة">
                <select 
                  className="w-full bg-gray-50 rounded-xl px-4 py-2 font-bold"
                  value={localConfig.language}
                  onChange={e => setLocalConfig({...localConfig, language: e.target.value})}
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </FormField>
            </div>
        </Card>
      </div>
    </div>
  );
}
