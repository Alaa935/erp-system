import React from 'react';
import { Save, Receipt, Printer } from 'lucide-react';
import { Card } from '../../components/design-system/Card';
import { FormField } from '../../components/design-system/FormField';
import type { SystemConfig } from '../../types';

interface InvoiceSettingsProps {
  config: SystemConfig | undefined;
  localConfig: Partial<SystemConfig>;
  setLocalConfig: React.Dispatch<React.SetStateAction<Partial<SystemConfig>>>;
  handleSaveConfig: () => void;
}

export function InvoiceSettings({ 
  localConfig, 
  setLocalConfig, 
  handleSaveConfig 
}: InvoiceSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">البادئة</p>
            <Receipt className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-sm font-black truncate mt-1.5">{localConfig.invoicePrefix || '—'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">الرقم القادم</p>
            <Receipt className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{localConfig.invoiceNextNumber || 1}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">QR Code</p>
            <Printer className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-sm font-black truncate mt-1.5">{localConfig.qrCodeEnabled ? 'مفعل' : 'معطل'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">الضريبة</p>
            <Receipt className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-sm font-black truncate mt-1.5">{localConfig.vatRate || 0}%</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black">إعدادات الفواتير والطباعة</h3>
        <button onClick={handleSaveConfig} className="bg-black text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
          <Save className="w-4 h-4" /> حفظ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg" className="space-y-4">
           <span className="font-black flex items-center gap-2"><Receipt className="w-5 h-5" /> تسلسل الفواتير</span>
           <div className="grid grid-cols-2 gap-4">
              <FormField label="بادئة الفاتورة (Prefix)">
                <input 
                  type="text" 
                  className="w-full bg-gray-50 rounded-xl px-4 py-2 font-bold" 
                  value={localConfig.invoicePrefix || ''}
                  onChange={e => setLocalConfig({...localConfig, invoicePrefix: e.target.value})}
                />
              </FormField>
              <FormField label="الرقم القادم">
                <input 
                  type="number" 
                  className="w-full bg-gray-50 rounded-xl px-4 py-2 font-bold" 
                  value={isNaN(localConfig.invoiceNextNumber || 0) ? '' : localConfig.invoiceNextNumber}
                  onChange={e => setLocalConfig({...localConfig, invoiceNextNumber: parseInt(e.target.value) || 0})}
                />
              </FormField>
           </div>
        </Card>

        <Card padding="lg" className="space-y-4">
           <span className="font-black flex items-center gap-2"><Printer className="w-5 h-5" /> خيارات الطباعة</span>
           <div className="space-y-3">
              <div 
                onClick={() => setLocalConfig({...localConfig, qrCodeEnabled: !localConfig.qrCodeEnabled})}
                className="flex justify-between items-center bg-gray-50 p-3 rounded-xl cursor-pointer"
              >
                 <span className="text-xs font-bold">طباعة الـ QR Code</span>
                 <div className={`w-10 h-5 rounded-full relative transition-colors ${localConfig.qrCodeEnabled ? "bg-black" : "bg-gray-200"}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localConfig.qrCodeEnabled ? "left-1" : "right-1"}`} />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="حجم الورقة الافتراضي">
                  <select 
                    className="w-full bg-gray-50 rounded-xl px-4 py-2 font-bold text-xs"
                    value={localConfig.paperSize}
                    onChange={e => setLocalConfig({...localConfig, paperSize: e.target.value as any})}
                  >
                    <option value="A4">A4 Paper</option>
                    <option value="Thermal 80mm">Thermal 80mm</option>
                    <option value="Thermal 58mm">Thermal 58mm</option>
                  </select>
                </FormField>
                <FormField label="نسبة الضريبة (VAT)">
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full bg-gray-50 rounded-xl px-4 py-2 font-bold" 
                      value={isNaN(localConfig.vatRate || 0) ? '' : localConfig.vatRate}
                      onChange={e => setLocalConfig({...localConfig, vatRate: parseFloat(e.target.value) || 0})}
                    />
                    <span className="absolute left-3 top-2 text-xs font-black text-gray-400">%</span>
                  </div>
                </FormField>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
