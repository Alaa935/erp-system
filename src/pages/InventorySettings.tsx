import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  Boxes, Package, AlertTriangle, BarChart3, Barcode, Calendar,
  RefreshCw, Truck, Warehouse, TrendingUp, TrendingDown, Layers,
  Save, Plus, X, CheckCircle2, Clock, ArrowRightLeft, Settings2
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function InventorySettings() {
  const config = useLiveQuery(() => db.systemConfig.get('default'));
  const items = useLiveQuery(() => db.items.toArray());
  const transactions = useLiveQuery(() => db.inventoryTransactions.orderBy('timestamp').reverse().limit(10).toArray());

  const [lowStockAlerts, setLowStockAlerts] = useState(config?.lowStockAlerts ?? true);
  const [minStockLevel, setMinStockLevel] = useState(config?.minStockLevel || 20);
  const [trackingSystem, setTrackingSystem] = useState(config?.trackingSystem || 'none');

  const lowStockCount = items?.filter(i => i.quantity <= i.minQuantity).length || 0;
  const outOfStockCount = items?.filter(i => i.quantity === 0).length || 0;
  const totalValue = items?.reduce((s, i) => s + (i.purchasePrice || 0) * i.quantity, 0) || 0;

  const warehouseStats = [
    { label: 'إجمالي الأصناف', value: items?.length || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'قيمة المخزون', value: formatCurrency(totalValue), icon: BarChart3, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'أصناف منخفضة', value: lowStockCount, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'نفد المخزون', value: outOfStockCount, icon: X, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const handleSave = async () => {
    try {
      await db.systemConfig.update('default', { lowStockAlerts, minStockLevel, trackingSystem: trackingSystem as any });
      toast.success('تم حفظ إعدادات المخزون');
    } catch { toast.error('فشل حفظ الإعدادات'); }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-black">إعدادات المخزون</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة التنبيهات، التتبع، وإعدادات المستودع</p>
        </div>
        <button onClick={handleSave}
          className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
        ><Save className="w-4 h-4" />حفظ الإعدادات</button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {warehouseStats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all"
          >
            <div className={cn("p-2.5 rounded-xl w-fit mb-2", stat.bg)}><stat.icon className={cn("w-5 h-5", stat.color)} /></div>
            <h3 className="text-xl font-black text-black">{stat.value}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alerts Config */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-black" />
            <h3 className="font-black text-black text-sm">تنبيهات المخزون</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs font-bold text-black">التنبيه عند انخفاض المخزون</p>
              <p className="text-[10px] text-gray-400">إرسال إشعار عند وصول الصنف للحد الأدنى</p>
            </div>
            <button onClick={() => setLowStockAlerts(!lowStockAlerts)}
              className={cn("p-2 rounded-lg transition-all", lowStockAlerts ? 'bg-green-50 text-green-600' : 'bg-gray-200 text-gray-400')}
            >{lowStockAlerts ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}</button>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block">الحد الأدنى الافتراضي للمخزون</label>
            <div className="flex items-center gap-3">
              <input type="range" min={5} max={100} value={minStockLevel} onChange={e => setMinStockLevel(Number(e.target.value))}
                className="flex-1 accent-black" />
              <span className="text-sm font-black text-black min-w-[40px]">{minStockLevel}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="text-xs font-bold text-gray-500 mb-2 block">نظام تتبع المخزون</label>
            <div className="flex gap-3">
              {[
                { value: 'none', label: 'بدون تتبع', icon: Boxes },
                { value: 'batch', label: 'تتبع الدفعات', icon: Layers },
                { value: 'serial', label: 'تتبع الأرقام التسلسلية', icon: Barcode },
              ].map(t => (
                <button key={t.value} onClick={() => setTrackingSystem(t.value as 'none' | 'batch' | 'serial')}
                  className={cn("flex-1 p-4 rounded-xl border-2 text-center transition-all",
                    trackingSystem === t.value ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                  )}
                >
                  <t.icon className={cn("w-5 h-5 mx-auto mb-1", trackingSystem === t.value ? 'text-black' : 'text-gray-400')} />
                  <span className={cn("text-[10px] font-bold", trackingSystem === t.value ? 'text-black' : 'text-gray-500')}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Movements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <ArrowRightLeft className="w-4 h-4 text-black" />
            <h3 className="font-black text-black text-sm">آخر حركات المخزون</h3>
          </div>
          <div className="space-y-2">
            {transactions?.map((t: any, i: number) => (
              <div key={t.id || i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  t.type === 'increase' ? 'bg-green-50' : 'bg-red-50'
                )}>
                  {t.type === 'increase' ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-black">{t.reason}</p>
                  <p className="text-[10px] text-gray-400">{t.diff} وحدة - {t.source}</p>
                </div>
                <span className="text-[9px] text-gray-400">{new Date(t.timestamp).toLocaleDateString('ar-EG')}</span>
              </div>
            ))}
            {(!transactions || transactions.length === 0) && (
              <p className="text-center text-gray-400 text-sm py-6">لا توجد حركات مخزون</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
