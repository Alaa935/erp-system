import React, { useState } from 'react';
import { Plus, Package, Send } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { StockRequest, Item, UserAccount } from '../../types';

interface RepRequestsViewProps {
  myRequests: StockRequest[] | undefined;
  allItems: Item[] | undefined;
  currentUser: UserAccount | null | undefined;
  onRequestNewStock: () => void;
}

export const RepRequestsView: React.FC<RepRequestsViewProps> = ({
  myRequests,
  allItems,
  currentUser,
  onRequestNewStock,
}) => {
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-black">طلبات توريد مخزون جديد</h3>
        <button 
          type="button"
          onClick={onRequestNewStock}
          className="bg-black text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all hover:opacity-95 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          إنشاء طلب توريد جديد
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E0E3E5]">
                <th className="p-4 text-sm font-bold text-[#44474D]">رقم الطلب</th>
                <th className="p-4 text-sm font-bold text-[#44474D]">عدد الأصناف</th>
                <th className="p-4 text-sm font-bold text-[#44474D]">الحالة</th>
                <th className="p-4 text-sm font-bold text-[#44474D]">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F6]">
              {myRequests?.map((req) => {
                const isExpanded = expandedRequestId === req.id;
                return (
                  <React.Fragment key={req.id}>
                    <tr 
                      className="hover:bg-[#F2F4F6] transition-colors cursor-pointer"
                      onClick={() => setExpandedRequestId(isExpanded ? null : req.id!)}
                    >
                      <td className="p-4 font-bold text-sm text-black">REQ-{req.id}</td>
                      <td className="p-4">
                        <p className="font-bold text-sm text-black">{req.items?.length || 0} أصناف</p>
                        <p className="text-[9px] text-blue-600 font-bold mt-0.5">
                          {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                        </p>
                      </td>
                      <td className="p-4">
                        {req.status === 'pending' && (
                          <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-1 rounded-full font-bold">
                            قيد المراجعة
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-full font-bold">
                            تمت الموافقة
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="bg-red-100 text-red-800 text-[10px] px-2 py-1 rounded-full font-bold">
                            مرفوض
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-[#44474D] font-mono">{formatDate(req.date)}</td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={4} className="bg-gray-50/50 p-4 border-t border-[#E0E3E5]">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {req.items?.map((reqItem, idx) => {
                              const item = allItems?.find((i) => i.id === reqItem.itemId);
                              return (
                                <div key={idx} className="bg-white border border-[#E0E3E5] px-3 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                                  <Package className="w-4 h-4 text-gray-300" />
                                  <div>
                                    <p className="text-xs font-bold text-black">{item?.name || 'صنف غير معروف'}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                      الكمية المطلوبة: <span className="font-bold text-black">{reqItem.quantity}</span>
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-end">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const text = `*طلب توريد مخزون جديد*
رقم الطلب: REQ-${req.id}
المندوب: ${currentUser?.username}
التاريخ: ${formatDate(req.date)}
عدد الأصناف: ${req.items?.length || 0}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                              }}
                              className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition-all flex items-center gap-2 shadow-sm"
                            >
                              <Send className="w-3.5 h-3.5" />
                              إرسال للمدير للموافقة
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {(!myRequests || myRequests.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-400 text-xs italic">
                    لا توجد طلبات توريد حالية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
