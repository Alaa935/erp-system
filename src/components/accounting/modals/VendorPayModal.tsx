import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api-client';

interface PurchaseOrder {
  id?: number;
  orderNumber: string;
  totalAmount: number;
  paidAmount?: number;
}

interface VendorPayModalProps {
  open: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
}

export function VendorPayModal({ open, onClose, order }: VendorPayModalProps) {
  const [payAmount, setPayAmount] = useState(0);

  useEffect(() => {
    if (order) setPayAmount(order.totalAmount - (order.paidAmount || 0));
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || payAmount <= 0) return;
    const newPaidAmount = (order.paidAmount || 0) + payAmount;
    const paymentStatus = newPaidAmount >= order.totalAmount ? 'paid' : 'partial';
    try {
      await api(`/purchase-orders/${order.id}`, {
        method: 'PUT',
        body: JSON.stringify({ paidAmount: newPaidAmount, paymentStatus }),
      });
      await api('/accounting/transactions', {
        method: 'POST',
        body: JSON.stringify({ type: 'expense', category: 'purchase', amount: payAmount, description: `تسديد دفعة للمورد - طلب رقم ${order.orderNumber}`, referenceId: order.id }),
      });
      toast.success('تم تسجيل الدفعة بنجاح');
      setPayAmount(0);
      onClose();
    } catch { toast.error('فشل تسجيل الدفعة'); }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-black mb-6">تسديد دفعة للمورد</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400">المبلغ المدفوع (ج.م)</label>
                <input required type="number" className="w-full bg-gray-100 border-none rounded-xl py-4 px-6 text-2xl font-black outline-none" value={payAmount || ''} onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)} />
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-black">حفظ عملية الدفع</button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
