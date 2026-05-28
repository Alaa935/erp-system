import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRightLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn, formatDate } from '../../../lib/utils';
import type { FinancialTransaction } from '../../../db/db';

interface PaymentHistoryModalProps {
  open: boolean;
  onClose: () => void;
  transactions: FinancialTransaction[];
}

export function PaymentHistoryModal({ open, onClose, transactions }: PaymentHistoryModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" dir="rtl">
            <div className="p-6 border-b bg-blue-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg"><ArrowRightLeft className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-xl font-black">سجل التدفقات المالية</h3>
                  <p className="text-xs text-blue-600 font-bold">كافة الدفعات والتحصيلات المرتبطة</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-full transition-colors text-blue-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {transactions.length > 0 ? (
                  transactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", t.type === 'income' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                          {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-black">{t.description}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{formatDate(t.date)}</p>
                        </div>
                      </div>
                      <div className="text-left font-black text-black">{t.amount.toLocaleString()} ج.م</div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-400 text-sm italic py-20">لا يوجد سجل مدفوعات مسجل لهذه الفاتورة</div>
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t">
              <button onClick={onClose} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">إغلاق السجل</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}