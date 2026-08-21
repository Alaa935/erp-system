import React, { useState, useMemo } from 'react';
import type { SalesOrder } from '../types';
import { 
  Plus, 
  Search, 
  FileText, 
  XCircle, 
  Truck,
  Trash2,
  Eye,
  Percent,
  CheckCircle2,
  Package
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import SalesInvoiceModal from '../components/SalesInvoiceModal';
import { WorkspaceLayout, EnterpriseTable, type Column, Modal, Form, FormInput, FormSelect, FormSection, FormActions } from '../components/design-system';
import { useSalesOrders, useCreateSalesOrder, useDispatchSalesOrder, useCancelSalesOrder, useDeleteSalesOrder } from '../hooks/useSalesOrders';
import { useCustomers } from '../hooks/useCustomers';
import { useInventory } from '../hooks/useInventory';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';

import { toast } from 'sonner';

export default function SalesOrders() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReasonModalOpen, setDeleteReasonModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const [newOrder, setNewOrder] = useState({
    customerId: 0,
    taxId: undefined as number | undefined,
    items: [] as { itemId: number; quantity: number; price: number }[]
  });

  const { data: ordersData } = useSalesOrders({ pageSize: 10000 });
  const { data: customersData } = useCustomers({ pageSize: 1000 });
  const { data: inventoryData } = useInventory({ pageSize: 10000 });
  const { data: taxesData } = useQuery({
    queryKey: ['sales-orders', 'taxes'],
    queryFn: () => api<{ success: boolean; data: { id: number; name: string; rate: number; type: string; isInclusive: boolean }[] }>('/sales-orders/taxes'),
    staleTime: 300_000,
  });

  const createOrder = useCreateSalesOrder();
  const dispatchOrder = useDispatchSalesOrder();
  const cancelOrder = useCancelSalesOrder();
  const deleteOrder = useDeleteSalesOrder();

  const orders = ordersData?.orders ?? [];
  const customers = customersData?.items ?? [];
  const availableItems = inventoryData?.items ?? [];
  const taxes = taxesData?.data ?? [];

  const tableData = useMemo(() => orders.map(order => ({
    ...order,
    _customerName: customers?.find(c => c.id === order.customerId)?.name || ''
  })), [orders, customers]);

  const columns: Column<any>[] = [
    { key: 'orderNumber', label: 'رقم الفاتورة', sortable: true, render: (order) => <span className='font-bold text-black'>{order.orderNumber}</span> },
    { key: '_customerName', label: 'العميل', sortable: true, render: (order) => <span className='text-sm font-bold'>{order._customerName}</span> },
    { key: 'date', label: 'التاريخ', sortable: true, render: (order) => <span className='text-sm text-[#44474D]'>{formatDate(new Date(order.date).getTime())}</span> },
    { key: 'totalAmount', label: 'القيمة', sortable: true, render: (order) => <span className='font-bold'>{formatCurrency(order.totalAmount)}</span> },
    { key: 'status', label: 'الحالة', render: (order) => (
      <div className='flex justify-center'>
        <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border', getStatusStyle(order.status))}>
          {order.status === 'pending' ? 'قيد التجهيز' : order.status === 'shipped' ? 'تم الشحن' : 'ملغي'}
        </span>
      </div>
    )},
    {
      key: 'actions',
      label: '',
      render: (order) => (
        <div className='flex items-center gap-2 justify-end'>
          <button onClick={() => order.id && setSelectedInvoice(order.id)} className='p-1.5 text-black hover:bg-gray-100 rounded-lg transition-colors' title='معاينة الفاتورة'>
            <Eye className='w-4 h-4' />
          </button>
          {order.status === 'pending' && (
            <>
              <button onClick={() => order.id && handleDispatchOrder(order.id)} className='bg-black text-white px-3 py-1 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity'>
                صرف وشحن
              </button>
              <button onClick={() => order.id !== undefined && confirmCancel(order.id)} className='text-orange-500 hover:bg-orange-50 p-1.5 rounded-lg transition-colors cursor-pointer' title='إلغاء الطلب'>
                <XCircle className='w-4 h-4' />
              </button>
            </>
          )}
          <button onClick={() => order.id && handleDeleteRequest(order.id)} className='p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors' title='حذف نهائي'>
            <Trash2 className='w-4 h-4' />
          </button>
        </div>
      ),
      className: 'text-left'
    }
  ];

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrder.customerId === 0 || newOrder.items.length === 0) {
      toast.error('يرجى اختيار العميل وإضافة أصناف للفاتورة');
      return;
    }

    try {
      setIsSubmitting(true);
      
      for (const item of newOrder.items) {
        if (item.quantity <= 0) {
          toast.error('الكمية يجب أن تكون أكبر من صفر');
          return;
        }
        if (item.price < 0) {
          toast.error('السعر لا يمكن أن يكون سالباً');
          return;
        }
      }

      await createOrder.mutateAsync({
        customerId: newOrder.customerId,
        items: newOrder.items,
        taxId: newOrder.taxId || null,
      });

      toast.success('تم إنشاء طلب البيع بنجاح');
      setModalOpen(false);
      setNewOrder({ customerId: 0, taxId: undefined, items: [] });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'فشل إنشاء الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItemToOrder = (itemId: number) => {
    const item = availableItems?.find(i => i.id === itemId);
    if (!item) return;
    
    const existingItemIdx = newOrder.items.findIndex(i => i.itemId === itemId);
    if (existingItemIdx > -1) {
      toast.info('الصنف موجود بالفعل في الفاتورة');
      return;
    }

    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { itemId, quantity: 1, price: item.sellingPrice || 0 }]
    });
  };

  const handleDispatchOrder = async (orderId: number) => {
    try {
      setIsSubmitting(true);
      await dispatchOrder.mutateAsync(orderId);
      toast.success('تم صرف وشحن الطلب بنجاح');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'فشل صرف الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (id: number) => {
    setOrderToDelete(id);
    setDeleteReasonModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteReason) {
      toast.error('يرجى اختيار سبب الحذف');
      return;
    }
    
    if (orderToDelete) {
      try {
        await deleteOrder.mutateAsync({ id: orderToDelete, reason: deleteReason });
        toast.success('تم حذف الفاتورة بنجاح');
      } catch (error) {
        toast.error('فشل حذف الفاتورة');
      }
    }
    setDeleteReasonModalOpen(false);
    setOrderToDelete(null);
    setDeleteReason('');
  };

  const handleCancelOrder = async () => {
    if (orderToDelete === null) return;
    try {
      setIsSubmitting(true);
      await cancelOrder.mutateAsync(orderToDelete);
      toast.success('تم إلغاء الطلب بنجاح');
      setDeleteModalOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('فشل إلغاء الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmCancel = (id: number) => {
    setOrderToDelete(id);
    setDeleteModalOpen(true);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'shipped': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <WorkspaceLayout maxWidth="xl">
      <WorkspaceLayout.Header
        icon={Truck}
        title="أوامر البيع والصرف"
        subtitle="إدارة مبيعات العملاء وعمليات صرف المخزون"
        actions={
          <button 
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            أمر بيع جديد
          </button>
        }
      />

      <EnterpriseTable
        data={tableData}
        columns={columns}
        keyExtractor={(o) => o.id!}
        searchable
        searchKeys={['orderNumber', '_customerName']}
        searchPlaceholder='رقم الفاتورة أو العميل...'
        pagination
        pageSize={8}
        compact
        emptyState={
          <div className='flex flex-col items-center gap-2 py-12'>
            <FileText className='w-10 h-10 text-gray-200' />
            <p className='font-bold text-gray-400'>لا توجد فواتير</p>
            <p className='text-xs text-gray-300'>لم يتم إصدار أي فواتير بيع بعد</p>
          </div>
        }
      />

      {selectedInvoice && orders?.find((o: any) => o.id === selectedInvoice) && (
        <SalesInvoiceModal 
          order={orders.find((o: any) => o.id === selectedInvoice)!} 
          onClose={() => setSelectedInvoice(null)} 
        />
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="أمر بيع جديد"
        subtitle="إصدار فاتورة بيع وصرف مخزني"
        size="3xl"
        titleIcon={<Truck className="text-white w-6 h-6" />}
      >
        <Form onSubmit={handleCreateOrder} className="space-y-6">
          <FormSelect
            label="العميل"
            required
            value={newOrder.customerId}
            onChange={(e) => setNewOrder({...newOrder, customerId: parseInt(e.target.value)})}
            options={[
              { value: 0, label: 'اختر العميل...' },
              ...(customers?.map(c => ({ value: c.id!, label: c.name })) || [])
            ]}
          />

          <FormSection title="إضافة أصناف للفاتورة" icon={<Package className="w-4 h-4" />}>
            <FormSelect
              value=""
              onChange={(e) => addItemToOrder(parseInt(e.target.value))}
              placeholder="اختر صنفاً..."
              options={
                availableItems?.filter((i: any) => i.quantity > 0).map(item => ({
                  value: item.id!,
                  label: `${item.name} (متاح: ${item.quantity})`
                })) || []
              }
            />
          </FormSection>

          <div className="border border-[#E0E3E5] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#ECEEF0]">
                <tr>
                  <th className="px-4 py-2 text-right">الصنف</th>
                  <th className="px-4 py-2 text-right">الكمية</th>
                  <th className="px-4 py-2 text-right">السعر</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {newOrder.items.map((item, idx) => {
                  const itemInfo = availableItems?.find((i: any) => i.id === item.itemId);
                  return (
                    <tr key={idx} className="border-t border-[#E0E3E5]">
                      <td className="px-4 py-2">{itemInfo?.name ?? '؟'}</td>
                      <td className="px-4 py-2">
                        <FormInput
                          type="number"
                          min={1}
                          max={itemInfo?.quantity}
                          value={item.quantity || ''}
                          onChange={(e) => {
                            const items = [...newOrder.items];
                            const currentItem = items[idx];
                            if (currentItem) {
                              currentItem.quantity = parseInt(e.target.value) || 0;
                              setNewOrder({...newOrder, items});
                            }
                          }}
                          className="[&_input]:w-16 [&_input]:rounded"
                        />
                      </td>
                      <td className="px-4 py-2">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2 text-left">
                        <button
                          type="button"
                          onClick={() => {
                            const items = newOrder.items.filter((_, i) => i !== idx);
                            setNewOrder({...newOrder, items});
                          }}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-[#E0E3E5] space-y-4">
            <div className="flex justify-between items-center text-sm font-bold text-[#44474D]">
              <span>إجمالي بنود الفاتورة:</span>
              <span>{formatCurrency(newOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0))}</span>
            </div>

            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#E0E3E5]">
              <div className="flex items-center gap-2 text-xs font-black text-gray-400">
                <Percent className="w-3 h-3" />
                <span>اختار الضريبة المطبقة</span>
              </div>
              <FormSelect
                value={newOrder.taxId || ''}
                onChange={(e) => setNewOrder({...newOrder, taxId: e.target.value ? Number(e.target.value) : undefined})}
                options={[
                  { value: '', label: 'بدون ضريبة' },
                  ...(taxes?.map((t: any) => ({ value: t.id, label: `${t.name} (${t.rate}%)` })) || [])
                ]}
                className="[&_select]:bg-gray-100 [&_select]:border-none [&_select]:rounded-lg [&_select]:px-2 [&_select]:py-1 [&_select]:text-[11px]"
              />
            </div>

            {newOrder.taxId && (
              <div className="flex justify-between items-center text-xs font-bold text-blue-600 px-1">
                <span>قيمة الضريبة:</span>
                <span>
                  {(() => {
                    const tax = taxes?.find((t: any) => t.id === newOrder.taxId);
                    const sub = newOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                    if (!tax) return formatCurrency(0);
                    const val = tax.isInclusive ? (sub - (sub / (1 + tax.rate / 100))) : (sub * (tax.rate / 100));
                    return formatCurrency(val);
                  })()}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-[#E0E3E5]">
              <span className="text-sm font-black text-black">الإجمالي النهائي:</span>
              <span className="text-2xl font-black text-black">
                {(() => {
                  const sub = newOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                  const tax = taxes?.find((t: any) => t.id === newOrder.taxId);
                  const total = tax ? (tax.isInclusive ? sub : sub + (sub * (tax.rate / 100))) : sub;
                  return formatCurrency(total);
                })()}
              </span>
            </div>
          </div>

          <FormActions
            primaryLabel="تأكيد وإنشاء الفاتورة"
            secondaryLabel="إلغاء"
            onSecondary={() => setModalOpen(false)}
            loading={isSubmitting}
            primaryClassName="flex items-center justify-center gap-2"
          />
        </Form>
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setOrderToDelete(null); }}
        title="إلغاء أمر البيع"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <p className="text-[#44474D] text-sm mb-8">هل أنت متأكد من رغبتك في إلغاء أمر البيع هذا؟ لا يمكن التراجع عن هذا الإجراء.</p>
          
          <div className="flex gap-3">
            <button
              onClick={handleCancelOrder}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              نعم، إلغاء
            </button>
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setOrderToDelete(null);
              }}
              className="flex-1 bg-gray-100 text-[#44474D] py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              تراجع
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteReasonModalOpen}
        onClose={() => setDeleteReasonModalOpen(false)}
        title="حذف فاتورة بيع"
        subtitle="سيتم تسجيل سبب الحذف في سجل النظام"
        size="md"
        titleIcon={<Trash2 className="w-6 h-6 text-white" />}
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-black text-black">لماذا تريد حذف هذه الفاتورة؟</label>
            <div className="grid grid-cols-1 gap-2">
              {['إلغاء من قبل العميل', 'خطأ في الأصناف أو الأسعار', 'مرتجع كامل للفاتورة', 'تكرار الطلب', 'أخرى'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setDeleteReason(reason)}
                  className={cn(
                    "w-full text-right px-4 py-3 rounded-xl text-sm font-bold border transition-all",
                    deleteReason === reason 
                      ? "bg-red-500 text-white border-red-500" 
                      : "bg-white text-gray-600 border-gray-200 hover:border-red-500"
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={confirmDelete}
              className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-red-700 transition-colors"
            >
              تأكيد الحذف
            </button>
            <button
              onClick={() => setDeleteReasonModalOpen(false)}
              className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black hover:bg-gray-200 transition-colors"
            >
              تراجع
            </button>
          </div>
        </div>
      </Modal>
    </WorkspaceLayout>
  );
}
