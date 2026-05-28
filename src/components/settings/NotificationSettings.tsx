import React from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/design-system/Card';
import type { SystemConfig } from '../../types';

interface NotificationSettingsProps {
  config: SystemConfig | undefined;
  localConfig: Partial<SystemConfig>;
  setLocalConfig: React.Dispatch<React.SetStateAction<Partial<SystemConfig>>>;
  handleSaveConfig: () => void;
}

export function NotificationSettings({ 
  localConfig, 
  setLocalConfig 
}: NotificationSettingsProps) {
  const emailOn = localConfig.emailNotifications;
  const stockOn = localConfig.lowStockAlerts;
  const activeChannels = [emailOn, stockOn].filter(Boolean).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">القنوات النشطة</p>
            <Mail className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{activeChannels}/2</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">إشعارات البريد</p>
            <Mail className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-sm font-black truncate mt-1.5">{emailOn ? 'مفعل' : 'معطل'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">تنبيه المخزون</p>
            <Mail className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-sm font-black truncate mt-1.5">{stockOn ? 'مفعل' : 'معطل'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">رقم الواتساب</p>
            <Mail className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-sm font-black truncate mt-1.5">{localConfig.phone || '—'}</p>
        </div>
      </div>

      <h3 className="text-xl font-black">مركز الإشعارات والتواصل</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg" className="space-y-6">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-2xl"><CheckCircle2 className="w-6 h-6 text-green-600" /></div>
              <div>
                 <p className="font-black leading-none mb-1">إشعارات WhatsApp</p>
                 <p className="text-[10px] text-gray-400 font-bold">إرسال تقارير يومية وفواتير عبر الواتساب</p>
              </div>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-xs font-black">تفعيل الخدمة</span>
              <div 
                onClick={() => setLocalConfig({...localConfig, emailNotifications: !localConfig.emailNotifications})}
                className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${localConfig.emailNotifications ? "bg-black" : "bg-gray-200"}`}
              >
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${localConfig.emailNotifications ? "left-7" : "left-1"}`} />
              </div>
           </div>
           <input 
             type="text" 
             placeholder="رقم الواتساب الرئيسي" 
             className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold border-none" 
             value={localConfig.phone || ''}
             onChange={e => setLocalConfig({...localConfig, phone: e.target.value})}
           />
        </Card>

        <Card padding="lg" className="space-y-4">
           <span className="font-black flex items-center gap-2"><Mail className="w-5 h-5" /> إشعارات البريد</span>
           {[
             { key: 'emailNotifications', label: 'إشعار بطلب شراء جديد' },
             { key: 'lowStockAlerts', label: 'إشعار بانخفاض المخزون' },
           ].map((n, i) => (
             <div key={i} className="flex justify-between items-center py-2">
               <span className="text-xs font-bold text-gray-500">{n.label}</span>
               <div 
                 onClick={() => setLocalConfig({...localConfig, [n.key]: !localConfig[n.key as keyof SystemConfig]})}
                 className={`w-10 h-5 rounded-full relative cursor-pointer ${localConfig[n.key as keyof SystemConfig] ? "bg-black" : "bg-gray-200"}`}>
                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localConfig[n.key as keyof SystemConfig] ? "left-6" : "left-1"}`} />
               </div>
             </div>
           ))}
        </Card>
      </div>
    </div>
  );
}
