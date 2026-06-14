import React, { useState } from 'react';
import { useCreatePurchaseOrder } from '../hooks/usePurchaseOrders';
import { useCreateInventoryItem, useInventory } from '../hooks/useInventory';
import { useSuppliers } from '../hooks/useSuppliers';
import { useTaxConfigs } from '../hooks/useTaxConfigs';
import type { Item, Supplier, TaxConfig, PurchaseOrder } from '../types';
import {
  Plus,
  Search,
  FileText,
  XCircle,
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
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { calculateTax } from '../utils/calculateTax';
import { toast } from 'sonner';
import {
  WorkspaceLayout,
  Form,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSection,
  FormActions,
} from '../components/design-system';
import { LoadingButton } from '../components/ui/LoadingButton';

interface Props {
  onNavigate?: (page: string) => void;
}

export default function SupplierInvoiceCreate({ onNavigate }: Props) {
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    supplierId: 0,
    invoiceNumber: '',
    taxId: undefined as number | undefined,
    paymentStatus: 'unpaid' as 'paid' | 'partial' | 'unpaid',
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'check' | 'credit',
    paidAmount: 0,
    notes: '',
    items: [] as { itemId: number; quantity: number; price: number }[],
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

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newInvoice.supplierId === 0 || newInvoice.items.length === 0) {
      toast.error('يرجى اختيار المورد وإضافة أصناف للفاتورة');
      return;
    }

    try {
      setIsSubmitting(true);

      const subtotal = newInvoice.items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      let taxAmount = 0;
      let totalAmount = subtotal;

      if (newInvoice.taxId) {
        const selectedTax = taxes?.find(
          (t: TaxConfig) => t.id === newInvoice.taxId
        );
        if (selectedTax) {
          const calc = calculateTax({
            subtotal,
            taxRate: selectedTax.rate,
            isInclusive: selectedTax.isInclusive,
          });
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
        paidAmount:
          newInvoice.paymentStatus === 'paid'
            ? totalAmount
            : newInvoice.paidAmount,
        notes: newInvoice.notes,
        date: Date.now(),
      } as Partial<PurchaseOrder>);

      toast.success('تمت إضافة فاتورة المورد وتحديث المخزون بنجاح');
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
        { itemId, quantity: 1, price: item.purchasePrice || 0 },
      ],
    });
  };

  return (
    <WorkspaceLayout maxWidth="xl">
      <WorkspaceLayout.Header
        icon={ShoppingCart}
        title="تسجيل فاتورة مورد"
        subtitle="إضافة بضاعة للمخزون وتسجيل القيد المالي"
        actions={
          <button
            onClick={() => onNavigate?.('supplier-invoices')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            العودة للفواتير
          </button>
        }
      />

      <Form onSubmit={handleCreateInvoice} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSection
            title="بيانات الفاتورة الأساسية"
            icon={<FileText className="w-4 h-4" />}
          >
            <FormSelect
              label="المورد"
              required
              value={newInvoice.supplierId}
              onChange={(e) =>
                setNewInvoice({
                  ...newInvoice,
                  supplierId: parseInt(e.target.value),
                })
              }
              options={[
                { value: 0, label: 'اختر المورد...' },
                ...(suppliers?.map((s: Supplier) => ({
                  value: s.id!,
                  label: s.name,
                })) || []),
              ]}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="رقم فاتورة المورد (اختياري)"
                placeholder="رقم الفاتورة الورقية"
                value={newInvoice.invoiceNumber}
                onChange={(e) =>
                  setNewInvoice({
                    ...newInvoice,
                    invoiceNumber: e.target.value,
                  })
                }
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

          <FormSection
            title="نظام الدفع"
            icon={<CreditCard className="w-4 h-4" />}
          >
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="طريقة الدفع"
                value={newInvoice.paymentMethod}
                onChange={(e) =>
                  setNewInvoice({
                    ...newInvoice,
                    paymentMethod: e.target.value as any,
                  })
                }
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
                onChange={(e) =>
                  setNewInvoice({
                    ...newInvoice,
                    paymentStatus: e.target.value as any,
                  })
                }
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
                value={newInvoice.paidAmount || ''}
                onChange={(e) =>
                  setNewInvoice({
                    ...newInvoice,
                    paidAmount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            )}
          </FormSection>
        </div>

        <FormSection
          title="قائمة الأصناف"
          icon={<Package className="w-4 h-4 text-white" />}
        >
          <div className="flex justify-between items-center bg-black p-4 rounded-2xl">
            <h4 className="font-bold text-white pr-3">قائمة الأصناف</h4>
            <div className="flex gap-2">
              <FormSelect
                value="0"
                onChange={(e) =>
                  e.target.value !== '0' &&
                  addItemToInvoice(parseInt(e.target.value))
                }
                options={[
                  { value: '0', label: 'اضغط للاختيار من المخزن...' },
                  ...(availableItems?.map((i: Item) => ({
                    value: i.id!,
                    label: `${i.name} (SKU: ${i.sku})`,
                  })) || []),
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
              <h4 className="text-sm font-bold text-green-800 mb-4">
                بيانات الصنف الجديد وسيتم تسجيله تلقائياً
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormInput
                  placeholder="اسم الصنف"
                  value={quickItem.name}
                  onChange={(e) =>
                    setQuickItem({ ...quickItem, name: e.target.value })
                  }
                  className="[&_input]:bg-white [&_input]:border [&_input]:border-green-200 [&_input]:focus:ring-green-500"
                />
                <FormInput
                  placeholder="رقم SKU"
                  value={quickItem.sku}
                  onChange={(e) =>
                    setQuickItem({ ...quickItem, sku: e.target.value })
                  }
                  className="[&_input]:bg-white [&_input]:border [&_input]:border-green-200 [&_input]:focus:ring-green-500"
                />
                <FormInput
                  type="number"
                  placeholder="سعر الشراء"
                  value={quickItem.purchasePrice || ''}
                  onChange={(e) =>
                    setQuickItem({
                      ...quickItem,
                      purchasePrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="[&_input]:bg-white [&_input]:border [&_input]:border-green-200 [&_input]:focus:ring-green-500"
                />
                <LoadingButton
                  onClick={handleQuickAddItem}
                  isPending={createItem.isPending}
                  loadingText="جاري الحفظ..."
                  variant="primary"
                  size="sm"
                >
                  حفظ وإضافة للجدول
                </LoadingButton>
              </div>
            </div>
          )}

          <div className="space-y-3 min-h-[150px] max-h-[300px] overflow-y-auto pr-2">
            {newInvoice.items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 bg-gray-50 border-2 border-dashed border-gray-100 rounded-3xl opacity-50">
                <Package className="w-10 h-10 mb-2" />
                <p className="font-bold text-sm">
                  البطاقة فارغة، ابدأ بإضافة المنتجات
                </p>
              </div>
            )}
            {newInvoice.items.map((orderItem, idx) => {
              const item = availableItems?.find(
                (i: Item) => i.id === orderItem.itemId
              );
              return (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-[#E0E3E5] hover:border-black transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-black truncate">
                      {item?.name}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400">
                      SKU: {item?.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400">
                        الكمية
                      </label>
                      <FormInput
                        type="number"
                        value={orderItem.quantity || ''}
                        onChange={(e) => {
                          const items = [...newInvoice.items];
                          items[idx].quantity = parseInt(e.target.value) || 0;
                          setNewInvoice({ ...newInvoice, items });
                        }}
                        className="[&_input]:w-24 [&_input]:text-center [&_input]:text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400">
                        سعر الشراء (للقطعة)
                      </label>
                      <FormInput
                        type="number"
                        value={orderItem.price || ''}
                        onChange={(e) => {
                          const items = [...newInvoice.items];
                          items[idx].price = parseFloat(e.target.value) || 0;
                          setNewInvoice({ ...newInvoice, items });
                        }}
                        className="[&_input]:w-32 [&_input]:text-center [&_input]:text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1 min-w-[100px] text-left">
                      <label className="text-[10px] font-bold text-gray-400">
                        الإجمالي
                      </label>
                      <p className="text-sm font-bold text-black">
                        {formatCurrency(orderItem.price * orderItem.quantity)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNewInvoice({
                          ...newInvoice,
                          items: newInvoice.items.filter((_, i) => i !== idx),
                        })
                      }
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
              onChange={(e) =>
                setNewInvoice({ ...newInvoice, notes: e.target.value })
              }
              rows={4}
            />
          </div>
          <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
              <span>المطالبة الفرعية:</span>
              <span className="font-bold text-black">
                {formatCurrency(
                  newInvoice.items.reduce(
                    (acc, i) => acc + i.price * i.quantity,
                    0
                  )
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-400">
                الضريبة
              </label>
              <FormSelect
                value={newInvoice.taxId || ''}
                onChange={(e) =>
                  setNewInvoice({
                    ...newInvoice,
                    taxId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                options={[
                  { value: '', label: 'لا توجد ضريبة' },
                  ...(taxes?.map((t: TaxConfig) => ({
                    value: t.id!,
                    label: `${t.name} (${t.rate}%)`,
                  })) || []),
                ]}
                className="[&_select]:bg-white [&_select]:border [&_select]:rounded-lg [&_select]:px-2 [&_select]:py-1 [&_select]:text-[11px]"
              />
            </div>

            {newInvoice.taxId && (
              <div className="flex justify-between items-center text-xs font-bold text-blue-600">
                <span>قيمة الضريبة:</span>
                <span className="font-bold">
                  {(() => {
                    const tax = taxes?.find(
                      (t: TaxConfig) => t.id === newInvoice.taxId
                    );
                    const sub = newInvoice.items.reduce(
                      (acc, i) => acc + i.price * i.quantity,
                      0
                    );
                    if (!tax) return formatCurrency(0);
                    const val = tax.isInclusive
                      ? sub - sub / (1 + tax.rate / 100)
                      : sub * (tax.rate / 100);
                    return formatCurrency(val);
                  })()}
                </span>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                الإجمالي المستحق
              </p>
              <p className="text-3xl font-bold text-black">
                {(() => {
                  const sub = newInvoice.items.reduce(
                    (acc, i) => acc + i.price * i.quantity,
                    0
                  );
                  const tax = taxes?.find(
                    (t: TaxConfig) => t.id === newInvoice.taxId
                  );
                  const total = tax
                    ? tax.isInclusive
                      ? sub
                      : sub + sub * (tax.rate / 100)
                    : sub;
                  return formatCurrency(total);
                })()}
              </p>
            </div>
          </div>
        </div>

        <FormActions
          primaryLabel="حفظ الفاتورة وتحديث المخزون"
          secondaryLabel="إلغاء الأمر"
          onSecondary={() => onNavigate?.('supplier-invoices')}
          loading={isSubmitting || createPurchaseOrder.isPending}
          primaryClassName="flex items-center justify-center gap-3"
          secondaryClassName="border-2 border-[#E0E3E5]"
        />
      </Form>
    </WorkspaceLayout>
  );
}
