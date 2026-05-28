import React, { useState } from 'react';
import {
  Lock, Shield, Key, Smartphone, Globe, LogIn, AlertTriangle,
  CheckCircle2, X, Plus, Trash2, Copy, Eye, EyeOff, RefreshCw,
  Clock, Monitor, Wifi, Fingerprint, BadgeCheck, AlertCircle,
  Download, Upload, FileText, QrCode, ToggleLeft, ToggleRight
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const mockLoginHistory = [
  { id: 1, device: 'Chrome/Windows', ip: '197.54.32.18', location: 'القاهرة، مصر', date: Date.now() - 3600000, success: true },
  { id: 2, device: 'Safari/iPhone', ip: '197.54.32.19', location: 'الجيزة، مصر', date: Date.now() - 86400000, success: true },
  { id: 3, device: 'Firefox/Linux', ip: '85.103.45.2', location: 'الإسكندرية، مصر', date: Date.now() - 172800000, success: false },
  { id: 4, device: 'Edge/Windows', ip: '197.54.32.20', location: 'الغردقة، مصر', date: Date.now() - 259200000, success: true },
];

interface ApiKey {
  id: number;
  name: string;
  key: string;
  createdAt: number;
  lastUsed: number | null;
  active: boolean;
}

export default function SecurityPage() {
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: 1, name: 'تطبيق الفواتير', key: 'sk_live_3f8a2b1c...', createdAt: Date.now() - 86400000 * 30, lastUsed: Date.now() - 3600000, active: true },
    { id: 2, name: 'موقع المتجر الإلكتروني', key: 'sk_live_7d9e4f5g...', createdAt: Date.now() - 86400000 * 15, lastUsed: Date.now() - 86400000 * 2, active: true },
  ]);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [backupCodes] = useState([
    'ABCD-1234-EFGH', 'IJKL-5678-MNOP', 'QRST-9012-UVWX',
    'YZAB-3456-CDEF', 'GHIJ-7890-KLMN', 'OPQR-1234-STUV',
  ]);

  const securityScore = (() => {
    let score = 0;
    if (twoFactorEnabled) score += 30;
    if (sessionTimeout <= 30) score += 20;
    if (apiKeys.length > 0) score += 20;
    if (backupCodes.length > 0) score += 15;
    return Math.min(score + 15, 100);
  })();

  const handleDeleteKey = (id: number) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    toast.success('تم حذف مفتاح API');
  };

  const handleAddKey = () => {
    if (!newKeyName.trim()) { toast.error('يرجى إدخال اسم للمفتاح'); return; }
    const newKey: ApiKey = {
      id: Date.now(), name: newKeyName, key: `sk_live_${Math.random().toString(36).substr(2, 10)}...`,
      createdAt: Date.now(), lastUsed: null, active: true,
    };
    setApiKeys(prev => [...prev, newKey]);
    setNewKeyName('');
    setShowNewKeyForm(false);
    toast.success('تم إنشاء مفتاح API جديد');
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-black">الأمان والخصوصية</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة إعدادات الأمان، الجلسات، والمفاتيح</p>
        </div>
      </motion.div>

      {/* Security Score */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-xl", securityScore >= 80 ? 'bg-green-50' : securityScore >= 50 ? 'bg-yellow-50' : 'bg-red-50')}>
              <Shield className={cn("w-6 h-6", securityScore >= 80 ? 'text-green-600' : securityScore >= 50 ? 'text-yellow-600' : 'text-red-600')} />
            </div>
            <div>
              <h3 className="font-black text-black">درجة الأمان</h3>
              <p className="text-xs text-gray-500">مستوى حماية الحساب</p>
            </div>
          </div>
          <div className="text-center">
            <div className={cn("text-3xl font-black", securityScore >= 80 ? 'text-green-600' : securityScore >= 50 ? 'text-yellow-600' : 'text-red-600')}>
              {securityScore}%
            </div>
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${securityScore}%` }} transition={{ duration: 1 }}
            className={cn("h-full rounded-full", securityScore >= 80 ? 'bg-green-500' : securityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500')}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'المصادقة الثنائية', active: twoFactorEnabled, icon: Fingerprint },
            { label: 'مفاتيح API', active: apiKeys.length > 0, icon: Key },
            { label: 'رموز النسخ الاحتياطي', active: backupCodes.length > 0, icon: FileText },
            { label: 'مهلة الجلسة', active: sessionTimeout <= 30, icon: Clock },
          ].map((item, i) => (
            <div key={i} className={cn("p-3 rounded-xl text-center", item.active ? 'bg-green-50' : 'bg-gray-50')}>
              <item.icon className={cn("w-4 h-4 mx-auto mb-1", item.active ? 'text-green-600' : 'text-gray-400')} />
              <p className={cn("text-[10px] font-bold", item.active ? 'text-green-600' : 'text-gray-400')}>{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Login History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <LogIn className="w-4 h-4 text-black" />
            <h3 className="font-black text-black text-sm">سجل تسجيل الدخول</h3>
          </div>
          <div className="space-y-2">
            {mockLoginHistory.map(h => (
              <div key={h.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", h.success ? 'bg-green-50' : 'bg-red-50')}>
                  {h.success ? <Monitor className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-black">{h.device}</p>
                  <p className="text-[10px] text-gray-400">{h.ip} - {h.location}</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-gray-500">{formatDate(h.date)}</p>
                  <span className={cn("text-[9px] font-bold", h.success ? 'text-green-600' : 'text-red-600')}>
                    {h.success ? 'ناجح' : 'فشل'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Session & 2FA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5"
        >
          {/* Session Timeout */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-black" />
              <h3 className="font-black text-black text-sm">مهلة انتهاء الجلسة</h3>
            </div>
            <div className="flex items-center gap-3">
              <input type="range" min={5} max={120} value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))}
                className="flex-1 accent-black" />
              <span className="text-sm font-black text-black min-w-[60px]">{sessionTimeout} دقيقة</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">بعد {sessionTimeout} دقيقة من عدم النشاط، سيتم تسجيل الخروج تلقائياً</p>
          </div>

          {/* 2FA */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-black" />
                <div>
                  <h3 className="font-black text-black text-sm">المصادقة الثنائية (2FA)</h3>
                  <p className="text-[10px] text-gray-400">حماية إضافية للحساب</p>
                </div>
              </div>
              <button onClick={() => { setTwoFactorEnabled(!twoFactorEnabled); toast.success(twoFactorEnabled ? 'تم تعطيل المصادقة الثنائية' : 'تم تفعيل المصادقة الثنائية'); }}
                className={cn("p-2 rounded-lg transition-all", twoFactorEnabled ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400')}
              >
                {twoFactorEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Logout All */}
          <div className="border-t border-gray-100 pt-4">
            <button onClick={() => toast.success('تم تسجيل الخروج من جميع الأجهزة')}
              className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold text-xs hover:bg-red-100 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 rotate-180" />
              تسجيل الخروج من جميع الأجهزة
            </button>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* API Keys */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-gray-100 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-black" />
              <h3 className="font-black text-black text-sm">مفاتيح API</h3>
            </div>
            <button onClick={() => setShowNewKeyForm(!showNewKeyForm)}
              className="bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:opacity-90 transition-all flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />جديد
            </button>
          </div>

          <AnimatePresence>
            {showNewKeyForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-3 p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex gap-2">
                  <input type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                    className="flex-1 bg-white border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-black transition-all"
                    placeholder="اسم المفتاح" />
                  <button onClick={handleAddKey} className="bg-black text-white px-3 py-2 rounded-lg text-[10px] font-bold">إنشاء</button>
                  <button onClick={() => setShowNewKeyForm(false)} className="p-2 text-gray-400 hover:text-black"><X className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {apiKeys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-black">{k.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-mono">
                      {showApiKeys ? k.key : k.key.slice(0, 12) + '••••••'}
                    </code>
                    <button onClick={() => setShowApiKeys(!showApiKeys)} className="text-gray-400 hover:text-black">
                      {showApiKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    {k.lastUsed ? `آخر استخدام: ${formatDate(k.lastUsed)}` : 'لم يستخدم بعد'}
                  </p>
                </div>
                <button onClick={() => handleDeleteKey(k.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Backup Codes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-black" />
              <h3 className="font-black text-black text-sm">رموز الاسترجاع الاحتياطية</h3>
            </div>
            <button onClick={() => toast.success('تم نسخ الرموز')}
              className="bg-gray-100 text-black px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-200 transition-all flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />نسخ
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <div key={i} className="font-mono text-xs font-bold text-gray-700 bg-white rounded-lg px-3 py-2 text-center border border-gray-100">
                  {code}
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-3">استخدم هذه الرموز لمرة واحدة عند فقدان الوصول إلى جهاز المصادقة الثنائية</p>
          <button onClick={() => toast.success('تم إنشاء رموز جديدة')}
            className="mt-3 text-xs font-bold text-black hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />إنشاء رموز جديدة
          </button>
        </motion.div>
      </div>
    </div>
  );
}
