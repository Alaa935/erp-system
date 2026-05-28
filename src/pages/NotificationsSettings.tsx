import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  Bell, MessageSquare, Send, Mail, Smartphone, CheckCircle2, X,
  Save, Activity, RefreshCw, AlertCircle, Phone, Globe, Settings2
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const channels = [
  { id: 'whatsapp', label: 'واتساب', icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'telegram', label: 'تيليجرام', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'email', label: 'البريد الإلكتروني', icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'sms', label: 'رسائل SMS', icon: Smartphone, color: 'text-orange-600', bg: 'bg-orange-50' },
];

export default function NotificationsSettings() {
  const config = useLiveQuery(() => db.systemConfig.get('default'));
  const notifications = useLiveQuery(() => db.notifications.orderBy('date').reverse().limit(20).toArray());

  const [channelsState, setChannelsState] = useState({
    whatsapp: config?.whatsappNotifications ?? true,
    telegram: true,
    email: config?.emailNotifications ?? true,
    sms: false,
  });

  const toggleChannel = (id: string) => {
    setChannelsState(prev => ({ ...prev, [id]: !(prev as any)[id] }));
  };

  const handleTest = (channel: string) => {
    toast.success(`تم إرسال إشعار تجريبي عبر ${channels.find(c => c.id === channel)?.label}`);
  };

  const handleSave = async () => {
    try {
      await db.systemConfig.update('default', {
        whatsappNotifications: channelsState.whatsapp,
        emailNotifications: channelsState.email,
      });
      toast.success('تم حفظ إعدادات الإشعارات');
    } catch { toast.error('فشل حفظ الإعدادات'); }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-black">الإشعارات</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة قنوات الإشعارات والتواصل</p>
        </div>
        <button onClick={handleSave}
          className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
        ><Save className="w-4 h-4" />حفظ</button>
      </motion.div>

      {/* Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {channels.map((ch, i) => (
          <motion.div key={ch.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn("p-2.5 rounded-xl", ch.bg)}><ch.icon className={cn("w-5 h-5", ch.color)} /></div>
              <button onClick={() => toggleChannel(ch.id)}
                className={cn("p-1.5 rounded-lg transition-all", (channelsState as any)[ch.id] ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400')}
              >{(channelsState as any)[ch.id] ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}</button>
            </div>
            <h3 className="font-black text-black text-sm mb-1">{ch.label}</h3>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", (channelsState as any)[ch.id] ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400')}>
              {(channelsState as any)[ch.id] ? 'مفعل' : 'معطل'}
            </span>
            <button onClick={() => handleTest(ch.id)} disabled={!(channelsState as any)[ch.id]}
              className="w-full mt-3 py-2 rounded-xl text-[10px] font-bold border border-gray-100 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >إرسال إشعار تجريبي</button>
          </motion.div>
        ))}
      </div>

      {/* Logs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-black" />
          <h3 className="font-black text-black text-sm">سجل الإشعارات</h3>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {notifications?.map((n: any, i: number) => (
            <div key={n.id || i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                n.type === 'warning' ? 'bg-orange-50 text-orange-600' :
                n.type === 'success' ? 'bg-green-50 text-green-600' :
                n.type === 'error' ? 'bg-red-50 text-red-600' :
                'bg-blue-50 text-blue-600'
              )}>
                {n.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                 n.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                 <Bell className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-black">{n.title}</p>
                <p className="text-[10px] text-gray-400 truncate">{n.message}</p>
              </div>
              <span className="text-[9px] text-gray-400 shrink-0">{formatDate(n.date)}</span>
            </div>
          ))}
          {(!notifications || notifications.length === 0) && (
            <p className="text-center text-gray-400 text-sm py-6">لا توجد إشعارات</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
