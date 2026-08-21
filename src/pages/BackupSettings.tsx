import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  Cloud, Download, Upload, RefreshCw, Clock, Calendar,
  CheckCircle2, AlertCircle, Shield, Trash2, HardDrive,
  Globe, Lock, History, ChevronLeft, ChevronRight, Save,
  Server, Database
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const schedules = [
  { value: 'daily', label: 'يومي', desc: 'كل 24 ساعة' },
  { value: 'weekly', label: 'أسبوعي', desc: 'كل يوم أحد' },
  { value: 'monthly', label: 'شهري', desc: 'أول كل شهر' },
  { value: 'manual', label: 'يدوي', desc: 'نسخ احتياطي يدوي فقط' },
];

const storageProviders = [
  { id: 'local', label: 'محلي', icon: HardDrive, color: 'text-gray-600', bg: 'bg-gray-50' },
  { id: 'google', label: 'Google Drive', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'dropbox', label: 'Dropbox', icon: Cloud, color: 'text-blue-600', bg: 'bg-blue-50' },
];

const mockBackups = [
  { id: 1, name: 'نسخة احتياطية كاملة', date: Date.now() - 3600000, size: '24.5 MB', type: 'تلقائي', status: 'success' },
  { id: 2, name: 'نسخة احتياطية كاملة', date: Date.now() - 86400000, size: '24.3 MB', type: 'تلقائي', status: 'success' },
  { id: 3, name: 'نسخة احتياطية قبل التحديث', date: Date.now() - 172800000, size: '24.1 MB', type: 'يدوي', status: 'success' },
  { id: 4, name: 'نسخة احتياطية كاملة', date: Date.now() - 259200000, size: '23.9 MB', type: 'تلقائي', status: 'success' },
  { id: 5, name: 'نسخة احتياطية', date: Date.now() - 432000000, size: '23.5 MB', type: 'يدوي', status: 'failed' },
];

export default function BackupSettings() {
  const [schedule, setSchedule] = useState('weekly');
  const [storage, setStorage] = useState('local');
  const [encryption, setEncryption] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const data = {
        items: await db.items.toArray(),
        suppliers: await db.suppliers.toArray(),
        customers: await db.customers.toArray(),
        purchaseOrders: await db.purchaseOrders.toArray(),
        salesOrders: await db.salesOrders.toArray(),
        taxes: await db.taxes.toArray(),
        config: await db.systemConfig.toArray(),
        timestamp: Date.now(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('تم إنشاء النسخة الاحتياطية بنجاح');
    } catch {
      toast.error('فشل إنشاء النسخة الاحتياطية');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.items) {
          await db.items.clear();
          await db.items.bulkAdd(data.items);
        }
        toast.success('تم استعادة النسخة الاحتياطية بنجاح');
      } catch { toast.error('فشل استعادة النسخة الاحتياطية'); }
    };
    reader.readAsText(file);
  };

  const totalSize = mockBackups.reduce((s, b) => s + parseFloat(b.size), 0);

  return (
    <div className="space-y-5" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-black">النسخ الاحتياطي</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة النسخ الاحتياطية واستعادة البيانات</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="bg-white border border-gray-200 text-black px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />استعادة
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>
          <button onClick={handleBackup} disabled={isBackingUp}
            className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
          ><Download className={cn("w-4 h-4", isBackingUp && 'animate-spin')} />{isBackingUp ? 'جاري...' : 'نسخ احتياطي الآن'}</button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي النسخ', value: mockBackups.length, icon: Cloud, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'آخر نسخة', value: mockBackups[0] ? formatDate(mockBackups[0].date) : 'لا يوجد', icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'الحجم الإجمالي', value: `${totalSize.toFixed(1)} MB`, icon: HardDrive, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'آخر استعادة', value: 'منذ 7 أيام', icon: History, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className={cn("p-2.5 rounded-xl w-fit mb-2", stat.bg)}><stat.icon className={cn("w-5 h-5", stat.color)} /></div>
            <h3 className="text-xl font-black text-black" style={{ fontSize: stat.label === 'آخر نسخة' ? '14px' : '' }}>{stat.value}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Schedule */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-black" />
              <h3 className="font-black text-black text-sm">جدولة النسخ الاحتياطي التلقائي</h3>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {schedules.map(s => (
                <button key={s.value} onClick={() => setSchedule(s.value)}
                  className={cn("p-4 rounded-xl border-2 text-center transition-all",
                    schedule === s.value ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                  )}
                >
                  <p className={cn("text-xs font-bold", schedule === s.value ? 'text-black' : 'text-gray-500')}>{s.label}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Restore Timeline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-black" />
              <h3 className="font-black text-black text-sm">النسخ الاحتياطية السابقة</h3>
            </div>
            <div className="space-y-2">
              {mockBackups.map((b, i) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    b.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                  )}>
                    {b.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-black">{b.name}</p>
                    <p className="text-[10px] text-gray-400">{b.size} - {b.type}</p>
                  </div>
                  <span className="text-[9px] text-gray-400">{formatDate(b.date)}</span>
                  <button onClick={() => toast.success('تم استعادة النسخة')}
                    className="text-[10px] font-bold text-black hover:underline px-2">استعادة</button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="space-y-5">
          {/* Storage */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-black" />
              <h3 className="font-black text-black text-sm">موقع التخزين</h3>
            </div>
            <div className="space-y-2">
              {storageProviders.map(p => (
                <button key={p.id} onClick={() => setStorage(p.id)}
                  className={cn("w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                    storage === p.id ? 'border-black bg-gray-50' : 'border-gray-100'
                  )}
                >
                  <div className={cn("p-2 rounded-lg", p.bg)}><p.icon className={cn("w-5 h-5", p.color)} /></div>
                  <span className={cn("text-xs font-bold", storage === p.id ? 'text-black' : 'text-gray-500')}>{p.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Encryption */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-black" />
              <h3 className="font-black text-black text-sm">التشفير</h3>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs font-bold text-black">تشفير النسخ الاحتياطية</p>
                <p className="text-[10px] text-gray-400">AES-256 لحماية البيانات</p>
              </div>
              <button onClick={() => setEncryption(!encryption)}
                className={cn("p-2 rounded-lg transition-all", encryption ? 'bg-green-50 text-green-600' : 'bg-gray-200 text-gray-400')}
              >{encryption ? <Lock className="w-5 h-5" /> : <Lock className="w-5 h-5 opacity-30" />}</button>
            </div>
            {encryption && (
              <p className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />البيانات مشفرة بـ AES-256
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
