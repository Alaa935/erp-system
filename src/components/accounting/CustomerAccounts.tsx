import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  ChevronRight, 
  ChevronLeft, 
  Search,
  Eye,
  ArrowRightLeft,
  Coins
} from 'lucide-react';
import { SalesOrder, Customer } from '../../db/db';
import { cn, formatDate } from '../../lib/utils';

interface CustomerAccountsProps {
  salesOrders: SalesOrder[] | undefined;
  customers: Customer[] | undefined;
  onViewDetails: (order: SalesOrder) => void;
  onViewHistory: (orderId: number) => void;
  onCollect: (customer: Customer) => void;
}

export const CustomerAccounts = ({
  salesOrders,
  customers,
  onViewDetails,
  onViewHistory,
  onCollect
}: CustomerAccountsProps) => {
  const [viewMode, setViewMode] = useState<'list' | 'statement'>('list');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredCustomers = customers?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);
  const customerOrders = salesOrders?.filter(o => o.customerId === selectedCustomerId) || [];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <h3 className="font-black text-black mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              مديونيات العملاء (فلوسنا في السوق)
            </h3>
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] no-scrollbar">
               {customers?.map(customer => {
                  const receivables = salesOrders?.filter(o => o.customerId === customer.id).reduce((sum, o) => sum + (o.totalAmount - (o.paidAmount || 0)), 0) || 0;
                  if (receivables <= 0) return null;
                  return (
                    <div 
                      key={customer.id} 
                      onClick={() => { setSelectedCustomerId(customer.id!); setViewMode('statement'); }}
                      className="p-4 bg-blue-50/30 rounded-xl flex justify-between items-center border border-blue-100 cursor-pointer hover:bg-blue-50 transition-all group"
                    >
                      <div>
                        <p className="text-sm font-black text-black group-hover:text-blue-700">{customer.name}</p>
                        <p className="text-[10px] text-gray-500 font-bold">{customer.phone}</p>
                      </div>
                      <div className="text-left" onClick={e => e.stopPropagation()}>
                        <p className="text-sm font-black text-blue-600">{receivables.toLocaleString()} ج.م</p>
                        <button 
                          onClick={() => onCollect(customer)}
                          className="text-[9px] font-black bg-blue-600 text-white px-3 py-1 rounded-lg mt-2 hover:opacity-80 transition-opacity flex items-center gap-1"
                        >
                          <Coins className="w-3 h-3" />
                          تسجيل تحصيل
                        </button>
                      </div>
                    </div>
                  )
               })}
               {(customers?.filter(c => (salesOrders?.filter(o => o.customerId === c.id).reduce((sum, o) => sum + (o.totalAmount - (o.paidAmount || 0)), 0) || 0) > 0).length === 0) && (
                 <div className="p-12 text-center text-gray-400 text-sm italic">لا توجد مديونيات مستحقة على العملاء</div>
               )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-black">كافة العملاء والسجل المالي</h3>
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
            <div className="space-y-1 flex-1">
               {paginatedCustomers.map(c => (
                 <div 
                   key={c.id} 
                   onClick={() => { setSelectedCustomerId(c.id!); setViewMode('statement'); }}
                   className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-all group border-b border-gray-50 last:border-0"
                 >
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-black text-[10px] text-gray-400 group-hover:bg-black group-hover:text-white">
                         {c.name.charAt(0)}
                       </div>
                       <p className="text-xs font-black group-hover:text-blue-600 transition-colors uppercase">{c.name}</p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                 </div>
               ))}
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
              <h3 className="text-2xl font-black">{selectedCustomer?.name}</h3>
              <p className="text-sm text-gray-500 font-bold">كشف حساب المبيعات والمديونيات</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-600 mb-1 uppercase tracking-wider">إجمالي المبيعات</p>
              <h4 className="text-xl font-black">
                {customerOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()} ج.م
              </h4>
            </div>
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
              <p className="text-[10px] font-black text-green-600 mb-1 uppercase tracking-wider">إجمالي المحصل</p>
              <h4 className="text-xl font-black">
                {customerOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0).toLocaleString()} ج.م
              </h4>
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <p className="text-[10px] font-black text-orange-600 mb-1 uppercase tracking-wider">المتبقي في السوق</p>
              <h4 className="text-xl font-black text-orange-600">
                {customerOrders.reduce((sum, o) => sum + (o.totalAmount - (o.paidAmount || 0)), 0).toLocaleString()} ج.م
              </h4>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-black text-black">تاريخ الفواتير والتحصيلات</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 border-b">
                    <th className="pb-3 px-2">التاريخ</th>
                    <th className="pb-3 px-2">رقم الفاتورة</th>
                    <th className="pb-3 px-2">القيمة</th>
                    <th className="pb-3 px-2 text-green-600">المحصل</th>
                    <th className="pb-3 px-2 text-blue-600">المتبقي</th>
                    <th className="pb-3 px-2">الحالة</th>
                    <th className="pb-3 px-2 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customerOrders.map(order => (
                    <tr key={order.id} className="text-xs hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-2 font-bold text-gray-500">{formatDate(order.date)}</td>
                      <td className="py-4 px-2 font-black">{order.orderNumber}</td>
                      <td className="py-4 px-2 font-black">{order.totalAmount.toLocaleString()}</td>
                      <td className="py-4 px-2 font-black text-green-600">{(order.paidAmount || 0).toLocaleString()}</td>
                      <td className="py-4 px-2 font-black text-blue-600">{(order.totalAmount - (order.paidAmount || 0)).toLocaleString()}</td>
                      <td className="py-4 px-2">
                         <span className={cn(
                           "px-2 py-0.5 rounded text-[9px] font-black", 
                           order.paymentStatus === 'paid' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                         )}>
                           {order.paymentStatus === 'paid' ? 'مسدد' : 'آجل'}
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
