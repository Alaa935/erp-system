import React, { useState } from 'react';
import { Percent, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Info, CheckCircle2, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState, EnterpriseTable, type Column, Modal, Form, FormInput, FormSelect, FormActions } from '../components/design-system';
import { useTaxConfigs, useCreateTaxConfig, useUpdateTaxConfig, useDeleteTaxConfig } from '../hooks/useTaxConfigs';
import type { TaxConfig } from '../types';
import { LoadingButton } from '../components/ui/LoadingButton';

export default function TaxManagement() {
  const { data: taxRes, isLoading } = useTaxConfigs();
  const createTaxConfig = useCreateTaxConfig();
  const updateTaxConfig = useUpdateTaxConfig();
  const deleteTaxConfig = useDeleteTaxConfig();
  const taxes = (taxRes as any)?.items ?? [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxConfig | null>(null);
  const [formData, setFormData] = useState<Partial<TaxConfig>>({ name: '', rate: 0, type: 'VAT', isActive: true, isInclusive: false, code: '', description: '' });

  const handleOpenModal = (tax?: TaxConfig) => {
    if (tax) { setEditingTax(tax); setFormData(tax); }
    else { setEditingTax(null); setFormData({ name: '', rate: 0, type: 'VAT', isActive: true, isInclusive: false, code: '', description: '' }); }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData };
    if (editingTax?.id) {
      await updateTaxConfig.mutateAsync({ id: editingTax.id, data });
    } else {
      await createTaxConfig.mutateAsync(data);
    }
    setIsModalOpen(false);
  };

  const toggleStatus = async (id: number) => {
    const tax = taxes.find((t: TaxConfig) => t.id === id);
    if (tax) {
      await updateTaxConfig.mutateAsync({ id: tax.id!, data: { isActive: !tax.isActive } as any });
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const handleDelete = async (id: number) => { setDeleteConfirmId(id); };
  const handleDeleteConfirm = async () => {
    if (deleteConfirmId === null) return;
    await deleteTaxConfig.mutateAsync({ id: deleteConfirmId, reason: 'Manual deletion' });
    setDeleteConfirmId(null);
  };

  const columns: Column<TaxConfig>[] = [
    { key: 'name', label: 'الضريبة', sortable: true, render: (tax) => (<div><div className="font-black text-black">{tax.name}</div><div className="text-[10px] text-gray-400">{tax.isInclusive ? 'شامل السعر' : 'يضاف للسعر'}</div></div>) },
    { key: 'rate', label: 'النسبة', sortable: true, render: (tax) => (<span className="font-black text-blue-600">{tax.rate}%</span>) },
    { key: 'type', label: 'النوع', sortable: true, render: (tax) => (<span className="bg-gray-100 px-2 py-1 rounded-lg text-xs font-bold text-gray-600">{tax.type}</span>) },
    { key: 'isActive', label: 'الحالة', render: (tax) => (<LoadingButton onClick={() => toggleStatus(tax.id!)} isPending={updateTaxConfig.isPending} loadingText="..." variant="ghost" size="sm">{tax.isActive ? 'تعطيل' : 'تفعيل'}</LoadingButton>) },
    { key: 'actions', label: '', render: (tax) => (<div className="flex items-center justify-start gap-2"><button onClick={() => handleOpenModal(tax)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-black transition-colors"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(tax.id!)} className="p-2 hover:bg-red-50 rounded-xl text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button></div>), className: 'text-left' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-black text-black">إدارة الضرائب (Tax Management)</h2><p className="text-gray-500 text-sm font-bold">التحكم في الضرائب المضافة والقيمة المضافة وإعداداتها</p></div>
        <button onClick={() => handleOpenModal()} className="bg-black text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95"><Plus className="w-5 h-5" /> إضافة ضريبة جديدة</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-[#E0E3E5] shadow-sm">
            <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-50 rounded-xl"><Settings2 className="w-5 h-5 text-blue-600" /></div><h3 className="font-black text-black">الإعدادات الافتراضية</h3></div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between"><div><p className="text-[10px] font-black text-gray-400 uppercase">نظام الضرائب</p><p className="text-sm font-black">مفعل حالياً</p></div><div className="p-2 bg-green-100 rounded-lg"><CheckCircle2 className="w-4 h-4 text-green-600" /></div></div>
              <div className="p-4 bg-gray-50 rounded-2xl"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">طريقة الحساب الموصى بها</p><div className="flex items-center gap-2 text-xs font-bold text-gray-600 leading-relaxed"><Info className="w-4 h-4 flex-shrink-0" /><span>يفضل استخدام "السعر غير شامل الضريبة" لضمان دقة التقارير المالية والربحية.</span></div></div>
            </div>
          </div>
          <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl"><Percent className="w-8 h-8 mb-4 opacity-50" /><h3 className="text-lg font-black mb-1">الضرائب المفعلة</h3><p className="text-3xl font-black">{taxes?.filter((t: TaxConfig) => t.isActive).length || 0}</p><p className="text-xs font-bold opacity-60 mt-2">ضرائب نشطة يتم تطبيقها في الفواتير</p></div>
        </div>

        <div className="lg:col-span-2">
          <div className="card-premium overflow-hidden">
            <EnterpriseTable data={taxes || []} columns={columns} keyExtractor={(tax: TaxConfig) => tax.id!} searchable={false} emptyState={<EmptyState icon={Percent} title="لا توجد ضرائب معرفة" description="أضف ضريبتك الأولى باستخدام الزر أعلاه" />} />
          </div>
        </div>
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTax ? 'تعديل الضريبة' : 'إضافة ضريبة جديدة'} size="xl" footer={<FormActions primaryLabel="حفظ التعديلات" secondaryLabel="إلغاء" onSecondary={() => setIsModalOpen(false)} loading={createTaxConfig.isPending || updateTaxConfig.isPending} />}>
        <Form onSubmit={handleSave} autoFocusFirst>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1"><FormInput label="اسم الضريبة" type="text" value={formData.name ?? ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            <div className="col-span-2 sm:col-span-1"><FormInput label="النسبة (%)" type="number" step="0.01" value={formData.rate ?? 0} onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })} required /></div>
            <div className="col-span-2 sm:col-span-1"><FormSelect label="نوع الضريبة" options={[{ value: 'VAT', label: 'ضريبة القيمة المضافة (VAT)' }, { value: 'Sales', label: 'ضريبة مبيعات' }, { value: 'Service', label: 'ضريبة خدمات' }, { value: 'Custom', label: 'أخرى' }]} value={formData.type ?? ''} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} /></div>
            <div className="col-span-2 sm:col-span-1"><FormInput label="كود الضريبة (اختياري)" type="text" value={formData.code ?? ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} /></div>
          </div>
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl"><input type="checkbox" id="inclusive" className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" checked={formData.isInclusive} onChange={(e) => setFormData({ ...formData, isInclusive: e.target.checked })} /><label htmlFor="inclusive" className="text-sm font-bold text-gray-700 cursor-pointer">السعر شامل الضريبة (Tax Inclusive)</label></div>
            <p className="text-[10px] text-gray-400 font-bold px-4 leading-relaxed">* في حالة التفعيل، سيتم استخراج الضريبة من السعر الأساسي. في حالة التعطيل، ستتم إضافة النسبة فوق السعر.</p>
          </div>
        </Form>
      </Modal>

      <Modal open={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} title="حذف ضريبة" size="sm" footer={<LoadingButton onClick={handleDeleteConfirm} isPending={deleteTaxConfig.isPending} loadingText="جاري الحذف..." variant="danger" size="md">تأكيد الحذف</LoadingButton>}>
        <p className="text-sm font-bold text-gray-600">هل أنت متأكد من حذف هذه الضريبة؟</p>
      </Modal>
    </div>
  );
}
