import React from 'react';
import { Coins } from 'lucide-react';
import { PaymentCollection, SalesRep, Customer } from '../../db/db';
import { formatDate } from '../../lib/utils';

interface PendingCollectionsProps {
  collections: PaymentCollection[] | undefined;
  reps: SalesRep[] | undefined;
  customers: Customer[] | undefined;
  onConfirm: (id: number) => void;
}

export const PendingCollections = ({
  collections,
  reps,
  customers,
  onConfirm
}: PendingCollectionsProps) => {
  const pendingCollections = collections?.filter(c => c.status === 'pending') || [];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
      <h3 className="font-black text-black mb-6 flex items-center gap-2">
        <Coins className="w-5 h-5 text-green-600" />
        تحصيلات المناديب بانتظار التأكيد (قيد التوريد)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b">
              <th className="pb-3 px-2">التاريخ</th>
              <th className="pb-3 px-2">المندوب</th>
              <th className="pb-3 px-2">العميل</th>
              <th className="pb-3 px-2">المبلغ</th>
              <th className="pb-3 px-2 text-left">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pendingCollections.map(col => {
              const rep = reps?.find(r => r.id === col.repId);
              const customer = customers?.find(cus => cus.id === col.customerId);
              return (
                <tr key={col.id}>
                  <td className="py-4 px-2 text-[10px] font-bold text-gray-500">{formatDate(col.date)}</td>
                  <td className="py-4 px-2 text-xs font-black">{rep?.name}</td>
                  <td className="py-4 px-2 text-xs font-bold">{customer?.name}</td>
                  <td className="py-4 px-2 text-xs font-black text-green-600">{col.amount.toLocaleString()} ج.م</td>
                  <td className="py-4 px-2 text-left">
                    <button 
                      onClick={() => onConfirm(col.id!)}
                      className="bg-black text-white px-4 py-1.5 rounded-lg text-[10px] font-black shadow-lg shadow-black/10 transition-opacity"
                    >
                      تأكيد الاستلام
                    </button>
                  </td>
                </tr>
              );
            })}
            {pendingCollections.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 text-xs italic">لا توجد تحصيلات بانتظار التأكيد حالياً</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
