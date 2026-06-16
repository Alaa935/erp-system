import React, { useState } from 'react';
import { Search, Plus, UserCircle, MapPin, Coins, ChevronLeft, ChevronRight, ClipboardList, Eye } from 'lucide-react';
import { Customer, SalesOrder } from '../../db/db';
import { cn, formatDate } from '../../lib/utils';

interface RepCustomersProps {
  customers: Customer[] | undefined;
  mySales: SalesOrder[] | undefined;
  onAddCustomer: () => void;
  onCollection: (customer: Customer) => void;
}

export const RepCustomersView = ({ customers, mySales, onAddCustomer, onCollection }: RepCustomersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredCustomers = customers?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  ) || [];

  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474D]" />
          <input 
            type="text" 
            placeholder="بحث في العملاء..."
            className="w-full bg-white border text-sm border-[#E0E3E5] rounded-xl py-2 pr-10 pl-4 focus:ring-1 focus:ring-black outline-none"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <button 
          onClick={onAddCustomer}
          className="w-full sm:w-auto bg-black text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          إضافة عميل جديد
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedCustomers.map(customer => (
              <div key={customer.id} className="bg-white p-5 rounded-2xl border border-[#E0E3E5] space-y-3 shadow-sm hover:border-black transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] text-[#44474D] font-bold">{formatDate(customer.createdAt)}</span>
                </div>
                <div>
                  <h3 className="font-black text-black">{customer.name}</h3>
                  <p className="text-sm text-[#44474D]">{customer.phone}</p>
                </div>
                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex items-center gap-2 text-[11px] text-[#44474D] truncate max-w-[150px]">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {customer.address}
                    </div>
                    {customer.latitude && customer.longitude && (
                      <a 
                        href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shrink-0"
                        title="عرض الموقع على الخريطة"
                      >
                        <MapPin className="w-3 h-3 text-red-500" />
                      </a>
                    )}
                    <button 
                      onClick={() => { window.location.hash = `#/customer/${customer.id}`; }}
                      className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors shrink-0"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => onCollection(customer)}
                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors shrink-0"
                    title="تسجيل تحصيل"
                  >
                    <Coins className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
               <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 bg-white border border-[#E0E3E5] rounded-xl disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="flex items-center px-6 font-black text-sm bg-white border border-[#E0E3E5] rounded-xl">
                {currentPage} / {totalPages}
              </div>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 bg-white border border-[#E0E3E5] rounded-xl disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E0E3E5] shadow-sm flex flex-col h-fit">
          <div className="p-4 border-b bg-gray-50/50">
            <h3 className="text-sm font-black text-black flex items-center gap-2">
               <ClipboardList className="w-4 h-4 text-blue-600" />
               آخر فواتير العملاء (المبيعات)
            </h3>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto no-scrollbar">
            {mySales?.slice(0, 10).map(order => {
              const customer = customers?.find(c => c.id === order.customerId);
              const remaining = order.totalAmount - (order.paidAmount || 0);
              return (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-black text-black">{order.orderNumber}</p>
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full font-black",
                      order.paymentStatus === 'paid' ? "bg-green-100 text-green-600" : (order.paymentStatus === 'partial' ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600")
                    )}>
                      {order.paymentStatus === 'paid' ? 'خالص' : (order.paymentStatus === 'partial' ? 'جزئي' : 'آجل')}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold">{customer?.name}</p>
                  <div className="flex justify-between items-center text-[10px] pt-1 text-right rtl" dir="rtl">
                    <span className="text-gray-400 font-bold">{formatDate(order.date)}</span>
                    <span className="font-black">{order.totalAmount.toLocaleString()} ج.م</span>
                  </div>
                  {remaining > 0 && (
                    <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-100 italic">
                       <p className="text-[9px] text-[#44474D]">المتبقي:</p>
                       <p className="text-[9px] text-red-600 font-black">{remaining.toLocaleString()} ج.م</p>
                    </div>
                  )}
                </div>
              )
            })}
            {mySales?.length === 0 && (
              <div className="p-10 text-center text-gray-400 text-xs italic">لا توجد سجلات مبيعات بعد</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
