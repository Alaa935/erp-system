import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Cloud, Download, Upload, AlertTriangle, RefreshCw, HardDrive, Calendar, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/design-system/Card';
import { Button } from '../../components/design-system/Button';
import { Badge } from '../../components/design-system/Badge';
import api from '../../lib/api-client';

interface BackupSettingsProps {
  onDeleteTransactions: () => void;
  onDeleteAll: () => void;
}

export function BackupSettings({ onDeleteTransactions, onDeleteAll }: BackupSettingsProps) {
  const [lastBackup, setLastBackup] = useState<string | null>(() => localStorage.getItem('lastBackupDate'));
  const [backupSize, setBackupSize] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('lastBackupSize');
    if (stored) setBackupSize(stored);
  }, []);

  const handleExport = async () => {
    try {
      const res: any = await api('/system-config/export');
      const json = JSON.stringify(res, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const size = (blob.size / 1024).toFixed(1);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wms_full_backup_${Date.now()}.json`;
      a.click();
      const now = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      localStorage.setItem('lastBackupDate', now);
      localStorage.setItem('lastBackupSize', size);
      setLastBackup(now);
      setBackupSize(size);
      toast.success('تم تحميل النسخة الاحتياطية بنجاح');
    } catch {
      toast.error('فشل تحميل النسخة الاحتياطية');
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      e.target.value = '';
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const contents = event.target?.result as string;
          if (!contents) return;
          const data = JSON.parse(contents);
          await api('/system-config/import', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          toast.success('تم استعادة النسخة الاحتياطية بنجاح');
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
          console.error('Restore error:', err);
          toast.error('فشل استعادة النسخة الاحتياطية. تأكد من صحة الملف.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">آخر نسخة احتياطية</p>
            <Calendar className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-sm font-black truncate">{lastBackup || 'لم يتم بعد'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">حجم آخر نسخة</p>
            <HardDrive className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{backupSize ? `${backupSize} كيلوبايت` : '—'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">خيارات النسخ</p>
            <Cloud className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">2</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">حالة النظام</p>
            <CheckCircle2 className="w-4 h-4 text-gray-300" />
          </div>
          <Badge variant={lastBackup ? 'success' : 'neutral'}>{lastBackup ? 'مدعوم' : 'بدون نسخ'}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="lg" className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl ring-1 ring-blue-200/50">
              <Cloud className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-black text-sm">النسخ الاحتياطي</p>
              <p className="text-[10px] text-gray-400 font-bold">تصدير واستعادة البيانات كملف JSON</p>
            </div>
          </div>
          <div className="space-y-3">
            <Button onClick={handleExport} icon={<Download className="w-4 h-4" />} className="w-full justify-center">
              تحميل النسخة الاحتياطية
            </Button>
            <label className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 py-3.5 rounded-xl font-black text-sm text-gray-400 hover:border-black hover:text-black transition-all cursor-pointer">
              <input type="file" className="hidden" accept=".json" onChange={handleRestore} />
              <Upload className="w-4 h-4" /> استعادة من ملف
            </label>
          </div>
          {lastBackup && (
            <div className="p-3 bg-emerald-50 rounded-xl ring-1 ring-emerald-200/50 flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-emerald-700">آخر نسخة: {lastBackup}</span>
            </div>
          )}
        </Card>

        <Card padding="lg" className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl ring-1 ring-blue-200/50">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-black text-sm">بدء دورة تشغيلية جديدة</p>
              <p className="text-[10px] text-gray-400 font-bold">مسح العمليات مع الإبقاء على الكيانات</p>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 leading-relaxed">
            هذا الخيار يقوم بحذف كافة الفواتير، الحركات المالية، تحويلات المخزون، ونبض العمليات، مع <strong>الحفاظ</strong> على قائمة العملاء والموردين والمناديب والفروع.
          </p>
          <Button variant="outline" onClick={onDeleteTransactions} className="w-full justify-center border-blue-600 text-blue-600 hover:bg-blue-50">
            <RefreshCw className="w-4 h-4" /> تصفير العمليات
          </Button>
        </Card>
      </div>

      <Card padding="lg" className="bg-gradient-to-br from-rose-50 to-white border-rose-100 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 rounded-xl ring-1 ring-rose-200/50">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="font-black text-sm text-rose-900">منطقة الأمان القصوى</p>
            <p className="text-[10px] text-rose-600 font-bold">هذا الإجراء لا يمكن التراجع عنه</p>
          </div>
        </div>
        <p className="text-xs font-bold text-rose-700 leading-relaxed">
          حذف البيانات سيؤدي إلى فقدان دائم لكل ما تم تخزينه بما في ذلك الحسابات والفواتير والمناديب. يرجى التأكد من تحميل نسخة احتياطية أولاً.
        </p>
        <Button variant="danger" onClick={onDeleteAll} className="w-full justify-center">
          <AlertTriangle className="w-4 h-4" /> تصفير النظام بالكامل
        </Button>
      </Card>
    </div>
  );
}
