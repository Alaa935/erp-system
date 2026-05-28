import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText } from 'lucide-react';
import { formatDate } from '../../../lib/utils';
import type { PurchaseOrder, SalesOrder, Item } from '../../../db/db';

interface OrderDetailsModalProps {
  open: boolean;
  onClose: () => void;
  order: PurchaseOrder | SalesOrder | null;
  items: Item[] | undefined;
}

export function OrderDetailsModal({ open, onClose, order, items }: OrderDetailsModalProps) {
  return (
    <AnimatePresence>
      {open && order && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden" dir="rtl">
            <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg"><FileText className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-xl font-black">تفاصيل الفاتورة</h3>
                  <p className="text-xs text-gray-500 font-bold">{order.orderNumber || 'رقم غير معروف'}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">التاريخ</p>
                  <p className="font-black text-sm">{order.date ? formatDate(order.date) : 'غير مسجل'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">إجمالي الفاتورة</p>
                  <p className="font-black text-sm text-green-600">{(order.totalAmount || 0).toLocaleString()} ج.م</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-black text-black">الأصناف المشمولة:</h4>
                <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((orderItem: any, idx: number) => {
                      const item = items?.find((i: Item) => i.id === orderItem.itemId);
                      return (
                        <div key={`${order.id}-${idx}`} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-[10px] font-black text-gray-400">{idx + 1}</div>
                            <div>
                              <p className="text-sm font-black">{item?.name || 'صنف محذوف'}</p>
                              <p className="text-[10px] text-gray-400 font-bold">السعر: {(orderItem.price || 0).toLocaleString()} ج.م</p>
                            </div>
                          </div>
                          <div className="text-left font-black text-sm">{orderItem.quantity} وحدة</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-gray-400 italic text-sm">لا توجد أصناف مسجلة</div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t">
              <button onClick={onClose} className="w-full bg-black text-white py-4 rounded-2xl font-black shadow-lg hover:opacity-90 transition-opacity">إغلاق</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}