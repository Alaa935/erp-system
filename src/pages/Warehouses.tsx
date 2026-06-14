import React, { useState } from 'react';
import { Warehouse, MapPin, Package, Plus, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { WorkspaceLayout, EmptyState, Modal, Form, FormInput, FormActions } from '../components/design-system';
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '../hooks/useWarehouses';
import { LoadingButton } from '../components/ui/LoadingButton';

export default function Warehouses({ setActivePage }: { setActivePage?: (page: string) => void }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteReasonModalOpen, setDeleteReasonModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [newWarehouse, setNewWarehouse] = useState<any>({ name: '', location: '', manager: '', capacity: 1000 });

  const { data: warehousesData } = useWarehouses();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();

  const warehouses = warehousesData?.data || [];

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouse.name) return;
    if (editingWarehouse) {
      await updateWarehouse.mutateAsync({ id: editingWarehouse.id, data: newWarehouse });
    } else {
      await createWarehouse.mutateAsync(newWarehouse);
    }
    setModalOpen(false);
    setEditingWarehouse(null);
    setNewWarehouse({ name: '', location: '', manager: '', capacity: 1000 });
  };

  const handleEdit = (w: any) => {
    setEditingWarehouse(w);
    setNewWarehouse({ name: w.name, location: w.location, manager: w.manager, capacity: w.capacity });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (warehouseToDelete === null || !deleteReason) return;
    try {
      await deleteWarehouse.mutateAsync({ id: warehouseToDelete, reason: deleteReason });
      setDeleteReasonModalOpen(false);
      setWarehouseToDelete(null);
      setDeleteReason('');
    } catch (error) { console.error('Delete error:', error); }
  };

  const confirmDelete = (id: number) => { setWarehouseToDelete(id); setDeleteReasonModalOpen(true); };

  return (
    <WorkspaceLayout maxWidth="xl">
      <WorkspaceLayout.Header icon={Warehouse} title="المخازن والفروع" subtitle="إدارة المواقع الجغرافية وسعة التخزين" actions={<button onClick={() => setModalOpen(true)} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"><Plus className="w-3.5 h-3.5" /> إضافة فرع جديد</button>} />
      {!warehouses || warehouses.length === 0 ? (
        <EmptyState icon={Warehouse} title="لا توجد مخازن أو فروع" description="لم يتم إضافة أي مخازن بعد. أضف أول مخزن لبدء تنظيم المخزون." action={<button onClick={() => setModalOpen(true)} className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold">إضافة مخزن جديد</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((branch: any) => {
            const itemCount = branch.itemCount || 0;
            const occupancy = Math.min(Math.round((itemCount / 50) * 100), 100);
            return (
              <div key={branch.id} className="glass-card overflow-hidden flex flex-col group">
                <div className="p-6 border-b border-[#E0E3E5] flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#B9C7E4] p-3 rounded-xl text-black"><Warehouse className="w-6 h-6" /></div>
                    <div><h3 className="text-lg font-bold text-black">{branch.name}</h3><div className="flex items-center gap-1 text-[#44474D] text-xs mt-1"><MapPin className="w-3 h-3" /><span>{branch.location}</span></div></div>
                  </div>
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(branch)} className="p-1.5 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4 text-[#44474D]" /></button>
                    <button onClick={() => branch.id !== undefined && confirmDelete(branch.id)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </div>
                <div className="p-6 space-y-4 bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><p className="text-[10px] text-[#44474D] uppercase font-bold">مدير الفرع</p><p className="text-sm font-bold">{branch.manager}</p></div>
                    <div className="space-y-1"><p className="text-[10px] text-[#44474D] uppercase font-bold">نسبة الإشغال</p><p className={cn("text-sm font-bold", occupancy > 90 ? "text-red-600" : "text-blue-600")}>{occupancy}%</p></div>
                  </div>
                  <div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2 text-[#44474D]"><Package className="w-4 h-4" /><span>الأصناف المسجلة بهذا الموقع</span></div><span className="font-bold">{itemCount} صنف</span></div>
                </div>
                <div className="mt-auto p-4 bg-white border-t border-[#E0E3E5]">
                  <button onClick={() => setActivePage?.('inventory')} className="w-full py-2 text-black text-sm font-bold border border-[#E0E3E5] rounded-lg hover:bg-gray-50 transition-colors">عرض تفاصيل التخزين</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={isModalOpen} onClose={() => { setModalOpen(false); setEditingWarehouse(null); }} title={editingWarehouse ? 'تعديل بيانات المخزن' : 'إضافة مخزن جديد'} subtitle="يرجى تعبئة كافة التفاصيل بدقة" titleIcon={<Warehouse className="text-white w-6 h-6" />} size="xl" footer={<FormActions primaryLabel="حفظ البيانات" secondaryLabel="إلغاء" onSecondary={() => { setModalOpen(false); setEditingWarehouse(null); }} loading={createWarehouse.isPending || updateWarehouse.isPending} />}>
        <Form onSubmit={handleSaveWarehouse} autoFocusFirst>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="اسم المخزن/الفرع" type="text" value={newWarehouse.name} onChange={(e) => setNewWarehouse({...newWarehouse, name: e.target.value})} required />
            <FormInput label="الموقع الجغرافي" type="text" value={newWarehouse.location} onChange={(e) => setNewWarehouse({...newWarehouse, location: e.target.value})} required />
            <FormInput label="مدير المستودع" type="text" value={newWarehouse.manager} onChange={(e) => setNewWarehouse({...newWarehouse, manager: e.target.value})} required />
            <FormInput label="السعة القصوى (وحدات)" type="number" value={isNaN(newWarehouse.capacity || 0) ? '' : newWarehouse.capacity} onChange={(e) => setNewWarehouse({...newWarehouse, capacity: parseInt(e.target.value) || 0})} required />
          </div>
        </Form>
      </Modal>

      <Modal open={deleteReasonModalOpen} onClose={() => { setDeleteReasonModalOpen(false); setWarehouseToDelete(null); setDeleteReason(''); }} title="حذف مخزن نهائياً" subtitle="سيتم إزالة كافة سجلات هذا المخزن من النظام" titleIcon={<Trash2 className="text-white w-6 h-6" />} size="md" footer={<form onSubmit={(e) => { e.preventDefault(); handleDelete(); }}><FormActions primaryLabel="تأكيد الحذف" secondaryLabel="تراجع" onSecondary={() => { setDeleteReasonModalOpen(false); setWarehouseToDelete(null); setDeleteReason(''); }} loading={deleteWarehouse.isPending} /></form>}>
        <div className="space-y-4">
          <label className="text-sm font-bold text-black">ما سبب حذف هذا المخزن؟</label>
          <div className="grid grid-cols-1 gap-2">
            {['إغلاق الفرع', 'تغيير الموقع', 'خطأ في البيانات', 'دمج مخازن', 'أخرى'].map((reason) => (
              <button key={reason} onClick={() => setDeleteReason(reason)} className={cn("w-full text-right px-4 py-3 rounded-xl text-sm font-bold border transition-all", deleteReason === reason ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-600 border-gray-200 hover:border-red-500")}>{reason}</button>
            ))}
          </div>
        </div>
      </Modal>
    </WorkspaceLayout>
  );
}
