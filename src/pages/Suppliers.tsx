import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Supplier } from '../types';
import { Search, Plus, Phone, Mail, MapPin, MoreVertical, Edit2, Trash2, X, Save, Users, Truck, ShoppingCart, Eye, ArrowRightLeft, FileText, Send, Printer } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/design-system';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '../hooks/useSuppliers';
import { useInventory } from '../hooks/useInventory';
import { usePurchaseOrders, useCreatePurchaseOrder, useUpdatePurchaseOrder, useDeletePurchaseOrder } from '../hooks/usePurchaseOrders';
import type { Item } from '../types';

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteReasonModalOpen, setDeleteReasonModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState<Supplier | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [isOrderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: ''
  });

  const suppliersQuery = useSuppliers({ search: debouncedSearch || undefined });
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const suppliers = suppliersQuery.data?.items;

  const createPurchaseOrder = useCreatePurchaseOrder();
  const updatePurchaseOrder = useUpdatePurchaseOrder();
  const deletePurchaseOrder = useDeletePurchaseOrder();

  const { data: itemsData } = useInventory();
  const allItems = itemsData?.items || [];

  const { data: purchaseOrdersData } = usePurchaseOrders(
    selectedSupplierForDetail?.id ? { supplierId: selectedSupplierForDetail.id, pageSize: 1000 } as any : undefined
  );
  const purchaseHistory = (purchaseOrdersData as any)?.orders || null;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [newOrder, setNewOrder] = useState({
    supplierId: 0,
    items: [] as { itemId: any; quantity: number; price: number }[],
    newItems: [] as Partial<Item>[],
    taxRate: 15,
    isTaxInclusive: true
  });

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrder.items.length === 0) {
      toast.error('يرجى إضافة أصناف للطلب');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const subtotal = newOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      let totalAmount = subtotal;
      let taxAmount = 0;

      if (newOrder.isTaxInclusive) {
        taxAmount = subtotal - (subtotal / (1 + newOrder.taxRate / 100));
      } else {
        taxAmount = subtotal * (newOrder.taxRate / 100);
        totalAmount = subtotal + taxAmount;
      }

      const orderNumber = editingInvoiceId ? `INV-SUP-EDT-${Date.now().toString().slice(-4)}` : `INV-SUP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const invoiceData = {
        orderNumber,
        supplierId: newOrder.supplierId,
        items: newOrder.items,
        totalAmount: Number(totalAmount.toFixed(2)),
        subtotal: Number(subtotal.toFixed(2)),
        taxAmount: Number(taxAmount.toFixed(2)),
        status: 'received' as const,
        paymentStatus: 'unpaid' as const,
        paymentMethod: 'cash' as const,
        paidAmount: 0,
        date: Date.now()
      };

      if (editingInvoiceId) {
        await updatePurchaseOrder.mutateAsync({ id: editingInvoiceId, data: invoiceData as any });
        toast.success('تم تحديث فاتورة التوريد بنجاح');
      } else {
        await createPurchaseOrder.mutateAsync(invoiceData as any);
        toast.success('تم تسجيل فاتورة التوريد وتحديث المخزون بنجاح');
      }

      setOrderModalOpen(false);
      setEditingInvoiceId(null);
      setNewOrder({ supplierId: 0, items: [], newItems: [], taxRate: 15, isTaxInclusive: true });
    } catch (error) {
      console.error(error);
      toast.error('فشل معالجة الفاتورة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditInvoice = (order: any) => {
    setEditingInvoiceId(order.id);
    setNewOrder({
      supplierId: order.supplierId,
      items: order.items,
      newItems: [],
      taxRate: 15,
      isTaxInclusive: true
    });
    setOrderModalOpen(true);
  };

  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<any>(null);

  const handleDeleteInvoice = async (order: any) => {
    setDeleteConfirmOrder(order);
  };

  const executeDeleteInvoice = async () => {
    if (!deleteConfirmOrder) return;
    try {
      setIsSubmitting(true);
      await deletePurchaseOrder.mutateAsync({ id: deleteConfirmOrder.id, reason: 'Manual deletion from supplier page' });
      toast.success('تم حذف الفاتورة وإلغاء تأثيرها على المخزون');
    } catch (error) {
      console.error(error);
      toast.error('فشل حذف الفاتورة');
    } finally {
      setIsSubmitting(false);
      setDeleteConfirmOrder(null);
    }
  };

  const addItemToOrder = (itemId: number | string) => {
    if (itemId === 'new') {
      const tempId = `temp-${Date.now()}`;
      setNewOrder({
        ...newOrder,
        items: [...newOrder.items, { itemId: tempId, quantity: 1, price: 0 }],
        newItems: [...newOrder.newItems, { id: tempId as any, name: 'منتج جديد', sku: '', category: 'عام', purchasePrice: 0, sellingPrice: 0, minQuantity: 5 }]
      });
      return;
    }

    const item = allItems?.find(i => i.id === itemId);
    if (!item) return;
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { itemId, quantity: 1, price: item.purchasePrice || 0 }]
    });
  };

  const fetchOrderDetails = (order: any) => {
    setSelectedOrderDetails(order);
    setOrderDetailsModalOpen(true);
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) {
      toast.error('يرجى إدخال اسم المورد');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingSupplier) {
        await updateSupplier.mutateAsync({ id: editingSupplier.id!, data: newSupplier });
        toast.success('تم تحديث بيانات المورد بنجاح');
      } else {
        await createSupplier.mutateAsync(newSupplier);
        toast.success('تمت إضافة المورد بنجاح');
      }

      setModalOpen(false);
      setEditingSupplier(null);
      setNewSupplier({
        name: '',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        taxNumber: ''
      });
    } catch (error) {
      console.error(error);
      toast.error('فشل حفظ بيانات المورد');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setNewSupplier({
      name: supplier.name,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      taxNumber: supplier.taxNumber
    });
    setModalOpen(true);
  };

  const handleDeleteSupplier = async () => {
    if (supplierToDelete === null || !deleteReason) {
      toast.error('يرجى اختيار سبب الحذف');
      return;
    }
    try {
      setIsSubmitting(true);
      await deleteSupplier.mutateAsync({ id: supplierToDelete, reason: deleteReason });

      toast.success('تم حذف المورد بنجاح');
      setDeleteReasonModalOpen(false);
      setSupplierToDelete(null);
      setDeleteReason('');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('فشل حذف المورد');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: number) => {
    setSupplierToDelete(id);
    setDeleteReasonModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-1">الموردين والعملاء</h2>
          <p className="text-[#44474D] text-sm">إدارة الكيانات التجارية والتعاقدات</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto bg-black text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          إضافة مورد
        </button>
      </div>

      <div className="card-premium p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="البحث عن مورد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium w-full py-2 pr-10 pl-4 text-sm"
          />
        </div>
      </div>

      {suppliersQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E0E3E5] p-6 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gray-200 rounded-xl w-12 h-12" />
                <div className="w-16 h-4 bg-gray-200 rounded" />
              </div>
              <div className="space-y-3">
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-20 h-3 bg-gray-200 rounded" />
                <div className="w-32 h-3 bg-gray-200 rounded" />
                <div className="w-28 h-3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : suppliersQuery.isError ? (
        <div className="col-span-full text-center py-12">
          <p className="text-red-500 font-bold mb-2">فشل تحميل بيانات الموردين</p>
          <button onClick={() => suppliersQuery.refetch()} className="text-sm text-blue-600 underline cursor-pointer">إعادة المحاولة</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers?.map((supplier) => (
            <div 
              key={supplier.id} 
              onClick={() => setSelectedSupplierForDetail(supplier)}
              className="bg-white rounded-xl border border-[#E0E3E5] p-6 shadow-sm hover:border-black transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-[#B9C7E4] p-3 rounded-xl text-black">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="flex gap-2 min-h-[36px] md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEdit(supplier); }}
                    className="p-2 hover:bg-[#ECEEF0] rounded-lg"
                  >
                    <Edit2 className="w-4 h-4 text-[#44474D]" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); supplier.id !== undefined && confirmDelete(supplier.id); }}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-black mb-1">{supplier.name}</h3>
              <p className="text-sm text-[#44474D] font-medium mb-4">{supplier.contactName}</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-[#44474D]">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#44474D]">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>{supplier.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#44474D]">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="line-clamp-1">{supplier.address}</span>
                </div>
              </div>
            </div>
          ))}
          {(!suppliers || suppliers.length === 0) && (
            <div className="col-span-full">
              <EmptyState icon={Users} title="لا يوجد موردين مسجلين" description="أضف موردك الأول باستخدام الزر أعلاه" />
            </div>
          )}
        </div>
      )}

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#E0E3E5] flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                    <Truck className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black">{editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</h3>
                    <p className="text-[12px] text-[#44474D]">بيانات التعاقد والتواصل</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setModalOpen(false);
                    setEditingSupplier(null);
                  }}
                  className="p-2 hover:bg-[#ECEEF0] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[#44474D]" />
                </button>
              </div>

              <form onSubmit={handleAddSupplier} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#44474D]">اسم الشركة/المورد</label>
                    <input 
                      required
                      type="text" 
                      value={newSupplier.name ?? ''}
                      onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                      className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#44474D]">اسم المسؤول</label>
                    <input 
                      required
                      type="text" 
                      value={newSupplier.contactName ?? ''}
                      onChange={(e) => setNewSupplier({...newSupplier, contactName: e.target.value})}
                      className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#44474D]">رقم الهاتف</label>
                    <input 
                      required
                      type="text" 
                      value={newSupplier.phone ?? ''}
                      onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                      className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black transition-all text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#44474D]">البريد الإلكتروني</label>
                    <input 
                      required
                      type="email" 
                      value={newSupplier.email ?? ''}
                      onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                      className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black transition-all text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#44474D]">الرقم الضريبي</label>
                    <input 
                      type="text" 
                      value={newSupplier.taxNumber ?? ''}
                      onChange={(e) => setNewSupplier({...newSupplier, taxNumber: e.target.value})}
                      className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#44474D]">العنوان</label>
                    <input 
                      type="text" 
                      value={newSupplier.address ?? ''}
                      onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                      className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-[#E0E3E5]">
                  <button 
                    type="submit"
                    className="flex-1 bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <Save className="w-5 h-5" />
                    حفظ المورد
                  </button>
                  <button 
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 bg-white border border-[#E0E3E5] text-[#44474D] py-3 rounded-xl font-bold hover:bg-[#F2F4F6] transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteReasonModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 modal-overlay text-right" dir="rtl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-red-900">حذف مورد نهائياً</h3>
                  <p className="text-xs font-bold text-red-600">سيتم إزالة كافة سجلات هذا المورد من النظام</p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-black text-black">ما سبب حذف هذا المورد؟</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['انتهاء التعاقد', 'توقف الشركة عن التوريد', 'سوء الخدمة أو الجودة', 'خطأ في البيانات', 'أخرى'].map((reason) => (
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
                    onClick={handleDeleteSupplier}
                    disabled={isSubmitting}
                    className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    تأكيد الحذف
                  </button>
                  <button 
                    onClick={() => {
                      setDeleteReasonModalOpen(false);
                      setSupplierToDelete(null);
                      setDeleteReason('');
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black hover:bg-gray-200 transition-colors"
                  >
                    تراجع
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Supplier Detail Modal */}
      <AnimatePresence>
        {selectedSupplierForDetail && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 modal-overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-[#E0E3E5] flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#B9C7E4] text-black rounded-2xl flex items-center justify-center text-2xl font-black">
                    <Truck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-black">{selectedSupplierForDetail.name}</h3>
                    <p className="text-sm text-[#44474D]">المسؤول: {selectedSupplierForDetail.contactName}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSupplierForDetail(null)} className="p-2 hover:bg-gray-200 rounded-full">
                   <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="glass-card p-4">
                    <p className="text-xs font-bold text-gray-500 mb-1">إجمالي طلبات التوريد</p>
                    <h4 className="stat-value">
                      {purchaseHistory?.reduce((sum: number, o: any) => sum + o.totalAmount, 0).toLocaleString()} ج.م
                    </h4>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-xs font-bold text-gray-500 mb-1">عدد الفواتير</p>
                    <h4 className="stat-value">{purchaseHistory?.length || 0} فاتورة</h4>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-xs font-bold text-gray-500 mb-1">الرقم الضريبي</p>
                    <h4 className="stat-value">{selectedSupplierForDetail.taxNumber || 'غير متوفر'}</h4>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-gray-400" />
                    سجل فواتير المشتريات
                  </h4>
                  <button 
                    onClick={() => {
                      setNewOrder({ supplierId: selectedSupplierForDetail.id!, items: [], newItems: [], taxRate: 15, isTaxInclusive: true });
                      setOrderModalOpen(true);
                    }}
                    className="bg-black text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:opacity-80 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    تسجيل فاتورة توريد جديدة
                  </button>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 text-xs font-black text-right">رقم الفاتورة</th>
                        <th className="p-3 text-xs font-black text-right">التاريخ</th>
                        <th className="p-3 text-xs font-black text-right">الحالة</th>
                        <th className="p-3 text-xs font-black text-right">المبلغ</th>
                        <th className="p-3 text-xs font-black text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {purchaseHistory?.map((order: any) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="p-3 text-sm font-bold text-right">{order.orderNumber}</td>
                          <td className="p-3 text-xs text-gray-500 text-right">{formatDate(order.date)}</td>
                          <td className="p-3 text-right">
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-bold",
                              order.status === 'received' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                            )}>
                              {order.status === 'received' ? 'تم الاستلام' : 'قيد الانتظار'}
                            </span>
                          </td>
                          <td className="p-3 text-sm font-black text-right">{order.totalAmount.toLocaleString()} ج.م</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2 justify-center">
                              <button 
                                onClick={() => fetchOrderDetails(order)}
                                className="p-1 px-2 bg-gray-100 hover:bg-black hover:text-white rounded-lg text-[10px] font-black transition-all flex items-center gap-1"
                                title="عرض"
                                type="button"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleEditInvoice(order)}
                                className="p-1 px-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-black transition-all flex items-center gap-1"
                                title="تعديل"
                                type="button"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleDeleteInvoice(order)}
                                className="p-1 px-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-[10px] font-black transition-all flex items-center gap-1"
                                title="حذف"
                                type="button"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(!purchaseHistory || purchaseHistory.length === 0) && (
                        <tr>
                          <td colSpan={5} className="p-6">
                            <EmptyState icon={ShoppingCart} title="لا توجد سجلات مشتريات" description="لم يتم تسجيل أي فواتير توريد لهذا المورد بعد" />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {isOrderDetailsModalOpen && selectedOrderDetails && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 modal-overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">تفاصيل الفاتورة</h3>
                    <p className="text-xs text-gray-500 font-bold">{selectedOrderDetails.orderNumber}</p>
                  </div>
                </div>
                <button onClick={() => setOrderDetailsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 print-container">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 mb-1">المجموع الفرعي</p>
                    <p className="font-black text-sm">{selectedOrderDetails.subtotal?.toLocaleString() || (selectedOrderDetails.totalAmount - (selectedOrderDetails.taxAmount || 0)).toLocaleString()} ج.م</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 mb-1">الضريبة</p>
                    <p className="font-black text-sm text-blue-600">{(selectedOrderDetails.taxAmount || 0).toLocaleString()} ج.م</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 mb-1">الإجمالي</p>
                    <p className="font-black text-sm text-green-600">{selectedOrderDetails.totalAmount.toLocaleString()} ج.م</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-black">الأصناف المشمولة:</h4>
                  <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                    {selectedOrderDetails.items.map((orderItem: any, idx: number) => {
                      const item = allItems?.find(i => i.id === orderItem.itemId);
                      return (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-[10px] font-black text-gray-500">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-black">{item?.name || 'صنف محذوف'}</p>
                              <p className="text-[10px] text-gray-400 font-bold">السعر: {orderItem.price.toLocaleString()} ج.م</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <span className="font-black text-sm">{orderItem.quantity} وحدة</span>
                            <p className="text-[10px] font-bold text-gray-400">الإجمالي: {(orderItem.quantity * orderItem.price).toLocaleString()} ج.م</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={() => setOrderDetailsModalOpen(false)}
                    className="flex-1 bg-black text-white py-4 rounded-2xl font-black shadow-lg hover:opacity-90 transition-opacity"
                  >
                    إغلاق النافذة
                  </button>
                  <button 
                    onClick={() => {
                      const text = `*تفاصيل أمر الشراء*
رقم الطلب: ${selectedOrderDetails.orderNumber}
المورد: ${selectedSupplierForDetail?.name}
التاريخ: ${formatDate(selectedOrderDetails.date)}
إجمالي المبلغ: ${selectedOrderDetails.totalAmount.toLocaleString()} ج.م`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="px-6 bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 transition-colors flex items-center gap-2 shadow-lg shadow-green-100"
                  >
                    <Send className="w-4 h-4" />
                    إرسال
                  </button>
                  <button 
                    onClick={() => {
                      const originalTitle = document.title;
                      document.title = `Order-${selectedOrderDetails.orderNumber}`;
                      window.print();
                      document.title = originalTitle;
                    }}
                    className="px-6 bg-white border border-[#E0E3E5] text-[#44474D] font-black rounded-2xl hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    طباعة
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Create Order Modal */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 modal-overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">تسجيل فاتورة توريد</h3>
                    <p className="text-xs text-gray-500 font-bold">المورد: {selectedSupplierForDetail?.name}</p>
                  </div>
                </div>
                <button onClick={() => setOrderModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-black">إضافة أصناف للفاتورة:</label>
                    <select 
                      onChange={(e) => e.target.value !== "0" && addItemToOrder(e.target.value.includes('temp') ? e.target.value : parseInt(e.target.value))}
                      className="bg-black text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:opacity-80 transition-all no-scrollbar"
                    >
                      <option value="0">اختر أو أضف صنف...</option>
                      <option value="new" className="bg-green-600">+ إضافة صنف جديد تماماً</option>
                      {allItems?.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
                      ))}
                    </select>
                  </div>
 
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400">نسبة الضريبة (%)</label>
                      <input 
                        type="number"
                        value={newOrder.taxRate}
                        onChange={(e) => setNewOrder({...newOrder, taxRate: parseFloat(e.target.value) || 0})}
                        className="w-full bg-white border-none rounded-lg py-1 px-2 text-sm font-black focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400">نوع السعر</label>
                      <select 
                        value={newOrder.isTaxInclusive ? 'inclusive' : 'exclusive'}
                        onChange={(e) => setNewOrder({...newOrder, isTaxInclusive: e.target.value === 'inclusive'})}
                        className="w-full bg-white border-none rounded-lg py-1 px-2 text-sm font-black focus:ring-1 focus:ring-black"
                      >
                        <option value="inclusive">شامل الضريبة</option>
                        <option value="exclusive">غير شامل الضريبة</option>
                      </select>
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2 border border-gray-100 rounded-2xl p-4 bg-gray-50/50 no-scrollbar">
                    {newOrder.items.length === 0 && (
                      <p className="text-center text-gray-400 py-8 text-sm">لم يتم إضافة أصناف بعد</p>
                    )}
                    {newOrder.items.map((orderItem, idx) => {
                      const isNewItem = typeof orderItem.itemId === 'string' && orderItem.itemId.startsWith('temp');
                      const item = isNewItem 
                        ? newOrder.newItems.find(ni => ni.id === orderItem.itemId)
                        : allItems?.find(i => i.id === orderItem.itemId);
                      
                      return (
                        <div key={idx} className="flex flex-col gap-2 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              {isNewItem ? (
                                <input 
                                  type="text"
                                  value={item?.name}
                                  onChange={(e) => {
                                    const newItems = [...newOrder.newItems];
                                    const niIdx = newItems.findIndex(ni => ni.id === orderItem.itemId);
                                    newItems[niIdx].name = e.target.value;
                                    setNewOrder({...newOrder, newItems});
                                  }}
                                  placeholder="اسم المنتج الجديد"
                                  className="w-full bg-gray-50 border-none rounded-lg py-1 px-2 text-sm font-black focus:ring-1 focus:ring-black"
                                />
                              ) : (
                                <p className="font-black text-sm">{item?.name}</p>
                              )}
                              <div className="flex gap-2 mt-1">
                                <span className="text-[10px] text-gray-400 font-bold">السعر:</span>
                                <input 
                                  type="number"
                                  value={orderItem.price}
                                  onChange={(e) => {
                                    const items = [...newOrder.items];
                                    items[idx].price = parseFloat(e.target.value) || 0;
                                    setNewOrder({...newOrder, items});
                                  }}
                                  className="w-20 bg-gray-50 border-none rounded-md px-1 text-[10px] font-black focus:ring-1 focus:ring-black"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button 
                                type="button"
                                onClick={() => {
                                  const items = [...newOrder.items];
                                  if (items[idx].quantity > 1) {
                                    items[idx].quantity -= 1;
                                    setNewOrder({...newOrder, items});
                                  }
                                }}
                                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-all font-black"
                              >-</button>
                              <span className="font-black min-w-[20px] text-center">{orderItem.quantity}</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  const items = [...newOrder.items];
                                  items[idx].quantity += 1;
                                  setNewOrder({...newOrder, items});
                                }}
                                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-all font-black"
                              >+</button>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const newItems = newOrder.newItems.filter(ni => ni.id !== orderItem.itemId);
                                setNewOrder({
                                  ...newOrder, 
                                  items: newOrder.items.filter((_, i) => i !== idx),
                                  newItems
                                });
                              }}
                              className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {isNewItem && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <input 
                                type="text"
                                placeholder="SKU (اختياري)"
                                value={item?.sku}
                                onChange={(e) => {
                                  const newItems = [...newOrder.newItems];
                                  const niIdx = newItems.findIndex(ni => ni.id === orderItem.itemId);
                                  newItems[niIdx].sku = e.target.value;
                                  setNewOrder({...newOrder, newItems});
                                }}
                                className="bg-gray-50 border-none rounded-lg py-1 px-2 text-[10px] font-bold"
                              />
                              <input 
                                type="text"
                                placeholder="الفئة"
                                value={item?.category}
                                onChange={(e) => {
                                  const newItems = [...newOrder.newItems];
                                  const niIdx = newItems.findIndex(ni => ni.id === orderItem.itemId);
                                  newItems[niIdx].category = e.target.value;
                                  setNewOrder({...newOrder, newItems});
                                }}
                                className="bg-gray-50 border-none rounded-lg py-1 px-2 text-[10px] font-bold"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
 
                <div className="space-y-2 p-4 bg-black text-white rounded-2xl shadow-xl">
                  <div className="flex justify-between items-center text-xs opacity-70">
                    <span>المجموع الفرعي:</span>
                    <span>
                      {newOrder.items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs opacity-70">
                    <span>الضريبة ({newOrder.taxRate}%):</span>
                    <span>
                      {(newOrder.isTaxInclusive 
                        ? (newOrder.items.reduce((acc, i) => acc + (i.price * i.quantity), 0) - (newOrder.items.reduce((acc, i) => acc + (i.price * i.quantity), 0) / (1 + newOrder.taxRate / 100)))
                        : (newOrder.items.reduce((acc, i) => acc + (i.price * i.quantity), 0) * (newOrder.taxRate / 100))
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/20">
                    <span className="font-bold">إجمالي الفاتورة:</span>
                    <span className="text-xl font-black">
                      {(newOrder.isTaxInclusive 
                        ? newOrder.items.reduce((acc, i) => acc + (i.price * i.quantity), 0)
                        : (newOrder.items.reduce((acc, i) => acc + (i.price * i.quantity), 0) * (1 + newOrder.taxRate / 100))
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })} ج.م
                    </span>
                  </div>
                </div>
 
                <div className="flex gap-4">
                  <button 
                    disabled={isSubmitting || newOrder.items.length === 0}
                    type="submit"
                    className="flex-1 bg-black text-white py-4 rounded-2xl font-black shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {editingInvoiceId ? 'تحديث الفاتورة والمخزون' : 'إتمام الطلب وتحديث المخزون'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOrderModalOpen(false)}
                    className="px-8 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteConfirmOrder}
        title="حذف فاتورة توريد"
        message={deleteConfirmOrder ? `هل أنت متأكد من حذف الفاتورة رقم ${deleteConfirmOrder.orderNumber}؟ سيتم خصم الكميات من المخزون.` : ''}
        confirmLabel="تأكيد الحذف"
        variant="danger"
        onConfirm={executeDeleteInvoice}
        onCancel={() => setDeleteConfirmOrder(null)}
      />
    </div>
  );
}
