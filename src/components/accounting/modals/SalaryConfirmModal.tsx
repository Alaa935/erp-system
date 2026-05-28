import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Users, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api-client';

interface SalaryConfirmModalProps {
  open: boolean;
  onClose: () => void;
  payroll: any;
  employees: any[] | undefined;
}

export function SalaryConfirmModal({ open, onClose, payroll, employees }: SalaryConfirmModalProps) {
  const handlePay = async (pr: any) => {
    const employee = employees?.find((e: any) => e.id === pr.employeeId);
    if (!employee) return;
    const netAmount = pr.baseSalary + pr.bonuses - pr.advances - pr.deductions;
    try {
      await api('/accounting/transactions', {
        method: 'POST',
        body: JSON.stringify({ type: 'expense', category: 'salary', amount: netAmount, description: `صرف مرتب الموظف: ${employee.name} - شهر ${new Date(pr.month).getMonth() + 1}`, referenceId: pr.id }),
      });
      await api(`/accounting/payroll/${pr.id}/confirm`, { method: 'POST' });
      await api('/notifications', {
        method: 'POST',
        body: JSON.stringify({ title: 'صرف مرتب', message: `تم صرف مرتب الموظف ${employee.name} بمبلغ ${netAmount.toLocaleString()} ج.م`, type: 'success' }),
      });
      toast.success('تم صرف المرتب بنجاح');
      onClose();
    } catch { toast.error('فشل صرف المرتب'); }
  };

  if (!payroll) return null;

  const employee = employees?.find((e: any) => e.id === payroll.employeeId);
  const netAmount = payroll.baseSalary + payroll.bonuses - payroll.advances - payroll.deductions;
  const netPercent = payroll.baseSalary > 0 ? ((netAmount / payroll.baseSalary) * 100).toFixed(1) : '0';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" dir="rtl">
            <div className="p-6 border-b bg-green-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Gift className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-xl font-black">تأكيد صرف المرتب</h3>
                  <p className="text-xs text-green-600 font-bold">مراجعة بيانات الاستحقاق المالي</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-green-100 rounded-full transition-colors text-green-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm"><Users className="w-6 h-6 text-gray-400" /></div>
                <div>
                  <p className="text-sm font-black text-black">{employee?.name}</p>
                  <p className="text-[10px] text-gray-500 font-bold">{employee?.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold mb-1">الراتب الأساسي</p>
                  <p className="text-sm font-black text-black">{payroll.baseSalary.toLocaleString()} ج.م</p>
                </div>
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                  <p className="text-[10px] text-green-600 font-bold mb-1">الحوافز (+) </p>
                  <p className="text-sm font-black text-green-600">{payroll.bonuses.toLocaleString()} ج.م</p>
                </div>
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-[10px] text-red-600 font-bold mb-1">السلف (-) </p>
                  <p className="text-sm font-black text-red-600">{payroll.advances.toLocaleString()} ج.م</p>
                </div>
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-[10px] text-red-600 font-bold mb-1">إجمالي الخصومات والسلف (-)</p>
                  <p className="text-sm font-black text-red-600">{payroll.deductions.toLocaleString()} ج.م</p>
                </div>
              </div>
              <div className="p-6 bg-black rounded-3xl text-white flex justify-between items-center shadow-xl">
                <div>
                  <p className="text-[10px] opacity-60 font-black">صافي المستحق للصرف</p>
                  <h4 className="text-2xl font-black">{netAmount.toLocaleString()} ج.م<span className="text-xs opacity-60">({netPercent}%)</span></h4>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-green-400"><CheckCircle2 className="w-7 h-7" /></div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t flex gap-3">
              <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-200 transition-colors">إلغاء</button>
              <button onClick={() => handlePay(payroll)} className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-black hover:bg-green-700 shadow-lg shadow-green-600/20 active:scale-95 transition-all">تأكيد وصرف المبلغ</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
