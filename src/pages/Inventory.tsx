import React, { useState, useMemo } from 'react';
import type { Item } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  QrCode,
  Package,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { 
  WorkspaceLayout, EmptyState, EnterpriseTable, type Column,
  Modal, Form, FormInput, FormSelect, FormTextarea, FormSection, FormActions
} from '../components/design-system';
import { TableActionMenu, type ActionItem } from '../components/ui/TableActionMenu';
import { useInventory, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem, useAdjustInventoryItem } from '../hooks/useInventory';
import { useSuppliers } from '../hooks/useSuppliers';
import { LoadingButton } from '../components/ui/LoadingButton';

export default function Inventory({ 
  setActivePage 
}: { 
  setActivePage: (page: string) => void 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('جميع الفئات');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [newItem, setNewItem] = useState<Partial<Item>>({
    name: '',
    sku: '',
    category: 'مواد غذائية',
    purchasePrice: undefined,
    sellingPrice: undefined,
    quantity: undefined,
    minQuantity: 10,
    location: ''
  });
  const [isDuplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateItem, setDuplicateItem] = useState<Item | null>(null);

  const [adjustmentData, setAdjustmentData] = useState({
    oldQty: 0,
    newQty: 0,
    diff: 0,
    oldPurchasePrice: 0,
    newPurchasePrice: 0,
    oldSellingPrice: 0,
    newSellingPrice: 0,
    type: 'increase' as 'increase' | 'decrease' | 'price_update',
    reason: '',
    changedFields: [] as string[]
  });

  const { data: inventoryData } = useInventory({ pageSize: 10000 });
  const { data: suppliersData } = useSuppliers({ pageSize: 10000 });
  const items = inventoryData?.items;
  const suppliers = suppliersData?.items;

  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const deleteMutation = useDeleteInventoryItem();
  const adjustMutation = useAdjustInventoryItem();

  const generateSKU = () => {
    return `SKU-${Math.floor(10000 + Math.random() * 90000)}`;
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNewItem({
      name: '',
      sku: generateSKU(),
      category: 'مواد غذائية',
      purchasePrice: undefined,
      sellingPrice: undefined,
      quantity: undefined,
      minQuantity: 10,
      location: ''
    });
    setModalOpen(true);
  };

  const filteredItems = useMemo(() => items?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'جميع الفئات' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }), [items, searchTerm, categoryFilter]);

  
  const columns: Column<Item>[] = [
    { key: 'name', label: 'الصنف', sortable: true, render: (item) => <span className="font-bold text-black">{item.name}</span> },
    { key: 'sku', label: 'SKU', sortable: true, render: (item) => <span className="text-sm text-gray-500">{item.sku}</span> },
    { key: 'category', label: 'الفئة', sortable: true, render: (item) => <span className="text-sm font-bold">{item.category}</span> },
    { key: 'location', label: 'الموقع', render: (item) => <span className="text-sm text-gray-500">{item.location || '-'}</span> },
    { key: 'quantity', label: 'الكمية', sortable: true, render: (item) => (
      <span className={cn("font-bold", item.quantity <= item.minQuantity ? "text-red-500" : "text-black")}>
        {item.quantity} وحدة
      </span>
    )},
    { key: 'purchasePrice', label: 'شراء / بيع', render: (item) => (
      <div className="flex flex-col">
        <span className="text-xs text-gray-400 font-bold">شراء: {formatCurrency(item.purchasePrice || 0)}</span>
        <span className="text-sm text-black font-bold">بيع: {formatCurrency(item.sellingPrice || 0)}</span>
      </div>
    )},
    {
      key: 'actions',
      label: '',
      render: (item) => (
        <div className="flex items-center gap-2 justify-start">
          <button onClick={() => { setEditingItem(item); setNewItem({...item}); setModalOpen(true); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500" title="تعديل البيانات">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setEditingItem(item); setAdjustmentData({ oldQty: item.quantity, newQty: item.quantity, diff: 0, oldPurchasePrice: item.purchasePrice || 0, newPurchasePrice: item.purchasePrice || 0, oldSellingPrice: item.sellingPrice || 0, newSellingPrice: item.sellingPrice || 0, type: 'increase', reason: '', changedFields: [] }); setAdjustmentModalOpen(true); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500" title="تسوية جرد أو تعديل أسعار">
            <ArrowRightLeft className="w-4 h-4" />
          </button>
          <button onClick={() => item.id !== undefined && confirmDelete(item.id)}
            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer" title="حذف الصنف">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-left'
    }
  ];

const inventoryStats = useMemo(() => [
  { label: 'إجمالي الأصناف', value: items?.length || 0, icon: Package, color: 'text-blue-500' },
  { label: 'أصناف منخفضة', value: items?.filter(i => i.quantity <= i.minQuantity).length || 0, icon: AlertCircle, color: 'text-orange-500' },
  { label: 'إجمالي الكمية', value: items?.reduce((acc, i) => acc + i.quantity, 0) || 0, icon: Package, color: 'text-green-500' },
  { label: 'القيمة (بيع)', value: formatCurrency(items?.reduce((acc, i) => acc + (i.sellingPrice * i.quantity), 0) || 0), icon: Package, color: 'text-purple-500' },
  ], [items]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.sku) {
      toast.error('يرجى ملء الحقول الأساسية (الاسم و SKU)');
      return;
    }

    if ((newItem.quantity || 0) < 0) {
      toast.error('الكمية لا يمكن أن تكون سالبة');
      return;
    }
    if ((newItem.purchasePrice || 0) < 0) {
      toast.error('سعر الشراء لا يمكن أن يكون سالباً');
      return;
    }
    if ((newItem.sellingPrice || 0) < 0) {
      toast.error('سعر البيع لا يمكن أن يكون سالباً');
      return;
    }

    const existing = items?.find(i =>
      (i.sku === newItem.sku || i.name === newItem.name) &&
      (!editingItem || i.id !== editingItem.id)
    );
    if (existing) {
      setDuplicateItem(existing);
      setDuplicateModalOpen(true);
      return;
    }

    if (editingItem) {
      const changedFields: string[] = [];
      const qtyChanged = newItem.quantity !== undefined && newItem.quantity !== editingItem.quantity;
      const purchasePriceChanged = newItem.purchasePrice !== undefined && newItem.purchasePrice !== (editingItem.purchasePrice || 0);
      const sellingPriceChanged = newItem.sellingPrice !== undefined && newItem.sellingPrice !== (editingItem.sellingPrice || 0);

      if (qtyChanged) changedFields.push('quantity');
      if (purchasePriceChanged) changedFields.push('purchasePrice');
      if (sellingPriceChanged) changedFields.push('sellingPrice');

      if (changedFields.length > 0) {
        let type: 'increase' | 'decrease' | 'price_update' = 'price_update';
        if (qtyChanged) {
          type = (newItem.quantity || 0) > editingItem.quantity ? 'increase' : 'decrease';
        }

        setAdjustmentData({
          oldQty: editingItem.quantity,
          newQty: newItem.quantity || 0,
          diff: Math.abs((newItem.quantity || 0) - editingItem.quantity),
          oldPurchasePrice: editingItem.purchasePrice || 0,
          newPurchasePrice: newItem.purchasePrice || 0,
          oldSellingPrice: editingItem.sellingPrice || 0,
          newSellingPrice: newItem.sellingPrice || 0,
          type,
          reason: '',
          changedFields
        });
        setAdjustmentModalOpen(true);
        return;
      }
    }

    await saveItem();
  };

  const saveItem = async (reasonOverride?: string) => {
    try {
      if (editingItem && editingItem.id != null) {
        const oldQty = editingItem.quantity;
        const newQty = newItem.quantity || 0;
        const qtyChanged = oldQty !== newQty;

        if (qtyChanged && reasonOverride) {
          await adjustMutation.mutateAsync({
            id: editingItem.id,
            diff: Math.abs(newQty - oldQty),
            type: newQty > oldQty ? 'increase' : 'decrease',
            reason: reasonOverride,
          });
        }

        const updateData: Record<string, any> = {};
        if (newItem.name !== undefined) updateData.name = newItem.name;
        if (newItem.sku !== undefined) updateData.sku = newItem.sku;
        if (newItem.category !== undefined) updateData.category = newItem.category;
        if (newItem.purchasePrice !== undefined) updateData.purchasePrice = newItem.purchasePrice;
        if (newItem.sellingPrice !== undefined) updateData.sellingPrice = newItem.sellingPrice;
        if (newItem.quantity !== undefined) updateData.quantity = newItem.quantity;
        if (newItem.minQuantity !== undefined) updateData.minQuantity = newItem.minQuantity;
        if (newItem.location !== undefined) updateData.location = newItem.location;
        if (newItem.supplierId !== undefined) updateData.supplierId = newItem.supplierId;

        await updateMutation.mutateAsync({ id: editingItem.id, data: updateData as Partial<Item> });
        toast.success('تم تحديث الصنف بنجاح');
      } else {
        await createMutation.mutateAsync(newItem as Partial<Item>);
        toast.success('تمت إضافة الصنف بنجاح');
      }

      setModalOpen(false);
      setEditingItem(null);
      setNewItem({
        name: '',
        sku: '',
        category: 'مواد غذائية',
        purchasePrice: undefined,
        sellingPrice: undefined,
        quantity: undefined,
        minQuantity: 10,
        location: ''
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'فشل حفظ الصنف');
    }
  };

  const finalizeAdjustment = async () => {
    if (!adjustmentData.reason) {
      toast.error('يرجى اختيار أو كتابة سبب التعديل');
      return;
    }
    await saveItem(adjustmentData.reason);
    setAdjustmentModalOpen(false);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      sku: item.sku,
      category: item.category,
      purchasePrice: item.purchasePrice || 0,
      sellingPrice: item.sellingPrice || 0,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      location: item.location,
      supplierId: item.supplierId
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (itemToDelete === null) return;
    if (!deleteReason) {
      toast.error('يرجى اختيار أو كتابة سبب الحذف');
      return;
    }
    
    try {
      await deleteMutation.mutateAsync({ id: itemToDelete, reason: deleteReason });
      toast.success('تم حذف الصنف بنجاح');
      setDeleteModalOpen(false);
      setItemToDelete(null);
      setDeleteReason('');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const confirmDelete = (id: number) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };


  return (
    <WorkspaceLayout maxWidth="xl">
      <WorkspaceLayout.Header
        title="الأصناف والمخزون"
        subtitle={`إدارة وتتبع ${items?.length || 0} صنفاً مسجلاً`}
        actions={
          <>
            <button onClick={() => {
              const data ="ملصقات باركود الأصناف - المخازن المصرية\n\n" + items?.map(i => `${i.name} [${i.sku}] - ${i.sellingPrice} ج.م`).join('\n');
              const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `barcodes_${Date.now()}.txt`;
              link.click();
              URL.revokeObjectURL(url);
            }} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <QrCode className="w-3.5 h-3.5" /> طباعة
            </button>
            <button onClick={openAddModal} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors">
              <Plus className="w-3.5 h-3.5" /> إضافة صنف
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {inventoryStats.map((stat, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-4">
            <div className={cn("p-2 rounded-lg bg-white/60", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold">{stat.label}</p>
              <h4 className="stat-value">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="card-premium p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium w-full py-2 pr-10 pl-4 text-sm"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('جميع الفئات');
            }}
            className="flex-1 md:flex-none bg-white border border-gray-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-sm font-bold"
          >
            <Filter className="w-4 h-4" />
            إعادة ضبط
          </button>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 md:flex-none bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-black transition-all"
          >
            <option value="جميع الفئات">جميع الفئات</option>
            <option value="إلكترونيات">إلكترونيات</option>
            <option value="مواد غذائية">مواد غذائية</option>
            <option value="مستلزمات طبية">مستلزمات طبية</option>
            <option value="منظفات">منظفات</option>
          </select>
        </div>
      </div>

      <EnterpriseTable
        data={filteredItems || []}
        columns={columns}
        keyExtractor={(item) => item.id!}
        searchable={false}
        pagination
        pageSize={10}
        compact
        emptyState={
          <div className='flex flex-col items-center gap-2 py-12 opacity-50'>
            <Package className='w-12 h-12 text-gray-300' />
            <p className='font-bold text-gray-400'>لا توجد أصناف مسجلة حالياً</p>
            <p className='text-xs text-gray-300'>أضف صنفك الأول باستخدام الزر أعلاه</p>
          </div>
        }
      />

      <Modal
        open={isModalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        title={editingItem ? 'تعديل الصنف' : 'إضافة صنف جديد'}
        subtitle="يرجى إدخال بيانات الصنف بدقة"
        size="2xl"
        titleIcon={<Package className="text-white w-6 h-6" />}
      >
        <Form onSubmit={handleAddItem}>
          <FormSection title="معلومات أساسية" icon={<Package className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="اسم الصنف"
                required
                type="text"
                value={newItem.name ?? ''}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                placeholder="مثال: أرز الفاخر - 5كجم"
              />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">الرمز التعريفي (SKU)<span className="text-red-400 me-0.5">*</span></label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <FormInput
                      required
                      type="text"
                      value={newItem.sku ?? ''}
                      onChange={(e) => setNewItem({...newItem, sku: e.target.value})}
                      placeholder="SKU-XXXXX"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewItem({...newItem, sku: generateSKU()})}
                    className="bg-gray-200 p-3 rounded-xl hover:bg-gray-300 transition-colors"
                    title="توليد رمز جديد"
                  >
                    <QrCode className="w-5 h-5 text-black" />
                  </button>
                </div>
              </div>
              <FormSelect
                label="المورد"
                options={suppliers?.map(s => ({value: s.id!, label: s.name})) || []}
                value={newItem.supplierId || ''}
                onChange={(e) => setNewItem({...newItem, supplierId: parseInt(e.target.value)})}
                placeholder="اختر المورد..."
              />
              <FormSelect
                label="الفئة"
                options={[
                  {value: 'مواد غذائية', label: 'مواد غذائية'},
                  {value: 'إلكترونيات', label: 'إلكترونيات'},
                  {value: 'مستلزمات طبية', label: 'مستلزمات طبية'},
                  {value: 'منظفات', label: 'منظفات'}
                ]}
                value={newItem.category ?? ''}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
              />
            </div>
          </FormSection>

          <FormSection title="معلومات المخزون" icon={<Package className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="موقع التخزين"
                type="text"
                value={newItem.location ?? ''}
                onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                placeholder="مثال: ممر A - رف 04"
              />
              <FormInput
                label="الكمية الحالية"
                required
                type="number"
                min={0}
                value={newItem.quantity ?? ''}
                onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
              />
            </div>
          </FormSection>

          <FormSection title="معلومات الأسعار" icon={<Package className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="سعر الشراء (تكلُفة)"
                required
                type="number"
                min={0}
                value={newItem.purchasePrice ?? ''}
                onChange={(e) => setNewItem({...newItem, purchasePrice: parseFloat(e.target.value) || 0})}
              />
              <div>
                <FormInput
                  label="سعر البيع"
                  required
                  type="number"
                  min={0}
                  value={newItem.sellingPrice ?? ''}
                  onChange={(e) => setNewItem({...newItem, sellingPrice: parseFloat(e.target.value) || 0})}
                />
                {(newItem.sellingPrice || 0) < (newItem.purchasePrice || 0) && (
                  <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 animate-pulse mt-1">
                    <AlertCircle className="w-3 h-3" />
                    تنبيه: سعر البيع أقل من التكلفة (خسارة!)
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          <FormActions
            primaryLabel={editingItem ? 'تحديث الصنف' : 'حفظ الصنف'}
            secondaryLabel="إلغاء"
            onSecondary={() => { setModalOpen(false); setEditingItem(null); }}
            loading={createMutation.isPending || updateMutation.isPending}
          />
        </Form>
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); setDeleteReason(''); }}
        title="حذف صنف نهائياً"
        subtitle="هذا الإجراء سيؤدي لإزالة الصنف وسجلاته بالكامل"
        size="sm"
        titleIcon={<Trash2 className="text-white w-6 h-6" />}
        footer={
          <div className="flex gap-4 pt-6">
            <LoadingButton
              onClick={handleDelete}
              isPending={deleteMutation.isPending}
              loadingText="جاري الحذف..."
              variant="danger"
              size="md"
              className="flex-[2]"
            >
              تأكيد الحذف
            </LoadingButton>
            <button
              type="button"
              onClick={() => { setDeleteModalOpen(false); setItemToDelete(null); setDeleteReason(''); }}
              className="flex-1 bg-white border-2 border-[#E0E3E5] text-[#44474D] py-4 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
            >
              تراجع
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="text-sm font-bold text-black">لماذا تريد حذف هذا الصنف؟</label>
          <div className="grid grid-cols-1 gap-2">
            {['صنف مكرر', 'توقف التعامل مع هذا الصنف', 'خطأ في إنشاء الصنف', 'أخرى'].map((reason) => (
              <button
                key={reason}
                onClick={() => setDeleteReason(reason)}
                className={cn("w-full text-right px-4 py-3 rounded-xl text-sm font-bold border transition-all",
                  deleteReason === reason 
                  ?"bg-red-500 text-white border-red-500" 
                  :"bg-white text-gray-600 border-gray-200 hover:border-red-500"
                )}
              >
                {reason}
              </button>
            ))}
          </div>
          <input 
            type="text"
            placeholder="اكتب تفاصيل إضافية في حال اختيار 'أخرى'..."
            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-500 transition-all mt-2"
            onChange={(e) => setDeleteReason(prev => prev.includes('أخرى') ? `أخرى: ${e.target.value}` : e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={isAdjustmentModalOpen}
        onClose={() => {
          setAdjustmentModalOpen(false);
          setNewItem({
            ...newItem, 
            quantity: adjustmentData.oldQty,
            purchasePrice: adjustmentData.oldPurchasePrice,
            sellingPrice: adjustmentData.oldSellingPrice
          });
        }}
        title="تسوية يدوية معتمدة"
        subtitle="تم رصد تحديثات في بيانات الصنف (حالة ذكية)"
        size="xl"
        titleIcon={
          adjustmentData.type === 'increase' ? <TrendingUp className="text-white w-6 h-6" /> : 
          adjustmentData.type === 'decrease' ? <TrendingDown className="text-white w-6 h-6" /> : 
          <ArrowRightLeft className="text-white w-6 h-6" />
        }
        footer={
          <div className="flex gap-4 pt-6">
            <LoadingButton
              onClick={finalizeAdjustment}
              isPending={adjustMutation.isPending}
              loadingText="جاري التنفيذ..."
              variant="primary"
              size="md"
              className="flex-[2]"
            >
              تأكيد وحفظ الحركة
            </LoadingButton>
            <button
              type="button"
              onClick={() => {
                setAdjustmentModalOpen(false);
                setNewItem({
                  ...newItem, 
                  quantity: adjustmentData.oldQty,
                  purchasePrice: adjustmentData.oldPurchasePrice,
                  sellingPrice: adjustmentData.oldSellingPrice
                });
              }}
              className="flex-1 bg-white border-2 border-[#E0E3E5] text-[#44474D] py-4 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
            >
              إلغاء
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {adjustmentData.changedFields.includes('quantity') && (
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400">الكمية القديمة</p>
                <p className="text-lg font-bold">{adjustmentData.oldQty}</p>
              </div>
              <ArrowRightLeft className="w-5 h-5 text-gray-300" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400">الكمية الجديدة</p>
                <p className={cn("text-lg font-bold",
                  adjustmentData.type === 'increase' ?"text-green-600" :"text-red-600"
                )}>{adjustmentData.newQty}</p>
              </div>
              <div className="text-center border-r pr-4 border-gray-200">
                <p className="text-[10px] font-bold text-gray-400">الفرق</p>
                <p className="text-lg font-bold text-blue-600">{adjustmentData.diff}+</p>
              </div>
            </div>
          )}

          {adjustmentData.changedFields.includes('purchasePrice') && (
            <div className="flex items-center justify-between bg-blue-50/30 p-4 rounded-2xl border border-blue-100">
              <div>
                <p className="text-[10px] font-bold text-blue-400">سعر الشراء (تحديث)</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 line-through">{formatCurrency(adjustmentData.oldPurchasePrice)}</span>
                  <ArrowRightLeft className="w-4 h-4 text-blue-300" />
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(adjustmentData.newPurchasePrice)}</span>
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          )}

          {adjustmentData.changedFields.includes('sellingPrice') && (
            <div className="flex items-center justify-between bg-green-50/30 p-4 rounded-2xl border border-green-100">
              <div>
                <p className="text-[10px] font-bold text-green-400">سعر البيع (تحديث)</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 line-through">{formatCurrency(adjustmentData.oldSellingPrice)}</span>
                  <ArrowRightLeft className="w-4 h-4 text-green-300" />
                  <span className="text-lg font-bold text-green-600">{formatCurrency(adjustmentData.newSellingPrice)}</span>
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          )}

          <div className="space-y-4">
            <label className="text-sm font-bold text-black flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              يرجى تحديد سبب هذا التغيير
            </label>

            <div className="grid grid-cols-2 gap-2">
              {adjustmentData.type === 'increase' ? (
                ['فاتورة شراء', 'إضافة مخزنية مباشرة', 'تسوية جرد', 'إرجاع من عميل'].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setAdjustmentData({...adjustmentData, reason})}
                    className={cn("text-right px-4 py-3 rounded-xl text-xs font-bold border transition-all",
                      adjustmentData.reason === reason 
                      ?"bg-black text-white border-black" 
                      :"bg-white text-gray-600 border-gray-200 hover:border-black"
                    )}
                  >
                    {reason}
                  </button>
                ))
              ) : adjustmentData.type === 'decrease' ? (
                ['مبيعات غير مسجلة', 'تلف / هالك', 'مرتجع مورد', 'تسوية جرد', 'سرقة / فقد'].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setAdjustmentData({...adjustmentData, reason})}
                    className={cn("text-right px-4 py-3 rounded-xl text-xs font-bold border transition-all",
                      adjustmentData.reason === reason 
                      ?"bg-black text-white border-black" 
                      :"bg-white text-gray-600 border-gray-200 hover:border-black"
                    )}
                  >
                    {reason}
                  </button>
                ))
              ) : (
                ['تحديث أسعار السوق', 'زيادة من المورد', 'خصم ترويجي', 'تعديل خطأ في السعر', 'تسوية سنوية'].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setAdjustmentData({...adjustmentData, reason})}
                    className={cn("text-right px-4 py-3 rounded-xl text-xs font-bold border transition-all",
                      adjustmentData.reason === reason 
                      ?"bg-black text-white border-black" 
                      :"bg-white text-gray-600 border-gray-200 hover:border-black"
                    )}
                  >
                    {reason}
                  </button>
                ))
              )}
            </div>

            <input 
              type="text"
              placeholder="ملاحظات توضيحية إضافية..."
              className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-black transition-all"
              onChange={(e) => setAdjustmentData({...adjustmentData, reason: adjustmentData.reason + (e.target.value ? ` - ${e.target.value}` : '')})}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={isDuplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        title="الصنف موجود بالفعل!"
        subtitle={
          <>
            هذا الصنف (اسم أو SKU) مسجل مسبقاً في النظام باسم:
            <br />
            <span className="font-bold text-black">{duplicateItem?.name}</span>
          </>
        }
        size="sm"
        footer={
          <button
            onClick={() => setDuplicateModalOpen(false)}
            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            فهمت، مراجعة البيانات
          </button>
        }
      />
    </WorkspaceLayout>
  );
}
