import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api-client';

interface CapitalModalProps {
  open: boolean;
  onClose: () => void;
  currentCapital: number;
}

export function CapitalModal({ open, onClose, currentCapital }: CapitalModalProps) {
  const [newCapitalValue, setNewCapitalValue] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const addedAmount = newCapitalValue;
    try {
      await api('/accounting/capital', { method: 'PUT', body: JSON.stringify({ amount: currentCapital + addedAmount }) });
      await api('/accounting/transactions', {
        method: 'POST',
        body: JSON.stringify({ type: 'equity', category: 'capital_injection', amount: addedAmount, description: 'زيادة رأس المال' }),
      });
      toast.success('تم زيادة رأس المال بنجاح');
      setNewCapitalValue(0);
      onClose();
    } catch { toast.error('فشل زيادة رأس المال'); }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-black mb-2">تعديل رأس المال</h3>
            <p className="text-sm text-gray-500 mb-8 font-bold text-right" dir="rtl">يمكنك إضافة قيمة إضافية لرأس مال الشركة لتوسيع النشاط.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400">قيمة الإضافة (ج.م)</label>
                <input required type="number" className="w-full bg-gray-100 border-none rounded-xl py-4 px-6 text-2xl font-black outline-none focus:ring-2 ring-black/5" placeholder="0.00" value={newCapitalValue || ''} onChange={(e) => setNewCapitalValue(parseFloat(e.target.value) || 0)} />
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-black text-lg hover:opacity-90 transition-opacity">تأكيد وزيادة رأس المال</button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
