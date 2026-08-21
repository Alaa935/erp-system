import React, { useState, useMemo, useEffect } from 'react';
import { usePurchaseOrders, useCreatePurchaseOrder } from '../hooks/usePurchaseOrders';
import { useSuppliers } from '../hooks/useSuppliers';
import { useInventory, useCreateInventoryItem } from '../hooks/useInventory';
import { useTaxConfigs } from '../hooks/useTaxConfigs';
import type { PurchaseOrder, Item, Supplier, TaxConfig } from '../types';
import { 
  Plus, 
  Search, 
  FileText, 
  XCircle, 
  Save, 
  ShoppingCart,
  Trash2,
  Eye,
  DollarSign,
  Printer,
  TrendingUp,
  Package,
  Users,
  Calendar,
  CreditCard,
  Hash
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { calculateTax } from '../utils/calculateTax';
import { toast } from 'sonner';
import { WorkspaceLayout, EnterpriseTable, type Column, Modal, Form, FormInput, FormSelect, FormTextarea, FormSection, FormActions } from '../components/design-system';
import { TableActionMenu, type ActionItem } from '../components/ui/TableActionMenu';

interface Props {
  onNavigate?: (page: string) => void;
}

const USE_PAGE_MODE = import.meta.env.VITE_USE_SUPPLIER_INVOICE_PAGE === 'true';

export default function SupplierInvoices({ onNavigate }: Props) {
  console.log('[SupplierInvoices] mounted');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    supplierId: 0,
    invoiceNumber: '',
    taxId: undefined as number | undefined,
    paymentStatus: 'unpaid' as 'paid' | 'partial' | 'unpaid',
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'check' | 'credit',
    paidAmount: 0,
    notes: '',
    items: [] as { itemId: number; quantity: number; price: number }[]
  });

  const [quickItem, setQuickItem] = useState({
    name: '',
    sku: `SKU-${Math.floor(10000 + Math.random() * 90000)}`,
    purchasePrice: 0,
    sellingPrice: 0,
    category: 'مواد غذائية'
  });

  const { data: invoicesRes } = usePurchaseOrders();
  const invoices = (invoicesRes as any)?.orders;
  const { data: suppliersRes } = useSuppliers();
  const suppliers = (suppliersRes as any)?.items;
  const { data: itemsRes } = useInventory({ pageSize: 1000 } as any);
  const availableItems = (itemsRes as any)?.items;
  const { data: taxesRes } = useTaxConfigs({ isActive: 'true' } as any);
  const taxes = (taxesRes as any)?.items;

  const createItem = useCreateInventoryItem();
  const createPurchaseOrder = useCreatePurchaseOrder();

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

  const handleQuickAddItem = async () => {
    if (!quickItem.name || !quickItem.sku) return;
    
    const response = await createItem.mutateAsync({
      ...quickItem,
      quantity: 0,
      minQuantity: 10,
      location: 'مستلم حديثاً',
      createdAt: Date.now(),
      updatedAt: Date.now()
    } as Partial<Item>);

    const newItem = response as any;
    addItemToInvoice(newItem.id);
    setIsAddingNewItem(false);
    setQuickItem({
      name: '',
      sku: `SKU-${Math.floor(10000 + Math.random() * 90000)}`,
      purchasePrice: 0,
      sellingPrice: 0,
      category: 'مواد غذائية'
    });
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newInvoice.supplierId === 0 || newInvoice.items.length === 0) {
      toast.error('يرجى اختيار المورد وإضافة أصناف للفاتورة');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const subtotal = newInvoice.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      let taxAmount = 0;
      let totalAmount = subtotal;

      if (newInvoice.taxId) {
        const selectedTax = taxes?.find((t: TaxConfig) => t.id === newInvoice.taxId);
        if (selectedTax) {
          const calc = calculateTax({ subtotal, taxRate: selectedTax.rate, isInclusive: selectedTax.isInclusive });
          taxAmount = calc.taxAmount;
          totalAmount = calc.total;
        }
      }

      const orderNumber = `INV-SUP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await createPurchaseOrder.mutateAsync({
        orderNumber,
        supplierId: newInvoice.supplierId,
        invoiceNumber: newInvoice.invoiceNumber,
        items: newInvoice.items,
        subtotal,
        taxId: newInvoice.taxId,
        taxAmount,
        totalAmount,
        status: 'received',
        paymentStatus: newInvoice.paymentStatus,
        paymentMethod: newInvoice.paymentMethod,
        paidAmount: newInvoice.paymentStatus === 'paid' ? totalAmount : newInvoice.paidAmount,
        notes: newInvoice.notes,
        date: Date.now()
      } as Partial<PurchaseOrder>);

      toast.success('تمت إضافة فاتورة المورد وتحديث المخزون بنجاح');
      setModalOpen(false);
      setNewInvoice({ 
        supplierId: 0, 
        invoiceNumber: '', 
        taxId: undefined, 
        paymentStatus: 'unpaid', 
        paymentMethod: 'cash', 
        paidAmount: 0, 
        notes: '', 
        items: [] 
      });
    } catch (error) {
      console.error(error);
      toast.error('فشل حفظ الفاتورة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItemToInvoice = (itemId: number) => {
    const item = availableItems?.find((i: Item) => i.id === itemId);
    if (!item) return;
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { itemId, quantity: 1, price: item.purchasePrice || 0 }]
    });
  };

  const createModalFooter = (
    <FormActions
      primaryLabel="حفظ الفاتورة وتحديث المخزون"
      secondaryLabel="إلغاء الأمر"
      onSecondary={() => setModalOpen(false)}
      loading={isSubmitting}
      primaryClassName="flex items-center justify-center gap-3"
      secondaryClassName="border-2 border-[#E0E3E5]"
    />
  );

  const createFormContent = (
    <Form onSubmit={handleCreateInvoice} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSection title="بيانات الفاتورة الأساسية" icon={<FileText className="w-4 h-4" />}>
          <FormSelect
            label="المورد"
            required
            value={newInvoice.supplierId}
            onChange={(e) => setNewInvoice({...newInvoice, supplierId: parseInt(e.target.value)})}
            options={[
              { value: 0, label: 'اختر المورد...' },
              ...(suppliers?.map((s: Supplier) => ({ value: s.id!, label: s.name })) || [])
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="رقم فاتورة المورد (اختياري)"
              placeholder="رقم الفاتورة الورقية"
              value={newInvoice.invoiceNumber}
              onChange={(e) => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})}
              icon={<Hash className="w-4 h-4 text-gray-400" />}
            />
            <FormInput
              label="التاريخ"
              disabled
              value={formatDate(Date.now())}
              onChange={() => {}}
              icon={<Calendar className="w-4 h-4 text-gray-400" />}
            />
          </div>
        </FormSection>

        <FormSection title="نظام الدفع" icon={<CreditCard className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="طريقة الدفع"
              value={newInvoice.paymentMethod}
              onChange={(e) => setNewInvoice({...newInvoice, paymentMethod: e.target.value as any})}
              options={[
                { value: 'cash', label: 'نقدي' },
                { value: 'transfer', label: 'تحويل بنكي' },
                { value: 'check', label: 'شيك' },
                { value: 'credit', label: 'آجل / مديونية' },
              ]}
            />
            <FormSelect
              label="حالة الدفع"
              value={newInvoice.paymentStatus}
              onChange={(e) => setNewInvoice({...newInvoice, paymentStatus: e.target.value as any})}
              options={[
                { value: 'paid', label: 'مدفوعة بالكامل' },
                { value: 'partial', label: 'مدفوع جزء' },
                { value: 'unpaid', label: 'آجل (غير مدفوعة)' },
              ]}
            />
          </div>
          {newInvoice.paymentStatus === 'partial' && (
            <FormInput
              label="المبلغ المدفوع"
              type="number"
              min="0"
              placeholder="0.00"
              value={newInvoice.paidAmount || ""}
              onChange={(e) => setNewInvoice({...newInvoice, paidAmount: parseFloat(e.target.value) || 0})}
            />
          )}
        </FormSection>
      </div>

      <FormSection title="قائمة الأصناف" icon={<Package className="w-4 h-4 text-white" />}>
        <div className="flex justify-between items-center bg-black p-4 rounded-2xl">
          <h4 className="font-bold text-white pr-3">قائمة الأصناف</h4>
          <div className="flex gap-2">
            <FormSelect
              value="0"
              onChange={(e) => e.target.value !== "0" && addItemToInvoice(parseInt(e.target.value))}
              options={[
                { value: '0', label: 'اضغط للاختيار من المخزن...' },
                ...(availableItems?.map((i: Item) => ({ value: i.id!, label: `${i.name} (SKU: ${i.sku})` })) || [])
              ]}
              className="[&_select]:bg-white [&_select]:text-black [&_select]:rounded-xl [&_select]:text-xs"
            />
            <button
              type="button"
              onClick={() => setIsAddingNewItem(!isAddingNewItem)}
              className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              صنف جديد غير مسجل
            </button>
          </div>
        </div>

        {isAddingNewItem && (
          <div className="bg-green-50 p-6 rounded-2xl border-2 border-dashed border-green-200">
            <h4 className="text-sm font-bold text-green-800 mb-4">بيانات الصنف الجديد وسيتم تسجيله تلقائياً</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormInput
                placeholder="اسم الصنف"
                value={quickItem.name}
                onChange={(e) => setQuickItem({...quickItem, name: e.target.value})}
                className="[&_input]:bg-white [&_input]:border [&_input]:border-green-200 [&_input]:focus:ring-green-500"
              />
              <FormInput
                placeholder="رقم SKU"
                value={quickItem.sku}
                onChange={(e) => setQuickItem({...quickItem, sku: e.target.value})}
                className="[&_input]:bg-white [&_input]:border [&_input]:border-green-200 [&_input]:focus:ring-green-500"
              />
              <FormInput
                type="number"
                placeholder="سعر الشراء"
                value={quickItem.purchasePrice || ""}
                onChange={(e) => setQuickItem({...quickItem, purchasePrice: parseFloat(e.target.value) || 0})}
                className="[&_input]:bg-white [&_input]:border [&_input]:border-green-200 [&_input]:focus:ring-green-500"
              />
              <button
                type="button"
                onClick={handleQuickAddItem}
                className="bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
              >
                حفظ وإضافة للجدول
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3 min-h-[150px] max-h-[300px] overflow-y-auto pr-2">
          {newInvoice.items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 bg-gray-50 border-2 border-dashed border-gray-100 rounded-3xl opacity-50">
              <Package className="w-10 h-10 mb-2" />
              <p className="font-bold text-sm">البطاقة فارغة، ابدأ بإضافة المنتجات</p>
            </div>
          )}
          {newInvoice.items.map((orderItem, idx) => {
            const item = availableItems?.find((i: Item) => i.id === orderItem.itemId);
            return (
              <div key={idx} className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-[#E0E3E5] hover:border-black transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-black truncate">{item?.name}</p>
                  <p className="text-[10px] font-bold text-gray-400">SKU: {item?.sku}</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400">الكمية</label>
                    <FormInput
                      type="number"
                      value={orderItem.quantity || ''}
                      onChange={(e) => {
                        const items = [...newInvoice.items];
                        const currentItem = items[idx];
                        if (currentItem) {
                          currentItem.quantity = parseInt(e.target.value) || 0;
                          setNewInvoice({...newInvoice, items});
                        }
                      }}
                      className="[&_input]:w-24 [&_input]:text-center [&_input]:text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400">سعر الشراء (للقطعة)</label>
                    <FormInput
                      type="number"
                      value={orderItem.price || ''}
                      onChange={(e) => {
                        const items = [...newInvoice.items];
                        const currentItem = items[idx];
                        if (currentItem) {
                          currentItem.price = parseFloat(e.target.value) || 0;
                          setNewInvoice({...newInvoice, items});
                        }
                      }}
                      className="[&_input]:w-32 [&_input]:text-center [&_input]:text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1 min-w-[100px] text-left">
                    <label className="text-[10px] font-bold text-gray-400">الإجمالي</label>
                    <p className="text-sm font-bold text-black">{formatCurrency(orderItem.price * orderItem.quantity)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewInvoice({...newInvoice, items: newInvoice.items.filter((_, i) => i !== idx)})}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </FormSection>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-[#E0E3E5]">
        <div className="md:col-span-2 space-y-4">
          <FormTextarea
            label="ملاحظات الفاتورة"
            placeholder="أدخل أي ملاحظات إضافية هنا..."
            value={newInvoice.notes}
            onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
            rows={4}
          />
        </div>
        <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center text-sm font-bold text-gray-500">
            <span>المطالبة الفرعية:</span>
            <span className="font-bold text-black">{formatCurrency(newInvoice.items.reduce((acc, i) => acc + (i.price * i.quantity), 0))}</span>
          </div>
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-400">الضريبة</label>
            <FormSelect
              value={newInvoice.taxId || ''}
              onChange={(e) => setNewInvoice({...newInvoice, taxId: e.target.value ? Number(e.target.value) : undefined})}
              options={[
                { value: '', label: 'لا توجد ضريبة' },
                ...(taxes?.map((t: TaxConfig) => ({ value: t.id!, label: `${t.name} (${t.rate}%)` })) || [])
              ]}
              className="[&_select]:bg-white [&_select]:border [&_select]:rounded-lg [&_select]:px-2 [&_select]:py-1 [&_select]:text-[11px]"
            />
          </div>

          {newInvoice.taxId && (
            <div className="flex justify-between items-center text-xs font-bold text-blue-600">
              <span>قيمة الضريبة:</span>
              <span className="font-bold">
                {(() => {
                  const tax = taxes?.find((t: TaxConfig) => t.id === newInvoice.taxId);
                  const sub = newInvoice.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                  if (!tax) return formatCurrency(0);
                  const val = tax.isInclusive ? (sub - (sub / (1 + tax.rate / 100))) : (sub * (tax.rate / 100));
                  return formatCurrency(val);
                })()}
              </span>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">الإجمالي المستحق</p>
            <p className="text-3xl font-bold text-black">
              {(() => {
                const sub = newInvoice.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                const tax = taxes?.find((t: TaxConfig) => t.id === newInvoice.taxId);
                const total = tax ? (tax.isInclusive ? sub : sub + (sub * (tax.rate / 100))) : sub;
                return formatCurrency(total);
              })()}
            </p>
          </div>
        </div>
      </div>

      {createModalFooter}
    </Form>
  );

  return (
    <WorkspaceLayout maxWidth="xl">
      <WorkspaceLayout.Header
        icon={FileText}
        title="فواتير الموردين"
        subtitle="إدارة المشتريات وتحديث المخزون مباشرة"
        actions={
          <>
          <button 
            onClick={() => USE_PAGE_MODE ? onNavigate?.('supplier-invoice-create') : setModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة فاتورة مورد
          </button>

          </>
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
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="تسجيل فاتورة مورد"
        subtitle="إضافة بضاعة للمخزون وتسجيل القيد المالي"
        size="5xl"
        titleIcon={<ShoppingCart className="text-white w-6 h-6" />}
      >
        {createFormContent}
      </Modal>

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
