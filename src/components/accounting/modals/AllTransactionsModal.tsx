import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn, formatDate } from '../../../lib/utils';
import type { FinancialTransaction } from '../../../db/db';

interface AllTransactionsModalProps {
  open: boolean;
  onClose: () => void;
  transactions?: FinancialTransaction[];
}

export function AllTransactionsModal({ open, onClose, transactions }: AllTransactionsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-2xl h-[80vh] p-8 shadow-2xl relative flex flex-col">
            <button onClick={onClose} className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            <div className="mb-8">
              <h3 className="text-2xl font-black mb-1">السجل الكامل للعمليات</h3>
              <p className="text-sm text-gray-500 font-bold">عرض كافة الإيرادات والمصروفات المسجلة في النظام.</p>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
              {transactions?.map(t => (
                <div key={t.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm", t.type === 'income' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                      {t.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-black">{t.description}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{formatDate(t.date)}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={cn("text-lg font-black", t.type === 'income' ? "text-green-600" : "text-red-600")}>{t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()} ج.م</p>
                    <p className="text-[10px] text-gray-400 font-black decoration-gray-200 uppercase">{t.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}