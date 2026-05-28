import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api-client';

interface VehicleExpenseModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: any;
}

export function VehicleExpenseModal({ open, onClose, vehicle }: VehicleExpenseModalProps) {
  const [expense, setExpense] = useState({ amount: 0, description: '' });
  useEffect(() => { if (!open) setExpense({ amount: 0, description: '' }); }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle?.id || expense.amount <= 0) return;
    try {
      await api('/accounting/vehicles/expense', {
        method: 'POST',
        body: JSON.stringify({ vehicleId: vehicle.id, amount: expense.amount, description: `مصاريف سيارة (${vehicle.name} - ${vehicle.plateNumber}): ${expense.description}` }),
      });
      toast.success('تم تسجيل المصاريف');
      setExpense({ amount: 0, description: '' });
      onClose();
    } catch { toast.error('فشل تسجيل المصاريف'); }
  };

  return (
    <AnimatePresence>
      {open && vehicle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            <h3 className="text-xl font-black mb-2">تسجيل مصاريف سيارة</h3>
            <p className="text-xs text-gray-500 mb-6 font-bold">{vehicle.name} - {vehicle.plateNumber}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400">المبلغ (ج.م)</label>
                <input required type="number" className="w-full bg-gray-100 rounded-xl py-3 px-4 font-black text-lg" value={expense.amount || ''} onChange={e => setExpense({ ...expense, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400">الوصف (بنزين، زيت، صيانة..)</label>
                <textarea required className="w-full bg-gray-100 rounded-xl py-3 px-4 font-bold h-24" value={expense.description} onChange={e => setExpense({ ...expense, description: e.target.value })} />
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-black">حفظ المصاريف</button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
