import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Customer } from '../types';
import { Search, Plus, Phone, Mail, MapPin, Edit2, Trash2, User, ShoppingCart, Eye, FileText, CheckCircle2, XCircle, CreditCard, History, Wallet } from 'lucide-react';
import { cn, formatDate, formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { EmptyState, Modal, Form, FormInput, FormSection, FormActions } from '../components/design-system';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../hooks/useCustomers';
import { useSalesReps } from '../hooks/useSalesReps';
import { useInventory } from '../hooks/useInventory';
import { useSalesOrders } from '../hooks/useSalesOrders';
import { usePaymentCollections, useConfirmPaymentCollection } from '../hooks/usePaymentCollections';
import { LoadingButton } from '../components/ui/LoadingButton';

export default function Customers() {
  console.log('[RENDER] Customers page');
  useEffect(() => {
    console.log('[MOUNT] Customers page');
    return () => console.log('[UNMOUNT] Customers page');
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteReasonModalOpen, setDeleteReasonModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [isOrderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    loyaltyPoints: 0
  });

  const [activeTab, setActiveTab] = useState<'list' | 'collections'>('list');

  const { data: paymentData, isLoading: collectionsLoading } = usePaymentCollections();
  const { data: repsData } = useSalesReps({ noPagination: 'true' } as any);
  const { data: itemsData } = useInventory();
  const collections = paymentData?.items || [];
  const salesReps = repsData?.items || [];
  const allItems = itemsData?.items || [];

  const { data: salesOrdersForDetail } = useSalesOrders(
    selectedCustomerForDetail?.id ? { customerId: selectedCustomerForDetail.id, pageSize: 1000 } as any : undefined
  );
  const { data: collectionsForDetail } = usePaymentCollections(
    selectedCustomerForDetail?.id ? { customerId: selectedCustomerForDetail.id } : undefined
  );

  const customerDetailResult = selectedCustomerForDetail?.id ? {
    orders: (salesOrdersForDetail as any)?.orders || [],
    collections: (collectionsForDetail as any)?.items || [],
  } : null;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const customersQuery = useCustomers(debouncedSearch ? { search: debouncedSearch } : undefined);
  const allCustomersQuery = useCustomers({ pageSize: 1000 });
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const customers = customersQuery.data?.items;
  const allCustomers = allCustomersQuery.data?.items || [];

  const customersLookup = useMemo(() => {
    const map = new Map<number, Customer>();
    allCustomers.forEach(c => { if (c.id !== undefined) map.set(c.id, c); });
    return map;
  }, [allCustomers]);

  const pendingCollectionsCount = useMemo(() =>
    collections?.filter((c: any) => c.status === 'pending').length || 0,
    [collections]
  );

  const confirmCollectionMut = useConfirmPaymentCollection();

  const handleConfirmCollection = async (id: number) => {
    try {
      await confirmCollectionMut.mutateAsync({ id, status: 'confirmed' });
      toast.success('تم تأكيد عملية التحصيل بنجاح');
    } catch (error) {
      console.error(error);
      toast.error('فشل تأكيد عملية التحصيل');
    }
  };

  const handleRejectCollection = async (id: number) => {
    try {
      await confirmCollectionMut.mutateAsync({ id, status: 'rejected' });
      toast.success('تم رفض عملية التحصيل');
    } catch (error) {
      console.error(error);
      toast.error('فشل رفض العملية');
    }
  };

  const fetchOrderDetails = (order: any) => {
    setSelectedOrderDetails(order);
    setOrderDetailsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) {
      toast.error('يرجى إدخال اسم العميل');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingCustomer) {
        await updateCustomer.mutateAsync({ id: editingCustomer.id!, data: newCustomer });
        toast.success('تم تحديث بيانات العميل بنجاح');
      } else {
        await createCustomer.mutateAsync(newCustomer);
        toast.success('تمت إضافة العميل بنجاح');
      }

      setModalOpen(false);
      setEditingCustomer(null);
      setNewCustomer({ name: '', phone: '', email: '', address: '', loyaltyPoints: 0 });
    } catch (error) {
      console.error(error);
      toast.error('فشل حفظ بيانات العميل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setNewCustomer({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      loyaltyPoints: customer.loyaltyPoints || 0
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (customerToDelete === null || !deleteReason) {
      toast.error('يرجى اختيار سبب الحذف');
      return;
    }
    try {
      setIsSubmitting(true);
      await deleteCustomer.mutateAsync({ id: customerToDelete, reason: deleteReason });

      toast.success('تم حذف العميل بنجاح');
      setDeleteReasonModalOpen(false);
      setCustomerToDelete(null);
      setDeleteReason('');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('فشل حذف العميل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: number) => {
    setCustomerToDelete(id);
    setDeleteReasonModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-1">إدارة العملاء والتحصيل</h2>
          <p className="text-[#44474D] text-sm">قاعدة بيانات العملاء وسجل عمليات التحصيل المالي</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="bg-white p-1 rounded-xl border border-gray-200 flex gap-1">
            <button 
              onClick={() => setActiveTab('list')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black transition-all",
                activeTab === 'list' ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              قائمة العملاء
            </button>
            <button 
              onClick={() => setActiveTab('collections')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2",
                activeTab === 'collections' ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              طلبات التحصيل
              {pendingCollectionsCount > 0 ? (
                <span className="bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">
                  {pendingCollectionsCount}
                </span>
              ) : null}
            </button>
          </div>
          <button 
            onClick={() => setModalOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-xs font-black"
          >
            <Plus className="w-4 h-4" />
            إضافة عميل
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          <div className="card-premium p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="البحث بالاسم أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-premium w-full py-2 pr-10 pl-4 text-sm"
              />
            </div>
          </div>

          {customersQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-[#E0E3E5] p-6 animate-pulse">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-gray-200 rounded-xl w-12 h-12" />
                    <div className="w-16 h-4 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-3">
                    <div className="w-24 h-4 bg-gray-200 rounded" />
                    <div className="w-32 h-3 bg-gray-200 rounded" />
                    <div className="w-20 h-3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : customersQuery.isError ? (
            <div className="col-span-full text-center py-12">
              <p className="text-red-500 font-bold mb-2">فشل تحميل بيانات العملاء</p>
              <button onClick={() => customersQuery.refetch()} className="text-sm text-blue-600 underline cursor-pointer">إعادة المحاولة</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customers?.map((customer) => (
                <div 
                  key={customer.id} 
                  onClick={() => setSelectedCustomerForDetail(customer)}
                  className="bg-white rounded-xl border border-[#E0E3E5] p-6 shadow-sm hover:border-black transition-all group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-gray-100 p-3 rounded-xl text-black">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.location.hash = `#/customer/${customer.id}`; }}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4 pointer-events-none" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}
                        className="p-2 hover:bg-[#ECEEF0] rounded-lg text-[#44474D]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); customer.id !== undefined && confirmDelete(customer.id); }}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="حذف العميل"
                      >
                        <Trash2 className="w-4 h-4 pointer-events-none" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-black">{customer.name}</h3>
                    <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                      <span>{customer.loyaltyPoints || 0} نقطة</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-[#44474D]">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{customer.phone || 'غير مسجل'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#44474D]">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>{customer.email || 'غير مسجل'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#44474D]">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="line-clamp-1">{customer.address || 'بلا عنوان'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(!customers || customers.length === 0) && (
                <div className="col-span-full">
                  <EmptyState icon={User} title="لا يوجد عملاء مسجلين" description="أضف عميلك الأول باستخدام الزر أعلاه" />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-gray-400" />
              <h3 className="font-black text-lg">سجل طلبات تحصيل المبالغ</h3>
            </div>
            <div className="flex gap-4 items-center text-xs font-bold text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span>قيد الانتظار</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>مكتمل</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right" dir="rtl">
              <thead className="table-header">
                <tr>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">العميل</th>
                  <th className="p-4">المندوب</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4">الطريقة</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {collections?.map((col: any) => (
                  <tr key={col.id} className="table-row">
                    <td className="p-4 text-xs font-bold text-gray-600">
                      {formatDate(col.date)}
                    </td>
                    <td className="p-4 font-black text-sm">
                      {customersLookup.get(col.customerId)?.name || 'غير معروف'}
                    </td>
                    <td className="p-4 text-xs font-bold text-gray-500">
                      {salesReps?.find(r => r.id === col.repId)?.name || 'غير معروف'}
                    </td>
                    <td className="p-4 font-black">
                      {formatCurrency(col.amount)}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-lg font-black">
                        {col.method === 'cash' ? 'نقدي' : col.method === 'transfer' ? 'تحويل' : 'شيك'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] px-2 py-1 rounded-lg font-black",
                        col.status === 'confirmed' ? "bg-green-100 text-green-600" :
                        col.status === 'rejected' ? "bg-red-100 text-red-600" :
                        "bg-orange-100 text-orange-600"
                      )}>
                        {col.status === 'confirmed' ? 'تم التأكيد' : 
                         col.status === 'rejected' ? 'مرفوض' : 'بانتظار التأكيد'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {col.status === 'pending' ? (
                          <>
                            <LoadingButton
                              onClick={() => handleConfirmCollection(col.id!)}
                              isPending={confirmCollectionMut.isPending}
                              loadingText="جاري التنفيذ..."
                              variant="outline"
                              size="sm"
                              className="bg-emerald-50 text-emerald-700 border-0 hover:bg-emerald-100"
                            >
                              ✓
                            </LoadingButton>
                            <LoadingButton
                              onClick={() => handleRejectCollection(col.id!)}
                              isPending={confirmCollectionMut.isPending}
                              loadingText="جاري التنفيذ..."
                              variant="outline"
                              size="sm"
                              className="bg-rose-50 text-rose-700 border-0 hover:bg-rose-100"
                            >
                              ✕
                            </LoadingButton>
                          </>
                        ) : (
                          <div className="text-[10px] text-gray-400 flex items-center gap-1 font-bold">
                            {col.status === 'confirmed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            أرشيف
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!collections || collections.length === 0) && !collectionsLoading && (
                  <tr>
                    <td colSpan={7} className="p-8">
                      <EmptyState icon={Wallet} title="لا يوجد سجل تحصيلات" description="سيتم عرض عمليات التحصيل هنا عند ورودها" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => { setModalOpen(false); setEditingCustomer(null); }}
        title={editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
        subtitle="يرجى تعبئة بيانات التواصل بدقة"
        titleIcon={<User className="w-6 h-6" />}
        size="xl"
      >
        <Form onSubmit={handleSaveCustomer}>
          <div className="space-y-6">
            <FormSection title="بيانات العميل" description="معلومات الاتصال الأساسية" icon={<User className="w-4 h-4" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="اسم العميل بالتفصيل"
                  required
                  value={newCustomer.name ?? ''}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                />
                <FormInput
                  label="رقم الهاتف"
                  type="tel"
                  value={newCustomer.phone ?? ''}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                />
                <FormInput
                  label="البريد الإلكتروني"
                  type="email"
                  value={newCustomer.email ?? ''}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                />
                <FormInput
                  label="العنوان"
                  value={newCustomer.address ?? ''}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                />
              </div>
            </FormSection>

            <FormSection title="نقاط الولاء" description="رصيد نقاط العميل" icon={<Wallet className="w-4 h-4" />}>
              <FormInput
                label="نقاط الولاء"
                type="number"
                value={newCustomer.loyaltyPoints == null ? '' : newCustomer.loyaltyPoints}
                onChange={(e) => setNewCustomer({...newCustomer, loyaltyPoints: parseInt(e.target.value) || 0})}
              />
            </FormSection>
          </div>

          <FormActions
            primaryLabel="حفظ البيانات"
            secondaryLabel="إلغاء"
            onSecondary={() => { setModalOpen(false); setEditingCustomer(null); }}
            loading={isSubmitting || createCustomer.isPending || updateCustomer.isPending}
          />
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteReasonModalOpen}
        onClose={() => { setDeleteReasonModalOpen(false); setCustomerToDelete(null); setDeleteReason(''); }}
        title="حذف عميل نهائياً"
        subtitle="سيتم إزالة كافة سجلات المديونية والطلبات الخاصة به"
        titleIcon={<Trash2 className="w-6 h-6 text-white" />}
        size="md"
        footer={
          <div className="flex gap-3">
            <LoadingButton
              onClick={handleDelete}
              isPending={deleteCustomer.isPending}
              loadingText="جاري الحذف..."
              variant="danger"
              size="md"
            >
              تأكيد الحذف
            </LoadingButton>
            <button
              onClick={() => { setDeleteReasonModalOpen(false); setCustomerToDelete(null); setDeleteReason(''); }}
              className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black hover:bg-gray-200 transition-colors"
            >
              تراجع
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="text-sm font-black text-black">ما سبب حذف هذا العميل؟</label>
          <div className="grid grid-cols-1 gap-2">
            {['توقف التعامل', 'عميل وهمي / تجريبي', 'خطأ في إدخال البيانات', 'طلب العميل حذف بياناته', 'أخرى'].map((reason) => (
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
      </Modal>
      
      {/* Customer Detail Modal */}
      <Modal
        open={!!selectedCustomerForDetail}
        onClose={() => setSelectedCustomerForDetail(null)}
        title={selectedCustomerForDetail?.name || ''}
        subtitle={selectedCustomerForDetail?.address}
        titleIcon={
          <span className="text-lg font-black text-white">{selectedCustomerForDetail?.name?.[0]}</span>
        }
        size="4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-2">
               <ShoppingCart className="w-3.5 h-3.5" />
               إجمالي المبيعات
            </p>
            <h4 className="text-xl font-black">
              {customerDetailResult?.orders?.reduce((sum: number, o: any) => sum + o.totalAmount, 0).toLocaleString()} ج.م
            </h4>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <p className="text-xs font-bold text-green-600 mb-1 flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5" />
              إجمالي المحصل
            </p>
            <h4 className="text-xl font-black text-green-700">
              {customerDetailResult?.collections?.filter((c: any) => c.status === 'confirmed').reduce((sum: number, c: any) => sum + c.amount, 0).toLocaleString()} ج.م
            </h4>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <p className="text-xs font-bold text-red-600 mb-1 flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5" />
              المتبقي (مديونية)
            </p>
            <h4 className="text-xl font-black text-red-700">
              {(customerDetailResult?.orders?.reduce((sum: number, o: any) => sum + o.totalAmount, 0) || 0) - 
               (customerDetailResult?.collections?.filter((c: any) => c.status === 'confirmed').reduce((sum: number, c: any) => sum + c.amount, 0) || 0)} ج.م
            </h4>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
            <p className="text-xs font-bold text-yellow-600 mb-1 flex items-center gap-2">
              <History className="w-3.5 h-3.5" />
              النقاط والطلبات
            </p>
            <h4 className="text-xl font-black">{customerDetailResult?.orders.length || 0} طلب / {selectedCustomerForDetail?.loyaltyPoints || 0} نقطة</h4>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="font-black text-lg mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-400" />
              سجل طلبات العميل
            </h4>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-xs font-black text-right">الطلب</th>
                    <th className="p-3 text-xs font-black text-right">التاريخ</th>
                    <th className="p-3 text-xs font-black text-right">المبلغ</th>
                    <th className="p-3 text-xs font-black text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerDetailResult?.orders?.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-black text-right">{order.orderNumber}</td>
                      <td className="p-3 text-[10px] text-gray-500 text-right">{formatDate(order.date)}</td>
                      <td className="p-3 text-sm font-black text-right">{order.totalAmount.toLocaleString()} ج.م</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => fetchOrderDetails(order)}
                          className="p-1 inline-flex items-center justify-center bg-gray-100 hover:bg-black hover:text-white rounded-lg transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!customerDetailResult?.orders || customerDetailResult.orders.length === 0) && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400 text-xs font-bold">لا توجد طلبات سابقة</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-black text-lg mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-gray-400" />
              سجل التحصيلات المالية
            </h4>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-xs font-black text-right">التاريخ</th>
                    <th className="p-3 text-xs font-black text-right">المبلغ</th>
                    <th className="p-3 text-xs font-black text-right">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerDetailResult?.collections?.map((col: any) => (
                    <tr key={col.id} className="hover:bg-gray-50">
                      <td className="p-3 text-[10px] text-gray-500 text-right">{formatDate(col.date)}</td>
                      <td className="p-3 text-sm font-black text-right">{col.amount.toLocaleString()} ج.م</td>
                      <td className="p-3 text-right">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold",
                          col.status === 'confirmed' ? "bg-green-100 text-green-600" : 
                          col.status === 'rejected' ? "bg-red-100 text-red-600" :
                          "bg-orange-100 text-orange-600"
                        )}>
                          {col.status === 'confirmed' ? 'تم التحصيل' : col.status === 'rejected' ? 'مرفوض' : 'معلق'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!customerDetailResult?.collections || customerDetailResult.collections.length === 0) && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-400 text-xs font-bold">لا يوجد سجل تحصيلات</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        open={isOrderDetailsModalOpen}
        onClose={() => setOrderDetailsModalOpen(false)}
        title="تفاصيل الطلبات"
        subtitle={selectedOrderDetails?.orderNumber}
        titleIcon={<FileText className="w-5 h-5" />}
        size="2xl"
        footer={
          <button
            onClick={() => setOrderDetailsModalOpen(false)}
            className="w-full bg-black text-white py-4 rounded-2xl font-black shadow-lg hover:opacity-90 transition-opacity"
          >
            إغلاق النافذة
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-400 mb-1">التاريخ</p>
            <p className="font-black text-sm">{selectedOrderDetails?.date ? formatDate(selectedOrderDetails.date) : ''}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-400 mb-1">إجمالي المبلغ</p>
            <p className="font-black text-sm text-green-600">{selectedOrderDetails?.totalAmount?.toLocaleString()} ج.م</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-black text-black">الأصناف المشتراة:</h4>
          <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {selectedOrderDetails?.items?.map((orderItem: any, idx: number) => {
              const item = allItems?.find(i => i.id === orderItem.itemId);
              return (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-[10px] font-black text-gray-500">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-black">{item?.name || 'صنف محذوف'}</p>
                      <p className="text-[10px] text-gray-400 font-bold">السعر: {orderItem.price?.toLocaleString()} ج.م</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="font-black text-sm">{orderItem.quantity} وحدة</span>
                    <p className="text-[10px] font-bold text-gray-400">الإجمالي: {(orderItem.quantity * (orderItem.price || 0)).toLocaleString()} ج.م</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}
