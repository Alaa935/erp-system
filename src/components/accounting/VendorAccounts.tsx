import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building, 
  AlertTriangle, 
  Eye, 
  ArrowRightLeft, 
  ChevronRight, 
  FileText,
  Search,
  ChevronLeft
} from 'lucide-react';
import { PurchaseOrder, Supplier, FinancialTransaction } from '../../db/db';
import { cn, formatDate } from '../../lib/utils';

interface VendorAccountsProps {
  purchaseOrders: PurchaseOrder[] | undefined;
  suppliers: Supplier[] | undefined;
  onViewDetails: (order: PurchaseOrder) => void;
  onViewHistory: (orderId: number) => void;
  onPay: (order: PurchaseOrder) => void;
}

export const VendorAccounts = ({
  purchaseOrders,
  suppliers,
  onViewDetails,
  onViewHistory,
  onPay
}: VendorAccountsProps) => {
  const [viewMode, setViewMode] = useState<'list' | 'statement'>('list');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination for list
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const pendingInvoices = purchaseOrders?.filter(o => o.paymentStatus !== 'paid' && o.status === 'received') || [];
  
  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const paginatedSuppliers = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  const selectedSupplier = suppliers?.find(s => s.id === selectedSupplierId);
  const supplierOrders = purchaseOrders?.filter(o => o.supplierId === selectedSupplierId) || [];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <h3 className="font-black text-black mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              الفواتير الآجلة (المستحقات المترتبة)
            </h3>
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] no-scrollbar">
              {pendingInvoices.map(order => {
                const supplier = suppliers?.find(s => s.id === order.supplierId);
                return (
                  <div key={order.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-black text-black">{order.orderNumber}</p>
                      <p className="text-[10px] text-gray-500 font-bold">{supplier?.name}</p>
                      <p className="text-[9px] text-red-500 mt-1">تاريخ الاستحقاق: {formatDate(order.dueDate ? new Date(order.dueDate).getTime() : new Date(order.date).getTime() + 1296000000)}</p>
                    </div>
                    <div className="text-left flex flex-col items-end gap-2">
                      <p className="text-sm font-black text-red-600">{(order.totalAmount - (order.paidAmount || 0)).toLocaleString()} ج.م</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onViewDetails(order)}
                          className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-black hover:text-white transition-all shadow-sm"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onViewHistory(order.id!)}
                          className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="سجل المدفوعات"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onPay(order)}
                          className="text-[9px] font-black bg-black text-white px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity flex items-center gap-1"
                        >
                          تسديد القيمة
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {pendingInvoices.length === 0 && (
                <div className="p-12 text-center text-gray-400 text-sm italic">لا توجد فواتير آجلة حالياً</div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-black">كشف حساب موردين (الأرصدة)</h3>
              <div className="relative">
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="bg-gray-50 border-none rounded-lg py-1.5 pr-8 pl-3 text-[11px] font-bold outline-none focus:ring-1 focus:ring-black transition-all"
                />
              </div>
            </div>
            <div className="space-y-2 flex-1">
               {paginatedSuppliers.map(supplier => {
                 const balance = purchaseOrders?.filter(o => o.supplierId === supplier.id).reduce((sum, o) => sum + (o.totalAmount - (o.paidAmount || 0)), 0) || 0;
                 return (
                   <div 
                     key={supplier.id} 
                     onClick={() => { setSelectedSupplierId(supplier.id!); setViewMode('statement'); }}
                     className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl group cursor-pointer transition-all border-b border-gray-50 last:border-0"
                   >
                      <div>
                        <p className="text-sm font-black group-hover:text-blue-600 transition-colors">{supplier.name}</p>
                        <p className="text-[10px] text-gray-400">{supplier.phone}</p>
                      </div>
                      <div className="text-left flex items-center gap-4">
                         <div className={cn("text-sm font-black", balance > 0 ? "text-red-600" : "text-green-600")}>
                            {balance.toLocaleString()} ج.م
                         </div>
                         <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                      </div>
                   </div>
                 )
               })}
            </div>
            
            {totalPages > 1 && (
              <div className="pt-4 mt-auto flex items-center justify-center gap-3">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-black">{currentPage} / {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
          <div className="flex justify-between items-start">
            <button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-100">
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="text-right">
              <h3 className="text-2xl font-black">{selectedSupplier?.name}</h3>
              <p className="text-sm text-gray-500 font-bold">كشف حساب والتعاملات المالية</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <p className="text-[10px] font-black text-blue-600 mb-1 uppercase">إجمالي المشتريات</p>
              <h4 className="text-xl font-black">
                {supplierOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()} ج.م
              </h4>
            </div>
            <div className="bg-green-50 p-6 rounded-2xl">
              <p className="text-[10px] font-black text-green-600 mb-1 uppercase">إجمالي المسدد</p>
              <h4 className="text-xl font-black">
                {supplierOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0).toLocaleString()} ج.م
              </h4>
            </div>
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
              <p className="text-[10px] font-black text-red-600 mb-1 uppercase">الرصيد المتبقي (للمورد)</p>
              <h4 className="text-xl font-black text-red-600">
                {supplierOrders.reduce((sum, o) => sum + (o.totalAmount - (o.paidAmount || 0)), 0).toLocaleString()} ج.م
              </h4>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-black text-black">سجل الفواتير والعمليات</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 border-b">
                    <th className="pb-3 px-2">التاريخ</th>
                    <th className="pb-3 px-2">رقم الفاتورة</th>
                    <th className="pb-3 px-2">القيمة</th>
                    <th className="pb-3 px-2">المسدد</th>
                    <th className="pb-3 px-2">المتبقي</th>
                    <th className="pb-3 px-2">الحالة</th>
                    <th className="pb-3 px-2 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {supplierOrders.map(order => (
                    <tr key={order.id} className="text-xs hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-2 font-bold text-gray-500">{formatDate(order.date)}</td>
                      <td className="py-4 px-2 font-black">{order.orderNumber}</td>
                      <td className="py-4 px-2 font-black">{order.totalAmount.toLocaleString()}</td>
                      <td className="py-4 px-2 font-black text-green-600">{(order.paidAmount || 0).toLocaleString()}</td>
                      <td className="py-4 px-2 font-black text-red-600">{(order.totalAmount - (order.paidAmount || 0)).toLocaleString()}</td>
                      <td className="py-4 px-2">
                         <span className={cn(
                           "px-2 py-0.5 rounded text-[9px] font-black", 
                           order.paymentStatus === 'paid' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                         )}>
                           {order.paymentStatus === 'paid' ? 'خالص' : 'آجل'}
                         </span>
                      </td>
                      <td className="py-4 px-2">
                         <div className="flex items-center justify-center gap-2">
                           <button onClick={() => onViewDetails(order)} className="p-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-lg transition-all"><Eye className="w-4 h-4" /></button>
                           <button onClick={() => onViewHistory(order.id!)} className="p-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-lg transition-all"><ArrowRightLeft className="w-4 h-4" /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {supplierOrders.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-gray-400 italic">لا توجد تعاملات مسجلة لهذا المورد</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
