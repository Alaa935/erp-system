import React, { useState, useMemo, useEffect } from 'react';
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import { useSuppliers } from '../hooks/useSuppliers';
import { useInventory } from '../hooks/useInventory';
import type { PurchaseOrder, Item, Supplier } from '../types';
import { 
  Plus, 
  Search, 
  FileText, 
  ShoppingCart, 
  Eye,
  DollarSign,
  Printer,
  TrendingUp,
  Package,
  Users,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { WorkspaceLayout, EnterpriseTable, type Column, Modal } from '../components/design-system';
import { TableActionMenu, type ActionItem } from '../components/ui/TableActionMenu';

interface Props {
  onNavigate?: (page: string) => void;
}

export default function SupplierInvoices({ onNavigate }: Props) {
  console.log('[RENDER] SupplierInvoices page');
  useEffect(() => {
    console.log('[MOUNT] SupplierInvoices page');
    return () => console.log('[UNMOUNT] SupplierInvoices page');
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: invoicesRes } = usePurchaseOrders();
  const invoices = (invoicesRes as any)?.orders;
  const { data: suppliersRes } = useSuppliers();
  const suppliers = (suppliersRes as any)?.items;
  const { data: itemsRes } = useInventory({ pageSize: 1000 } as any);
  const availableItems = (itemsRes as any)?.items;

  const filteredInvoices = invoices?.filter((invoice: PurchaseOrder) => {
    const supplierName = suppliers?.find((s: Supplier) => s.id === invoice.supplierId)?.name || '';
    const matchesSearch = invoice.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (invoice.invoiceNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayment = filterPaymentStatus === 'all' || invoice.paymentStatus === filterPaymentStatus;
    
    return matchesSearch && matchesPayment;
  });


  const stats = [
    { label: 'إجمالي الفواتير', value: invoices?.length || 0, icon: FileText, color: 'text-black' },
    { label: 'قيمة المشتريات', value: formatCurrency(invoices?.reduce((acc: number, inv: PurchaseOrder) => acc + inv.totalAmount, 0) || 0), icon: DollarSign, color: 'text-green-600' },
    { label: 'عدد الموردين', value: suppliers?.length || 0, icon: Users, color: 'text-blue-600' },
    { label: 'المخزون المضاف (قطعة)', value: invoices?.reduce((acc: number, inv: PurchaseOrder) => acc + inv.items.reduce((sum: number, i: any) => sum + i.quantity, 0), 0) || 0, icon: Package, color: 'text-purple-600' },
  ];

  const tableData = useMemo(() => (filteredInvoices || []).map((inv: PurchaseOrder) => ({
    ...inv,
    _supplierName: suppliers?.find((s: Supplier) => s.id === inv.supplierId)?.name || ''
  })), [filteredInvoices, suppliers]);

  const columns: Column<PurchaseOrder & { _supplierName: string }>[] = [
    { key: 'orderNumber', label: 'رقم المرجع', sortable: true, render: (inv) => (
      <>
        <p className='font-bold text-black'>{inv.orderNumber}</p>
        {inv.invoiceNumber && <p className='text-[10px] text-gray-500'>مورد: #{inv.invoiceNumber}</p>}
      </>
    )},
    { key: '_supplierName', label: 'المورد', sortable: true, render: (inv) => <span className='text-sm font-bold text-gray-700'>{inv._supplierName}</span> },
    { key: 'date', label: 'التاريخ', sortable: true, render: (inv) => <span className='text-sm text-[#44474D]'>{formatDate(inv.date)}</span> },
    { key: 'totalAmount', label: 'القيمة', sortable: true, render: (inv) => <span className='font-bold text-black'>{formatCurrency(inv.totalAmount)}</span> },
    { key: 'paymentStatus', label: 'حالة الدفع', render: (inv) => (
      <div className='flex justify-center'>
        <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1',
          inv.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
          inv.paymentStatus === 'partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'
        )}>
          {inv.paymentStatus === 'paid' ? 'مدفوعة' : inv.paymentStatus === 'partial' ? 'مدفوعة جزئياً' : 'آجلة'}
        </span>
      </div>
    )},
    {
      key: 'actions',
      label: '',
      render: (inv) => (
        <div className='flex items-center gap-2 justify-end'>
          <button onClick={() => { setSelectedOrder(inv); setDetailsModalOpen(true); }} className='p-2 hover:bg-black hover:text-white rounded-lg transition-all text-gray-400' title='عرض التفاصيل'>
            <Eye className='w-5 h-5' />
          </button>
        </div>
      ),
      className: 'text-left'
    }
  ];

  return (
    <WorkspaceLayout maxWidth="xl">
      <WorkspaceLayout.Header
        icon={FileText}
        title="فواتير الموردين"
        subtitle="إدارة المشتريات وتحديث المخزون مباشرة"
        actions={
          <button 
            onClick={() => onNavigate?.('supplier-invoice-create')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة فاتورة مورد
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-[#E0E3E5] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[#44474D] text-[12px] font-bold">{stat.label}</p>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <h3 className="text-2xl font-bold text-black leading-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {['all', 'paid', 'partial', 'unpaid'].map((status) => (
            <button 
              key={status}
              onClick={() => setFilterPaymentStatus(status as any)}
              className={cn("px-4 py-1.5 rounded-full text-[12px] font-bold transition-colors whitespace-nowrap",
                filterPaymentStatus === status ? "bg-black text-white" : "hover:bg-gray-100 text-gray-500 border border-gray-200"
              )}
            >
              {status === 'all' ? 'الكل' : status === 'paid' ? 'مدفوعة' : status === 'partial' ? 'مدفوعة جزئياً' : 'آجلة'}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="رقم الفاتورة أو المورد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium w-full py-2 pr-10 pl-4 text-xs"
          />
        </div>
      </div>

      <EnterpriseTable
        data={tableData}
        columns={columns}
        keyExtractor={(inv) => inv.id!}
        searchable={false}
        pagination
        pageSize={8}
        compact
        emptyState={
          <div className='flex flex-col items-center gap-2 py-12 opacity-50'>
            <FileText className='w-12 h-12 text-gray-300' />
            <p className='font-bold text-gray-400'>لا توجد فواتير موردين مسجلة</p>
          </div>
        }
      />

      <Modal
        open={isDetailsModalOpen && !!selectedOrder}
        onClose={() => setDetailsModalOpen(false)}
        title="فاتورة مشتريات مورد"
        subtitle={selectedOrder?.orderNumber}
        size="3xl"
        titleIcon={<FileText className="text-white w-6 h-6" />}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setDetailsModalOpen(false)}
              className="flex-1 bg-black text-white py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity"
            >
              إغلاق النافذة
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 bg-white border-2 border-[#E0E3E5] text-[#44474D] font-bold rounded-2xl hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              طباعة
            </button>
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 mb-1">المورد</p>
                <p className="text-sm font-bold">{suppliers?.find((s: Supplier) => s.id === selectedOrder.supplierId)?.name || 'غير معروف'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 mb-1">تاريخ الفاتورة</p>
                <p className="text-sm font-bold">{formatDate(selectedOrder.date)}</p>
              </div>
              <div className="bg-black p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-400 mb-1">طريقة الدفع</p>
                <p className="text-sm font-bold text-white">
                  {selectedOrder.paymentMethod === 'cash' ? 'نقدي' : 
                  selectedOrder.paymentMethod === 'transfer' ? 'تحويل' :
                  selectedOrder.paymentMethod === 'check' ? 'شيك' : 'مديونية / آجل'}
                </p>
              </div>
            </div>

            <div className="p-6 bg-white border-2 border-[#E0E3E5] rounded-3xl space-y-4">
              <div className="flex items-center gap-3 mb-2 underline decoration-black underline-offset-4 decoration-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h4 className="font-bold text-black">ملخص القيمة المالية</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center md:text-right">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-1">إجمالي الفاتورة</p>
                  <p className="text-lg font-bold text-black">{formatCurrency(selectedOrder.totalAmount || 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-1">المبلغ المدفوع</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(selectedOrder.paidAmount || 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-1">المتبقي للمورد</p>
                  <p className={cn("text-lg font-bold",
                    (selectedOrder.totalAmount - selectedOrder.paidAmount) > 0 ? "text-red-500" : "text-green-500"
                  )}>
                    {formatCurrency(selectedOrder.totalAmount - (selectedOrder.paidAmount || 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-black">الأصناف الموردة</h4>
              </div>
              <div className="border border-[#E0E3E5] rounded-2xl overflow-hidden">
                <table className="w-full text-right text-sm">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-3">الصنف / SKU</th>
                      <th className="px-4 py-3 text-center">الكمية</th>
                      <th className="px-4 py-3">السعر</th>
                      <th className="px-4 py-3">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedOrder.items.map((item: any, idx: number) => {
                      const itemInfo = availableItems?.find((i: Item) => i.id === item.itemId);
                      return (
                        <tr key={idx} className="bg-white">
                          <td className="px-4 py-3">
                            <p className="font-bold">{itemInfo?.name || `صنف #${item.itemId}`}</p>
                            <p className="text-[10px] text-gray-400">{itemInfo?.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-black text-white px-2 py-0.5 rounded-lg text-[11px] font-bold">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-bold">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 font-bold">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                <p className="text-[10px] font-bold text-yellow-600 mb-1">ملاحظات إضافية</p>
                <p className="text-sm font-bold text-yellow-900">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </WorkspaceLayout>
  );
}
