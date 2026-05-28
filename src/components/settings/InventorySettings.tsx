import React from 'react';
import { Boxes, Globe, X } from 'lucide-react';
import { Card } from '../../components/design-system/Card';
import { FormField } from '../../components/design-system/FormField';
import type { SystemConfig } from '../../types';

interface InventorySettingsProps {
  config: SystemConfig | undefined;
  localConfig: Partial<SystemConfig>;
  setLocalConfig: React.Dispatch<React.SetStateAction<Partial<SystemConfig>>>;
  handleSaveConfig: () => void;
  units: string[];
  setUnits: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenUnitModal: () => void;
}

export function InventorySettings({ 
  localConfig, 
  setLocalConfig, 
  units, 
  setUnits,
  onOpenUnitModal
}: InventorySettingsProps) {
  const trackingLabels: Record<string, string> = { batch: 'Batch/Expiry', serial: 'رقم مسلسل', none: 'بدون تتبع' };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">وحدات القياس</p>
            <Boxes className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{units.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">نظام التتبع</p>
            <Boxes className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-sm font-black truncate mt-1.5">{trackingLabels[localConfig.trackingSystem || 'none']}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">الحد الأدنى</p>
            <Boxes className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{localConfig.minStockLevel || 0}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">التنبيهات</p>
            <Boxes className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-sm font-black truncate mt-1.5">{localConfig.lowStockAlerts ? 'مفعلة' : 'معطلة'}</p>
        </div>
      </div>

      <h3 className="text-xl font-black">إعدادات المخزون والتوريد</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg" className="space-y-4">
          <span className="font-black flex items-center gap-2"><Boxes className="w-5 h-5" /> التحكم في المخزون</span>
          <div className="space-y-4">
            <div 
              onClick={() => setLocalConfig({...localConfig, lowStockAlerts: !localConfig.lowStockAlerts})}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl cursor-pointer"
            >
              <span className="text-xs font-bold">تنبيه قرب نفاد المخزون</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${localConfig.lowStockAlerts ? "bg-black" : "bg-gray-200"}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localConfig.lowStockAlerts ? "left-1" : "right-1"}`} />
              </div>
            </div>
            <FormField label="الحد الأدنى لطلب التوريد (افتراضي)">
              <input 
                type="number" 
                className="w-full bg-gray-50 rounded-xl px-4 py-2 font-bold" 
                value={isNaN(localConfig.minStockLevel || 0) ? '' : localConfig.minStockLevel}
                onChange={e => setLocalConfig({...localConfig, minStockLevel: parseInt(e.target.value) || 0})}
              />
            </FormField>
            <FormField label="نظام التتبع">
              <select 
                className="w-full bg-gray-50 rounded-xl px-4 py-2 font-bold text-xs"
                value={localConfig.trackingSystem}
                onChange={e => setLocalConfig({...localConfig, trackingSystem: e.target.value as any})}
              >
                <option value="batch">الباتش وتاريخ الصلالحية (Batch/Expiry)</option>
                <option value="serial">الرقم المسلسل (Serial Number)</option>
                <option value="none">بدون تتبع متقدم</option>
              </select>
            </FormField>
          </div>
        </Card>

        <Card padding="lg" className="space-y-4">
          <span className="font-black flex items-center gap-2"><Globe className="w-5 h-5" /> وحدات القياس</span>
          <div className="flex flex-wrap gap-2">
            {units.map(unit => (
              <span key={unit} className="px-3 py-1 bg-gray-100 rounded-xl text-[10px] font-black flex items-center gap-2">
                {unit}
                <X 
                  className="w-3 h-3 text-gray-300 cursor-pointer" 
                  onClick={() => setUnits(units.filter(u => u !== unit))}
                />
              </span>
            ))}
            <button onClick={onOpenUnitModal} className="px-3 py-1 border border-dashed border-gray-300 rounded-xl text-[10px] font-black">+ إضافة وحدة</button>
          </div>
        </Card>
      </div>
    </div>
  );
}
