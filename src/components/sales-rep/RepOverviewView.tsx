import React from 'react';
import { TrendingUp, CheckCircle2, Coins, Clock, ClipboardList, AlertCircle } from 'lucide-react';
import { SalesRep, RepInventory } from '../../types';

interface RepOverviewViewProps {
  monthSales: number;
  selectedRep: SalesRep | undefined;
  myInventory: RepInventory[] | undefined;
  settledCommission: number | undefined;
  unsettledAmount: number | undefined;
  pendingSettlement: any;
  onDaySettlement: () => Promise<void> | void;
}

export const RepOverviewView: React.FC<RepOverviewViewProps> = ({
  monthSales,
  selectedRep,
  myInventory,
  settledCommission,
  unsettledAmount,
  pendingSettlement,
  onDaySettlement,
}) => {
  const target = selectedRep?.target || 1;
  const progressPercent = Math.min(100, (monthSales / target) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monthly Sales Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-2 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-16 h-16 text-black" />
          </div>
          <p className="text-sm font-bold text-[#44474D]">مبيعاتك هذا الشهر</p>
          <h3 className="text-3xl font-bold text-black">
            {(monthSales || 0).toLocaleString()} <span className="text-sm font-normal">ج.م</span>
          </h3>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-4">
            <div 
              className="bg-black h-full rounded-full" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-[#44474D] text-left">
            المستهدف الشهري: {(selectedRep?.target || 0).toLocaleString()} ج.م
          </p>
        </div>

        {/* Inventory Items Count Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-2 shadow-sm">
          <p className="text-sm font-bold text-[#44474D]">عدد الأصناف في العهدة</p>
          <h3 className="text-3xl font-bold text-black">{myInventory?.length || 0}</h3>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            جميع الأصناف متوفرة
          </p>
        </div>

        {/* Commission Earned Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-2 shadow-sm">
          <p className="text-sm font-bold text-[#44474D]">العمولة المحققة (من المبيعات المسوّاة)</p>
          <h3 className="text-3xl font-bold text-black">
            {((settledCommission as number) || 0).toLocaleString()} <span className="text-sm font-normal">ج.م</span>
          </h3>
          <p className="text-xs text-[#44474D]">
            بمعدل عمولة {selectedRep?.commissionRate || 0}% على المبيعات المسوّاة فقط
          </p>
        </div>
      </div>

      {/* Daily Settlement Box */}
      <div className="bg-black text-white p-6 rounded-3xl relative overflow-hidden shadow-md">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-20 -translate-y-20" />
        <div className="relative flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white/80">ملخص التحصيلات اليومية</span>
            </div>
            <h3 className="text-4xl font-bold mb-1">
              {(unsettledAmount || 0).toLocaleString()} <span className="text-lg">ج.م</span>
            </h3>
            <p className="text-sm text-white/60 font-bold">
              إجمالي مبالغ في حوزتك لم يتم توريدها للخزينة
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            {pendingSettlement ? (
              <div className="bg-orange-500/20 border border-orange-500/30 px-6 py-4 rounded-2xl flex items-center gap-4">
                <Clock className="w-6 h-6 text-orange-500 animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-orange-500">طلب التوريد قيد المراجعة</p>
                  <p className="text-[10px] text-white/50">بانتظار تأكيد الاستلام من الإدارة</p>
                </div>
              </div>
            ) : (
              <button 
                type="button"
                onClick={onDaySettlement}
                disabled={(unsettledAmount ?? 0) <= 0}
                className="bg-white text-black px-10 py-4 rounded-2xl font-bold text-sm hover:bg-green-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {(unsettledAmount ?? 0) > 0 ? 'توريد تحصيلات اليوم للخزينة' : 'لا توجد تحصيلات للتوريد'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Warnings & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-4 shadow-sm">
          <h4 className="font-bold text-black flex items-center gap-2 text-sm">
            <ClipboardList className="w-5 h-5 text-gray-500" />
            تنبيهات هامة
          </h4>
          <div className="space-y-3">
            {myInventory?.some((i) => i.quantity < 5) ? (
              <div className="flex gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100 text-orange-800">
                <AlertCircle className="w-5 h-5 shrink-0 text-orange-600" />
                <div>
                  <p className="text-sm font-bold">مخزون منخفض</p>
                  <p className="text-xs">توجد أصناف في عهدتك وصلت للحد الأدنى، يرجى طلب توريد.</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 p-4 bg-green-50 rounded-xl border border-green-100 text-green-800">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
                <div>
                  <p className="text-sm font-bold">حالة المخزون ممتازة</p>
                  <p className="text-xs">رصيد عهدتك كافٍ لعمليات البيع اليوم.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
