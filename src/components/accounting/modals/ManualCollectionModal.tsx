import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api-client';

interface Customer {
  id?: number;
  name: string;
}

interface ManualCollectionModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function ManualCollectionModal({ open, onClose, customer }: ManualCollectionModalProps) {
  const [collectAmount, setCollectAmount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || collectAmount <= 0) return;
    try {
      await api('/payment-collections', {
        method: 'POST',
        body: JSON.stringify({ repId: 0, customerId: customer.id, amount: collectAmount, method: 'cash', status: 'confirmed', type: 'customer' }),
      });
      let remaining = collectAmount;
      const unpaidRes: any = await api('/sales-orders', { params: { customerId: String(customer.id), paymentStatus: 'unpaid', pageSize: '1000' } });
      const partialRes: any = await api('/sales-orders', { params: { customerId: String(customer.id), paymentStatus: 'partial', pageSize: '1000' } });
      const unpaidOrders = unpaidRes?.orders || [];
      const partialOrders = partialRes?.orders || [];
      const orders = [...unpaidOrders, ...partialOrders].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      for (const order of orders) {
        if (remaining <= 0) break;
        const unpaid = order.totalAmount - (order.paidAmount || 0);
        const apply = Math.min(remaining, unpaid);
        await api(`/sales-orders/${order.id}/payments`, {
          method: 'POST',
          body: JSON.stringify({ amount: apply, method: 'cash' }),
        });
        await api('/accounting/transactions', {
          method: 'POST',
          body: JSON.stringify({ type: 'income', category: 'sale', amount: apply, description: `تحصيل نقدي يدوي - فاتورة رقم ${order.orderNumber} - عميل: ${customer.name}`, referenceId: order.id }),
        });
        remaining -= apply;
      }
      if (remaining > 0) {
        await api('/accounting/transactions', {
          method: 'POST',
          body: JSON.stringify({ type: 'income', category: 'sale', amount: remaining, description: `دفعة زائدة (رصيد دائن) - عميل: ${customer.name}` }),
        });
      }
      toast.success('تم تسجيل التحصيل اليدوي بنجاح');
      setCollectAmount(0);
      onClose();
    } catch { toast.error('فشل تسجيل التحصيل'); }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-black mb-6">تسجيل تحصيل يدوي</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400">المبلغ المُحصل (ج.م)</label>
                <input required type="number" className="w-full bg-gray-100 border-none rounded-xl py-4 px-6 text-2xl font-black outline-none" value={collectAmount || ''} onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)} />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">تأكيد الاستلام والتحصيل</button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
