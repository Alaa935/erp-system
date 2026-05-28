import React, { useState, useEffect, useMemo } from 'react';
import { User, Lock, Smartphone, Key, History, Activity, Laptop, SmartphoneIcon, LogIn, AlertTriangle, RefreshCw, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { apiKeyManager } from '../../lib/apiKeys';
import { Card } from '../../components/design-system/Card';
import { Badge } from '../../components/design-system/Badge';
import { Button } from '../../components/design-system/Button';
import { EnterpriseTable } from '../../components/design-system/EnterpriseTable';
import { shadow, statusClasses } from '../../components/design-system/tokens';
import type { SystemConfig, ActivityLog } from '../../types';
import { toast } from 'sonner';

interface SecuritySettingsProps {
  config: SystemConfig | undefined;
  logs: ActivityLog[] | undefined;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  setCurrentPassword: (val: string) => void;
  setNewPassword: (val: string) => void;
  setConfirmPassword: (val: string) => void;
  handleUpdatePassword: () => void;
}

export function SecuritySettings({
  config,
  logs,
  currentPassword,
  newPassword,
  confirmPassword,
  setCurrentPassword,
  setNewPassword,
  setConfirmPassword,
  handleUpdatePassword
}: SecuritySettingsProps) {
  const [geminiKey, setGeminiKey] = useState('');

  useEffect(() => {
    apiKeyManager.getGeminiKey().then(key => setGeminiKey(key || ''));
  }, []);
  const loginLogs = logs?.filter(l => l.action.includes('دخول')) || [];

  const securityScore = useMemo(() => {
    let score = 0;
    if (config?.email) score += 20;
    if (geminiKey) score += 20;
    if (config?.language) score += 10;
    if (loginLogs.length > 0) score += 10;
    score += 40;
    return Math.min(100, score);
  }, [config, geminiKey, loginLogs]);

  const scoreLabel = securityScore >= 80 ? 'ممتاز' : securityScore >= 60 ? 'جيد' : 'متوسط';
  const scoreIcon = securityScore >= 80 ? ShieldCheck : securityScore >= 60 ? Shield : ShieldAlert;
  const ScoreIcon = scoreIcon;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <Card padding="sm" className="col-span-1 sm:col-span-1 flex flex-col items-center justify-center text-center gap-1.5">
          <div className={`p-2.5 rounded-xl ${securityScore >= 80 ? 'bg-emerald-50 text-emerald-600' : securityScore >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
            <ScoreIcon className="w-5 h-5" />
          </div>
          <p className="text-lg font-black">{securityScore}%</p>
          <p className="text-[9px] font-bold text-gray-400">مستوى الأمان</p>
          <Badge variant={securityScore >= 80 ? 'success' : securityScore >= 60 ? 'warning' : 'danger'} size="sm">{scoreLabel}</Badge>
        </Card>
        {[
          { label: 'إجمالي تسجيلات الدخول', value: loginLogs.length, icon: LogIn, variant: 'info' as const },
          { label: 'أجهزة نشطة حالياً', value: '2', icon: Laptop, variant: 'success' as const },
          { label: 'محاولات فاشلة', value: '0', icon: AlertTriangle, variant: 'danger' as const },
          { label: 'آخر تغيير للسر', value: 'منذ ١٥ يوم', icon: Key, variant: 'warning' as const }
        ].map((kpi, i) => (
          <Card key={i} padding="sm" className="space-y-1.5">
            <div className={`p-2 ${statusClasses[kpi.variant].bg} w-fit rounded-lg`}>
              <kpi.icon className={`w-4 h-4 ${statusClasses[kpi.variant].text}`} />
            </div>
            <p className="text-[10px] font-bold text-gray-400">{kpi.label}</p>
            <p className="text-lg font-black">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-500" />
              <span className="font-black">تفاصيل الحساب الأساسية</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                 <span className="text-xs font-bold text-gray-400">اسم المستخدم</span>
                 <span className="text-sm font-black">admin_root</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                 <span className="text-xs font-bold text-gray-400">البريد الإلكتروني</span>
                 <span className="text-sm font-black">{config?.email || 'admin@company.com'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                 <span className="text-xs font-bold text-gray-400">تاريخ الانضمام</span>
                 <span className="text-sm font-black">١٢ يناير ٢٠٢٤</span>
              </div>
              <div className="flex justify-between items-center py-2">
                 <span className="text-xs font-bold text-gray-400">المستوى الوظيفي</span>
                 <Badge variant="neutral" size="sm">مدير النظام (SuperAdmin)</Badge>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-500" />
              <span className="font-black">تغيير كلمة المرور</span>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="كلمة المرور الحالية"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-sm outline-none border-2 border-transparent focus:border-black transition-all"
              />
              <input
                type="password"
                placeholder="كلمة المرور الجديدة (4 أحرف على الأقل)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-sm outline-none border-2 border-transparent focus:border-black transition-all"
              />
              <input
                type="password"
                placeholder="تأكيد كلمة المرور الجديدة"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-sm outline-none border-2 border-transparent focus:border-black transition-all"
              />
              <Button onClick={handleUpdatePassword} icon={<RefreshCw className="w-4 h-4" />} className="w-full justify-center">
                تحديث كلمة السر
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-500" />
              <span className="font-black">المصادقة الثنائية (2FA)</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl ring-1 ring-blue-200/50">
              <div className="space-y-1">
                <p className="text-xs font-black text-blue-900">تأمين الحساب المعتمد</p>
                <p className="text-[10px] text-blue-600 font-bold max-w-[200px]">استخدم تطبيق Google Authenticator</p>
              </div>
              <div className="w-11 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </Card>

          <Card padding="lg" className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              <span className="font-black">مفتاح API للذكاء الاصطناعي (Gemini)</span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold">يستخدم لتحليل البيانات في لوحة القيادة</p>
            <div className="flex gap-2">
              <input
                type="password"
                id="gemini-api-key"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="أدخل مفتاح Gemini API"
                className="flex-1 bg-gray-50 rounded-xl px-4 py-3 font-bold text-sm outline-none border-2 border-transparent focus:border-black transition-all"
              />
              <Button
                onClick={async () => {
                  if (geminiKey) {
                    await apiKeyManager.setGeminiKey(geminiKey);
                    toast.success('تم حفظ مفتاح API بنجاح');
                  } else {
                    await apiKeyManager.removeGeminiKey();
                    toast.success('تم إزالة مفتاح API');
                  }
                }}
              >
                حفظ
              </Button>
            </div>
          </Card>

          <Card padding="lg" className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5" />
              <span className="font-black">الأجهزة النشطة وجلسات الدخول</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-br from-emerald-50 to-white rounded-xl ring-1 ring-emerald-200/50">
                <div className="flex items-center gap-3">
                  <Laptop className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Chrome on Windows</p>
                    <p className="text-[9px] text-emerald-600 font-bold">نشط الآن • 192.168.1.1</p>
                  </div>
                </div>
                <Badge variant="success" size="sm">هذا الجهاز</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl ring-1 ring-gray-100">
                <div className="flex items-center gap-3">
                  <SmartphoneIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs font-bold">Safari on iPhone 15</p>
                    <p className="text-[9px] text-gray-400 font-bold">القاهرة • منذ ٢ ساعة</p>
                  </div>
                </div>
                <button className="text-[9px] text-rose-500 font-black hover:underline px-2 py-1 bg-rose-50 rounded-lg">إنهاء الجلسة</button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <EnterpriseTable
        data={loginLogs.slice(0, 20)}
        keyExtractor={(log) => log.id!}
        searchable
        pagination={false}
        searchKeys={['username', 'details']}
        searchPlaceholder="بحث في سجل الدخول..."
        columns={[
          {
            key: 'details',
            label: 'الحدث',
            render: (log: ActivityLog) => (
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-50 rounded-lg"><LogIn className="w-3 h-3 text-blue-600" /></div>
                <span className="text-xs font-bold text-gray-600">{log.details}</span>
              </div>
            ),
          },
          {
            key: 'user',
            label: 'المستخدم',
            className: 'w-28',
            render: (log: ActivityLog) => (
              <span className="text-xs font-black">{log.username}</span>
            ),
          },
          {
            key: 'timestamp',
            label: 'التاريخ',
            className: 'w-28 hidden md:table-cell',
            render: (log: ActivityLog) => (
              <span className="text-[10px] font-bold text-gray-400">{formatDate(log.timestamp)}</span>
            ),
          },
        ]}
      />
    </div>
  );
}
