import React, { useState, useMemo } from 'react';
import { useCreatePurchaseOrder } from '../hooks/usePurchaseOrders';
import { useCreateInventoryItem, useInventory } from '../hooks/useInventory';
import { useSuppliers } from '../hooks/useSuppliers';
import { useTaxConfigs } from '../hooks/useTaxConfigs';
import type { Item, Supplier, TaxConfig, PurchaseOrder } from '../types';
import {
  Plus,
  Search,
  FileText,
  Save,
  ShoppingCart,
  Trash2,
  DollarSign,
  Package,
  Users,
  Calendar,
  CreditCard,
  Hash,
  ArrowRight,
  Printer,
  Wallet,
  BarChart3,
  Tag,
  Percent,
  Warehouse,
  Globe,
  Edit,
  X,
  Check,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { calculateTax } from '../utils/calculateTax';
import { toast } from 'sonner';
import { WorkspaceLayout, FormInput, FormSelect, FormTextarea } from '../components/design-system';
import { LoadingButton } from '../components/ui/LoadingButton';

interface Props {
  onNavigate?: (page: string) => void;
}

interface InvoiceItem {
  itemId: number;
  name: string;
  sku: string;
  currentStock: number;
  quantity: number;
  price: number;
  discount: number;
}

export default function SupplierInvoiceCreate({ onNavigate }: Props) {
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateMode, setDateMode] = useState<'auto' | 'manual'>('auto');
  const [manualDate, setManualDate] = useState(formatDate(Date.now()));

  const [newInvoice, setNewInvoice] = useState({
    supplierId: 0,
    warehouseId: 0,
    invoiceNumber: '',
    currency: 'EGP',
    taxId: undefined as number | undefined,
    paymentStatus: 'unpaid' as 'paid' | 'partial' | 'unpaid',
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'check' | 'credit',
    paidAmount: 0,
    notes: '',
    items: [] as InvoiceItem[],
  });

  const [quickItem, setQuickItem] = useState({
    name: '',
    sku: `SKU-${Math.floor(10000 + Math.random() * 90000)}`,
    purchasePrice: 0,
    sellingPrice: 0,
    category: 'مواد غذائية',
  });

  const { data: suppliersRes } = useSuppliers();
  const suppliers = (suppliersRes as any)?.items;
  const { data: itemsRes } = useInventory({ pageSize: 1000 } as any);
  const availableItems = (itemsRes as any)?.items;
  const { data: taxesRes } = useTaxConfigs({ isActive: 'true' } as any);
  const taxes = (taxesRes as any)?.items;

  const createItem = useCreateInventoryItem();
  const createPurchaseOrder = useCreatePurchaseOrder();

  const subtotal = useMemo(
    () => newInvoice.items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    [newInvoice.items]
  );

  const totalDiscount = useMemo(
    () => newInvoice.items.reduce((acc, i) => acc + i.discount * i.quantity, 0),
    [newInvoice.items]
  );

  const taxableAmount = subtotal - totalDiscount;

  const { taxAmount, totalAmount } = useMemo(() => {
    if (newInvoice.taxId) {
      const tax = taxes?.find((t: TaxConfig) => t.id === newInvoice.taxId);
      if (tax) {
        const calc = calculateTax({
          subtotal: taxableAmount,
          taxRate: tax.rate,
          isInclusive: tax.isInclusive,
        });
        return { taxAmount: calc.taxAmount, totalAmount: calc.total };
      }
    }
    return { taxAmount: 0, totalAmount: taxableAmount };
  }, [newInvoice.taxId, taxableAmount, taxes]);

  const totalPaid = newInvoice.paymentStatus === 'paid' ? totalAmount : newInvoice.paidAmount;
  const remaining = Math.max(0, totalAmount - totalPaid);

  const totalQuantity = useMemo(
    () => newInvoice.items.reduce((acc, i) => acc + i.quantity, 0),
    [newInvoice.items]
  );

  const kpiCards = [
    { label: 'عدد الأصناف', value: newInvoice.items.length, icon: Package, color: 'text-blue-600' },
    { label: 'إجمالي الكمية', value: totalQuantity, icon: BarChart3, color: 'text-purple-600' },
    { label: 'إجمالي الفاتورة', value: formatCurrency(totalAmount), icon: DollarSign, color: 'text-green-600' },
    { label: 'المدفوع', value: formatCurrency(totalPaid), icon: Wallet, color: 'text-emerald-600' },
    { label: 'المتبقي', value: formatCurrency(remaining), icon: CreditCard, color: remaining > 0 ? 'text-red-600' : 'text-gray-400' },
  ];

  const handleQuickAddItem = async () => {
    if (!quickItem.name || !quickItem.sku) return;

    const response = await createItem.mutateAsync({
      ...quickItem,
      quantity: 0,
      minQuantity: 10,
      location: 'مستلم حديثاً',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as Partial<Item>);

    const newItem = response as any;
    addItemToInvoice(newItem.id);
    setIsAddingNewItem(false);
    setQuickItem({
      name: '',
      sku: `SKU-${Math.floor(10000 + Math.random() * 90000)}`,
      purchasePrice: 0,
      sellingPrice: 0,
      category: 'مواد غذائية',
    });
  };

  const handleCreateInvoice = async (action: 'save' | 'print') => {
    if (newInvoice.supplierId === 0 || newInvoice.items.length === 0) {
      toast.error('يرجى اختيار المورد وإضافة أصناف للفاتورة');
      return;
    }

    try {
      setIsSubmitting(true);

      const orderNumber = `INV-SUP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await createPurchaseOrder.mutateAsync({
        orderNumber,
        supplierId: newInvoice.supplierId,
        invoiceNumber: newInvoice.invoiceNumber,
        items: newInvoice.items.map((i) => ({
          itemId: i.itemId,
          quantity: i.quantity,
          price: i.price - i.discount,
        })),
        subtotal,
        taxId: newInvoice.taxId,
        taxAmount,
        totalAmount,
        status: 'received',
        paymentStatus: newInvoice.paymentStatus,
        paymentMethod: newInvoice.paymentMethod,
        paidAmount: newInvoice.paymentStatus === 'paid' ? totalAmount : newInvoice.paidAmount,
        notes: newInvoice.notes,
        date: Date.now(),
      } as Partial<PurchaseOrder>);

      toast.success('تمت إضافة فاتورة المورد وتحديث المخزون بنجاح');

      if (action === 'print') {
        setTimeout(() => window.print(), 300);
      }

      onNavigate?.('supplier-invoices');
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
      items: [
        ...newInvoice.items,
        { itemId, name: item.name, sku: item.sku, currentStock: item.quantity, quantity: 1, price: item.purchasePrice || 0, discount: 0 },
      ],
    });
  };

  const removeItem = (idx: number) => {
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter((_, i) => i !== idx),
    });
  };

  const updateItem = (idx: number, field: keyof InvoiceItem, value: any) => {
    const items = [...newInvoice.items];
    (items[idx] as any)[field] = value;
    setNewInvoice({ ...newInvoice, items });
  };

  return (
    <WorkspaceLayout maxWidth="full">
      <div className="flex flex-col gap-6">
        {/* SECTION 1 — Header Actions */}
        <div className="bg-white rounded-2xl border border-[#E0E3E5] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            <h1 className="text-lg font-bold text-gray-900">تسجيل فاتورة مورد</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleCreateInvoice('save')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              حفظ الفاتورة
            </button>
            <button
              onClick={() => handleCreateInvoice('print')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-[#E0E3E5] text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              حفظ وطباعة
            </button>
            <button
              onClick={() => onNavigate?.('supplier-invoices')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-[#E0E3E5] text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              العودة للفواتير
            </button>
          </div>
        </div>

        {/* Main layout: form + sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column — form sections */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* SECTION 2 — Invoice Information */}
            <div className="bg-white rounded-2xl border border-[#E0E3E5] p-6">
              <div className="flex items-center gap-2 mb-5">
                <FileText className="w-5 h-5 text-gray-700" />
                <h2 className="font-bold text-gray-900">بيانات الفاتورة</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <FormSelect
                    label="المورد"
                    required
                    value={newInvoice.supplierId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, supplierId: parseInt(e.target.value) })}
                    options={[
                      { value: 0, label: 'اختر المورد...' },
                      ...(suppliers?.map((s: Supplier) => ({ value: s.id!, label: s.name })) || []),
                    ]}
                  />
                  <FormSelect
                    label="المخزن"
                    value={newInvoice.warehouseId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, warehouseId: parseInt(e.target.value) })}
                    options={[
                      { value: 0, label: 'المخزن الرئيسي' },
                      { value: 1, label: 'مخزن فرعي 1' },
                    ]}
                  />
                  <FormInput
                    label="رقم الفاتورة"
                    placeholder="رقم فاتورة المورد الورقية"
                    value={newInvoice.invoiceNumber}
                    onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                    icon={<Hash className="w-4 h-4 text-gray-400" />}
                  />
                  <FormSelect
                    label="العملة"
                    value={newInvoice.currency}
                    onChange={(e) => setNewInvoice({ ...newInvoice, currency: e.target.value })}
                    options={[
                      { value: 'EGP', label: 'جنيه مصري (EGP)' },
                      { value: 'USD', label: 'دولار أمريكي (USD)' },
                      { value: 'EUR', label: 'يورو (EUR)' },
                    ]}
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">تاريخ الفاتورة</label>
                    <div className="flex gap-3">
                      <label className={cn(
                        'flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all',
                        dateMode === 'auto' ? 'border-black bg-gray-50' : 'border-gray-200 bg-white'
                      )}>
                        <input
                          type="radio"
                          name="dateMode"
                          checked={dateMode === 'auto'}
                          onChange={() => setDateMode('auto')}
                          className="accent-black"
                        />
                        <span className="text-xs font-bold">تاريخ اليوم تلقائياً</span>
                      </label>
                      <label className={cn(
                        'flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all',
                        dateMode === 'manual' ? 'border-black bg-gray-50' : 'border-gray-200 bg-white'
                      )}>
                        <input
                          type="radio"
                          name="dateMode"
                          checked={dateMode === 'manual'}
                          onChange={() => setDateMode('manual')}
                          className="accent-black"
                        />
                        <span className="text-xs font-bold">تحديد التاريخ يدوياً</span>
                      </label>
                    </div>
                    {dateMode === 'auto' ? (
                      <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(Date.now())}
                      </div>
                    ) : (
                      <input
                        type="date"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                        className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black font-bold outline-none"
                      />
                    )}
                  </div>
                  <FormSelect
                    label="طريقة الدفع"
                    value={newInvoice.paymentMethod}
                    onChange={(e) => setNewInvoice({ ...newInvoice, paymentMethod: e.target.value as any })}
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
                    onChange={(e) => setNewInvoice({ ...newInvoice, paymentStatus: e.target.value as any })}
                    options={[
                      { value: 'paid', label: 'مدفوعة بالكامل' },
                      { value: 'partial', label: 'مدفوع جزء' },
                      { value: 'unpaid', label: 'آجل (غير مدفوعة)' },
                    ]}
                  />
                  {newInvoice.paymentStatus === 'partial' && (
                    <FormInput
                      label="المبلغ المدفوع"
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={newInvoice.paidAmount || ''}
                      onChange={(e) => setNewInvoice({ ...newInvoice, paidAmount: parseFloat(e.target.value) || 0 })}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3 — KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {kpiCards.map((kpi, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-[#E0E3E5] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500">{kpi.label}</span>
                    <kpi.icon className={cn('w-4 h-4', kpi.color)} />
                  </div>
                  <span className={cn('text-lg font-bold leading-tight', kpi.color)}>{kpi.value}</span>
                </div>
              ))}
            </div>

            {/* SECTION 4 — Items Management */}
            <div className="bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden">
              <div className="p-4 bg-gray-900 text-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <h3 className="font-bold text-sm">قائمة الأصناف</h3>
                  <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {newInvoice.items.length} صنف
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        addItemToInvoice(parseInt(e.target.value));
                        e.target.value = '';
                      }
                    }}
                    className="bg-white text-black rounded-xl text-xs px-3 py-2 font-bold outline-none"
                  >
                    <option value="">اختيار من المخزون...</option>
                    {availableItems?.map((i: Item) => (
                      <option key={i.id} value={i.id!}>
                        {i.name} (SKU: {i.sku})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewItem(!isAddingNewItem)}
                    className="bg-green-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-green-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة صنف جديد
                  </button>
                </div>
              </div>

              {isAddingNewItem && (
                <div className="bg-green-50 p-4 border-b-2 border-dashed border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-bold text-green-800">بيانات الصنف الجديد وسيتم تسجيله تلقائياً</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <FormInput
                      placeholder="اسم الصنف"
                      value={quickItem.name}
                      onChange={(e) => setQuickItem({ ...quickItem, name: e.target.value })}
                    />
                    <FormInput
                      placeholder="رقم SKU"
                      value={quickItem.sku}
                      onChange={(e) => setQuickItem({ ...quickItem, sku: e.target.value })}
                    />
                    <FormInput
                      type="number"
                      placeholder="سعر الشراء"
                      value={quickItem.purchasePrice || ''}
                      onChange={(e) => setQuickItem({ ...quickItem, purchasePrice: parseFloat(e.target.value) || 0 })}
                    />
                    <FormInput
                      type="number"
                      placeholder="سعر البيع"
                      value={quickItem.sellingPrice || ''}
                      onChange={(e) => setQuickItem({ ...quickItem, sellingPrice: parseFloat(e.target.value) || 0 })}
                    />
                    <LoadingButton
                      onClick={handleQuickAddItem}
                      isPending={createItem.isPending}
                      loadingText="جاري..."
                      variant="primary"
                      size="sm"
                    >
                      حفظ وإضافة
                    </LoadingButton>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                {newInvoice.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-gray-50/50">
                    <Package className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="font-bold text-sm text-gray-400">لم يتم إضافة أصناف بعد</p>
                    <p className="text-xs text-gray-400 mt-1">اختر من المخزون أو أضف صنفاً جديداً</p>
                  </div>
                ) : (
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500">#</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500">الصنف</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500">SKU</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500">المخزون الحالي</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500">الكمية</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500">سعر الشراء</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500">
                          الخصم
                          <span className="mr-1 text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">قريباً</span>
                        </th>
                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500">الضريبة</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500">الإجمالي</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {newInvoice.items.map((item, idx) => {
                        const lineTotal = item.price * item.quantity - item.discount * item.quantity;
                        const tax = taxes?.find((t: TaxConfig) => t.id === newInvoice.taxId);
                        const lineTax = tax
                          ? tax.isInclusive
                            ? lineTotal - lineTotal / (1 + tax.rate / 100)
                            : lineTotal * (tax.rate / 100)
                          : 0;
                        const grandTotal = tax?.isInclusive ? lineTotal : lineTotal + lineTax;

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 text-xs font-bold text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-gray-800">{item.name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                {item.sku}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold" style={{ color: item.currentStock <= 0 ? '#EF4444' : '#10B981' }}>
                                {item.currentStock}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity || ''}
                                onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-16 bg-[#F2F4F6] rounded-lg py-1.5 px-2 text-center text-xs font-bold outline-none focus:ring-2 focus:ring-black"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price || ''}
                                onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                                className="w-20 bg-[#F2F4F6] rounded-lg py-1.5 px-2 text-center text-xs font-bold outline-none focus:ring-2 focus:ring-black"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.discount || ''}
                                  disabled
                                  className="w-16 bg-gray-100 rounded-lg py-1.5 px-2 text-center text-xs font-bold text-gray-400 cursor-not-allowed"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold text-blue-600">
                                {formatCurrency(lineTax)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold text-gray-900">
                                {formatCurrency(grandTotal)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* SECTION 6 — Notes */}
            <div className="bg-white rounded-2xl border border-[#E0E3E5] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Edit className="w-4 h-4 text-gray-700" />
                <h2 className="font-bold text-gray-900">ملاحظات الفاتورة</h2>
              </div>
              <FormTextarea
                placeholder="أدخل أي ملاحظات إضافية هنا..."
                value={newInvoice.notes}
                onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                rows={5}
              />
            </div>

            {/* SECTION 7 — Footer Actions */}
            <div className="bg-white rounded-2xl border border-[#E0E3E5] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-bold text-gray-500">إجمالي الفاتورة: {formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <LoadingButton
                  onClick={() => handleCreateInvoice('save')}
                  isPending={isSubmitting}
                  loadingText="جاري الحفظ..."
                  variant="primary"
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                  حفظ الفاتورة
                </LoadingButton>
                <button
                  onClick={() => handleCreateInvoice('print')}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border-2 border-[#E0E3E5] text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  حفظ وطباعة
                </button>
                <button
                  onClick={() => onNavigate?.('supplier-invoices')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border-2 border-[#E0E3E5] text-gray-500 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                  إلغاء
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 5 — Financial Summary Sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E0E3E5] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="w-5 h-5 text-gray-700" />
                  <h2 className="font-bold text-gray-900">ملخص الفاتورة</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500">إجمالي الأصناف</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500">
                      الخصم
                      <span className="mr-1 text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">قريباً</span>
                    </span>
                    <span className="text-sm font-bold text-gray-400">{formatCurrency(0)}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-gray-500">الضريبة</span>
                      <select
                        value={newInvoice.taxId || ''}
                        onChange={(e) => setNewInvoice({ ...newInvoice, taxId: e.target.value ? Number(e.target.value) : undefined })}
                        className="text-[10px] bg-gray-50 rounded-lg px-1.5 py-0.5 font-bold outline-none border border-gray-200"
                      >
                        <option value="">بدون</option>
                        {taxes?.map((t: TaxConfig) => (
                          <option key={t.id} value={t.id!}>{t.name} ({t.rate}%)</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{formatCurrency(taxAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-xs font-bold text-gray-800">الإجمالي النهائي</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500">المدفوع</span>
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">المتبقي</span>
                    <span className={cn('text-sm font-bold', remaining > 0 ? 'text-red-600' : 'text-gray-400')}>
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 text-white rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <h3 className="font-bold text-sm">إجمالي الفاتورة</h3>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>{newInvoice.items.length} أصناف</span>
                  <span>{totalQuantity} قطعة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
