import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api-client';

interface VehicleAddModalProps {
  open: boolean;
  onClose: () => void;
}

const defaultVehicle = { name: '', plateNumber: '', purchaseDate: Date.now(), purchaseValue: 0, licenseExpiry: Date.now() + 31536000000, status: 'active' };

export function VehicleAddModal({ open, onClose }: VehicleAddModalProps) {
  const [form, setForm] = useState(defaultVehicle);
  useEffect(() => { if (!open) setForm(defaultVehicle); }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.plateNumber) return;
    try {
      await api('/accounting/vehicles', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, plateNumber: form.plateNumber }),
      });
      toast.success('تم إضافة السيارة بنجاح');
      onClose();
    } catch { toast.error('فشل إضافة السيارة'); }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            <h3 className="text-xl font-black mb-6">إضافة سيارة جديدة للاسطول</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400">نوع السيارة / البراند</label>
                <input required type="text" className="w-full bg-gray-100 rounded-xl py-2 px-3 font-bold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400">رقم اللوحة</label>
                <input required type="text" className="w-full bg-gray-100 rounded-xl py-2 px-3 font-bold" value={form.plateNumber} onChange={e => setForm({ ...form, plateNumber: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400">قيمة الشراء (ج.م)</label>
                  <input required type="number" className="w-full bg-gray-100 rounded-xl py-2 px-3 font-bold" value={form.purchaseValue || ''} onChange={e => setForm({ ...form, purchaseValue: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400">انتهاء الرخصة</label>
                  <input required type="date" className="w-full bg-gray-100 rounded-xl py-2 px-3 font-bold" onChange={e => setForm({ ...form, licenseExpiry: new Date(e.target.value).getTime() })} />
                </div>
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-black mt-4">حفظ بيانات السيارة</button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
