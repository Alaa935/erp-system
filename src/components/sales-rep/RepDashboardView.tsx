import React from 'react';
import { AlertCircle, ClipboardList, ShoppingCart, ArrowRightLeft } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import { Item, RepInventory, StockRequest, Customer } from '../../types';

interface RepDashboardViewProps {
  myInventory: RepInventory[] | undefined;
  allItems: Item[] | undefined;
  newCustomersToday: number | undefined;
  salesCount: number;
  myRequests: StockRequest[] | undefined;
  activityLog: any[] | null | undefined;
  customers: Customer[] | undefined;
  onRenewRequest: (itemId: number) => void;
}

export const RepDashboardView: React.FC<RepDashboardViewProps> = ({
  myInventory,
  allItems,
  newCustomersToday,
  salesCount,
  myRequests,
  activityLog,
  customers,
  onRenewRequest,
}) => {
  const lowStockItems = myInventory?.filter((inv) => inv.quantity < 5) || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Low Stock Items */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-orange-50/50 flex justify-between items-center text-orange-800">
            <h3 className="font-bold flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5" />
              أصناف أوشكت على الانتهاء في عهدتك
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {lowStockItems.map((inv) => {
              const item = allItems?.find((i) => i.id === inv.itemId);
              return (
                <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-black">
                      {item?.name?.[0] || 'P'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-black">{item?.name || 'صنف غير معروف'}</p>
                      <p className="text-[10px] text-[#44474D]">
                        الكمية الحالية: <span className="text-red-600 font-bold">{inv.quantity}</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => inv.itemId && onRenewRequest(inv.itemId)}
                    className="bg-black text-white px-4 py-1.5 rounded-lg text-[10px] font-bold hover:opacity-80 transition-opacity"
                  >
                    تجديد الطلب
                  </button>
                </div>
              );
            })}
            {lowStockItems.length === 0 && (
              <div className="p-10 text-center text-[#44474D] text-xs italic">
                لا توجد أصناف منخفضة المخزون حالياً
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-4 shadow-sm h-fit">
          <h3 className="font-bold text-black text-sm">ملخص الأداء السريع</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-xs font-bold text-[#44474D]">عدد العملاء الجدد اليوم</span>
              <span className="font-bold text-sm text-black">{newCustomersToday ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-xs font-bold text-[#44474D]">المبيعات المكتملة</span>
              <span className="font-bold text-green-600 text-sm">{salesCount ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-xs font-bold text-[#44474D]">طلبات التوريد</span>
              <span className="font-bold text-blue-600 text-sm">{myRequests?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operation Logs / Recent Activity */}
      <div className="bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-black flex items-center gap-2 text-sm">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            سجل العمليات وآخر التحركات
          </h3>
        </div>
        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto no-scrollbar">
          {activityLog?.map((activity: any, idx: number) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
                  activity.type === 'sale' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                )}>
                  {activity.type === 'sale' ? <ShoppingCart className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-bold text-[13px] text-black">
                    {activity.type === 'sale' ? `عملية بيع رقم ${activity.orderNumber}` : `استلام بضاعة رقم ${activity.transferNumber}`}
                  </p>
                  <p className="text-[10px] text-[#44474D]">
                    {activity.type === 'sale' 
                      ? `العميل: ${customers?.find(c => c.id === activity.customerId)?.name || 'غير معروف'}` 
                      : `عدد الأصناف: ${activity.items?.length || 0}`}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-[#44474D] font-mono">{formatDate(activity.date)}</p>
                <p className={cn("text-xs font-bold mt-0.5",
                  activity.type === 'sale' ? "text-green-600" : "text-blue-600"
                )}>
                  {activity.type === 'sale' ? `+ ${activity.totalAmount} ج.م` : 'استلام مخزني'}
                </p>
              </div>
            </div>
          ))}
          {(!activityLog || activityLog.length === 0) && (
            <div className="p-10 text-center text-[#44474D] text-xs italic">
              لا توجد نشاطات مسجلة بعد
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
