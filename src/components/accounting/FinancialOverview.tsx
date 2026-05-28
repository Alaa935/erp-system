import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Wallet, 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { FinancialTransaction } from '../../db/db';
import { cn, formatDate } from '../../lib/utils';

interface FinancialOverviewProps {
  transactions: FinancialTransaction[] | undefined;
  capital: { value: number } | undefined;
  balance: number;
  totalReceivables: number;
  totalPayables: number;
  repCustody?: number;
  inventoryValue?: number;
  expenseBreakdown: { label: string; val: string; per: number; color: string }[];
  onUpdateCapital: () => void;
  onSelectKpi?: (type: 'liquidity' | 'custody' | 'inventory' | 'debtors' | 'creditors' | 'capital') => void;
}

export const FinancialOverview = ({
  transactions,
  capital,
  balance,
  totalReceivables,
  totalPayables,
  repCustody = 0,
  inventoryValue = 0,
  expenseBreakdown,
  onUpdateCapital,
  onSelectKpi
}: FinancialOverviewProps) => {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.ceil((transactions?.length || 0) / itemsPerPage);
  const paginatedTransactions = transactions?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div 
          onClick={() => onSelectKpi?.('capital')}
          className="bg-black text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between cursor-pointer transition-transform hover:scale-[1.05] active:scale-95 group"
        >
          <div>
            <p className="text-[10px] font-black opacity-60 mb-1 uppercase tracking-wider">إجمالي رأس المال</p>
            <h3 className="text-xl font-black mb-2">{(capital?.value || 0).toLocaleString()} ج.م</h3>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onUpdateCapital(); }}
            className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold transition-colors"
          >
            تعديل رأس المال
          </button>
        </div>
        <div 
          onClick={() => onSelectKpi?.('liquidity')}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:scale-[1.05] active:scale-95 cursor-pointer hover:border-black group"
        >
          <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider group-hover:text-black">السيولة (بالخزينة)</p>
          <h3 className={cn("text-xl font-black", balance >= 0 ? "text-green-600" : "text-red-600")}>
            {balance.toLocaleString()} ج.م
          </h3>
          <p className="text-[9px] text-gray-400 font-bold">النقدية الفعلية المتاحة</p>
        </div>
        <div 
          onClick={() => onSelectKpi?.('inventory')}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:scale-[1.05] active:scale-95 cursor-pointer hover:border-black group"
        >
          <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider group-hover:text-black">قيمة المخزون</p>
          <h3 className="text-xl font-black text-purple-600">{(inventoryValue || 0).toLocaleString()} ج.م</h3>
          <p className="text-[9px] text-gray-400 font-bold">بضاعة حالية بسعر التكلفة</p>
        </div>
        <div 
          onClick={() => onSelectKpi?.('custody')}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:scale-[1.05] active:scale-95 cursor-pointer hover:border-black group"
        >
          <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider group-hover:text-black">عهدة لدى المناديب</p>
          <h3 className="text-xl font-black text-orange-500">{repCustody.toLocaleString()} ج.م</h3>
          <p className="text-[9px] text-gray-400 font-bold">تحصيلات لم تورد بعد</p>
        </div>
        <div 
          onClick={() => onSelectKpi?.('debtors')}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:scale-[1.05] active:scale-95 cursor-pointer hover:border-black group"
        >
          <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider group-hover:text-black">المديونيات (إلينا)</p>
          <h3 className="text-xl font-black text-blue-600">{totalReceivables.toLocaleString()} ج.م</h3>
          <p className="text-[9px] text-gray-400 font-bold">ديون العملاء المستحقة</p>
        </div>
        <div 
          onClick={() => onSelectKpi?.('creditors')}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:scale-[1.05] active:scale-95 cursor-pointer hover:border-black group"
        >
          <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider group-hover:text-black">المستحقات (علينا)</p>
          <h3 className="text-xl font-black text-red-500">{totalPayables.toLocaleString()} ج.م</h3>
          <p className="text-[9px] text-gray-400 font-bold">مستحقات الموردين</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-black text-black flex items-center gap-2">
               <History className="w-5 h-5 text-gray-400" />
               آخر العمليات المالية
             </h3>
             <button 
               onClick={() => setHistoryModalOpen(true)}
               className="text-[10px] bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-lg font-black text-gray-500 transition-colors border border-transparent hover:border-gray-200"
             >
               مشاهدة الكل
             </button>
          </div>
          <div className="space-y-4">
            {transactions?.slice(0, 5).map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    t.type === 'income' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-black">{t.description}</p>
                    <p className="text-[9px] text-gray-400 font-bold">{formatDate(t.date)}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className={cn("text-sm font-black", t.type === 'income' ? "text-green-600" : "text-red-600")}>
                    {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{t.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <h3 className="font-black text-black mb-6">توزيع المصروفات التشغيلية</h3>
           <div className="space-y-6">
             {expenseBreakdown.map((item, idx) => (
               <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-black">
                    <span>{item.label}</span>
                    <div>
                      <span className="text-gray-400 ml-2">{item.val} ج.م</span>
                      <span>{item.per}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.per}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={cn("h-full", item.color)} 
                    />
                  </div>
               </div>
             ))}
             {expenseBreakdown.length === 0 && (
               <div className="text-center py-10 text-gray-400 text-xs italic">لا توجد مصروفات مسجلة</div>
             )}
           </div>
        </div>
      </div>

      {/* History Modal with Pagination */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }} 
            className="bg-white rounded-3xl w-full max-w-2xl h-[80vh] p-8 shadow-2xl relative flex flex-col"
          >
            <button 
              onClick={() => { setHistoryModalOpen(false); setCurrentPage(1); }} 
              className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="إغلاق"
            >
               <X className="w-6 h-6" />
            </button>
            <div className="mb-8">
              <h3 id="modal-title" className="text-2xl font-black mb-1">السجل الكامل للعمليات</h3>
              <p className="text-sm text-gray-500 font-bold">عرض كافة الإيرادات والمصروفات المسجلة.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
              {paginatedTransactions?.map(t => (
                <div key={t.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                      t.type === 'income' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    )}>
                      {t.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-black">{t.description}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{formatDate(t.date)}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={cn("text-lg font-black", t.type === 'income' ? "text-green-600" : "text-red-600")}>
                      {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()} ج.م
                    </p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-tight">{t.category}</p>
                  </div>
                </div>
              ))}
              {(!paginatedTransactions || paginatedTransactions.length === 0) && (
                <div className="text-center py-20 text-gray-400 italic">لا توجد عمليات مسجلة</div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="pt-6 mt-4 border-t flex items-center justify-center gap-4">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2 bg-gray-50 border rounded-xl disabled:opacity-30 hover:bg-gray-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="text-sm font-black">
                  صفحة {currentPage} من {totalPages}
                </span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2 bg-gray-50 border rounded-xl disabled:opacity-30 hover:bg-gray-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};
