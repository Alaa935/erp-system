import React, { useState } from 'react';
import { Search, Plus, ShoppingCart, Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { SalesOrder, Customer } from '../../types';
import { cn, formatDate } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface RepSalesProps {
  mySales: SalesOrder[] | undefined;
  customers: Customer[] | undefined;
  onNewSale: () => void;
  onViewInvoice: (order: SalesOrder) => void;
}

export const RepSalesView = ({ mySales, customers, onNewSale, onViewInvoice }: RepSalesProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredSales = mySales?.filter(order => {
    const customer = customers?.find(c => c.id === order.customerId);
    return order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
           customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const paginatedSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474D]" />
          <input 
            type="text" 
            placeholder="بحث في المبيعات..."
            className="w-full bg-white border text-sm border-[#E0E3E5] rounded-xl py-2 pr-10 pl-4 focus:ring-1 focus:ring-black outline-none"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <button 
          onClick={onNewSale}
          className="w-full sm:w-auto bg-black text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-black text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          عملية بيع جديدة
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E0E3E5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E0E3E5]">
                <th className="p-4 text-xs font-black text-[#44474D]">رقم العملية</th>
                <th className="p-4 text-xs font-black text-[#44474D]">العميل</th>
                <th className="p-4 text-xs font-black text-[#44474D]">التاريخ</th>
                <th className="p-4 text-xs font-black text-[#44474D]">القيمة الإجمالية</th>
                <th className="p-4 text-xs font-black text-[#44474D] text-center">حالة الدفع</th>
                <th className="p-4 text-xs font-black text-[#44474D] text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F6]">
              {paginatedSales.map((order) => {
                const customer = customers?.find(c => c.id === order.customerId);
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-black text-black text-sm">{order.orderNumber}</td>
                    <td className="p-4 text-sm font-bold text-gray-700">{customer?.name || 'زائر'}</td>
                    <td className="p-4 text-xs text-[#44474D] font-bold">{formatDate(order.date)}</td>
                    <td className="p-4 font-black shadow-sm bg-gray-50/50 text-sm">
                      {order.totalAmount.toLocaleString()} ج.م
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "text-[9px] px-2 py-1 rounded-full font-black",
                        order.paymentStatus === 'paid' ? "bg-green-100 text-green-700" : (order.paymentStatus === 'partial' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700")
                      )}>
                        {order.paymentStatus === 'paid' ? 'تم السداد' : (order.paymentStatus === 'partial' ? 'سداد جزئي' : 'آجل')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => onViewInvoice(order)}
                          className="p-2 bg-gray-100 text-[#44474D] rounded-xl hover:bg-black hover:text-white transition-all shadow-sm"
                          title="عرض الفاتورة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onViewInvoice(order)}
                          className="p-2 bg-gray-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="طباعة"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedSales.length === 0 && (
                <tr>
                   <td colSpan={6} className="p-12 text-center text-gray-400 italic text-sm">لا توجد عمليات مبيعات مسجلة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-2 bg-white border border-[#E0E3E5] rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex items-center px-6 font-black text-sm bg-white border border-[#E0E3E5] rounded-xl">
            {currentPage} / {totalPages}
          </div>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 bg-white border border-[#E0E3E5] rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
