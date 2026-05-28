import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api-client';

interface PayrollEditModalProps {
  open: boolean;
  onClose: () => void;
  payroll: any;
}

export function PayrollEditModal({ open, onClose, payroll }: PayrollEditModalProps) {
  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (payroll) setForm({ ...payroll }); }, [payroll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.id) return;
    try {
      await api(`/accounting/payroll/${form.id}`, {
        method: 'PUT',
        body: JSON.stringify({ advances: form.advances, bonuses: form.bonuses, deductions: form.deductions }),
      });
      toast.success('تم تحديث مستحقات الموظف');
      onClose();
    } catch { toast.error('فشل تحديث المستحقات'); }
  };

  if (!form) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-black mb-6">تعديل مستحقات الموظف</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400">السلف والقروض</label>
                  <input type="number" className="w-full bg-gray-100 rounded-xl py-2 px-3 font-bold" value={isNaN(form.advances) ? '' : form.advances} onChange={e => setForm({ ...form, advances: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400">المكافآت (بونص)</label>
                  <input type="number" className="w-full bg-gray-100 rounded-xl py-2 px-3 font-bold" value={isNaN(form.bonuses) ? '' : form.bonuses} onChange={e => setForm({ ...form, bonuses: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400">الخصومات</label>
                <input type="number" className="w-full bg-gray-100 rounded-xl py-2 px-3 font-bold" value={isNaN(form.deductions) ? '' : form.deductions} onChange={e => setForm({ ...form, deductions: parseFloat(e.target.value) || 0 })} />
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-black mt-4">حفظ التعديلات</button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
