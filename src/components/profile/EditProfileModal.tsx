import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, MapPin, Phone, Percent, Building2, AlertCircle, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api-client';
import { sessionManager } from '../../lib/session';
import { toast } from 'sonner';
import type { UserAccount, SalesRep, Branch } from '../../types';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  salesRep?: SalesRep | null;
  onSaved: (updatedUser: UserAccount) => void;
}

const roleLabels: Record<string, string> = {
  admin: 'مدير النظام',
  manager: 'مدير',
  rep: 'مندوب مبيعات',
};

export function EditProfileModal({ open, onClose, currentUser, salesRep, onSaved }: EditProfileModalProps) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState(currentUser.username);
  const [displayName, setDisplayName] = useState(salesRep?.name || currentUser.username);
  const [phone, setPhone] = useState(salesRep?.phone || '');
  const [zone, setZone] = useState(salesRep?.zone || '');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [usernameError, setUsernameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({ username: false, phone: false });

  useEffect(() => {
    if (open) {
      setUsername(currentUser.username);
      setDisplayName(salesRep?.name || currentUser.username);
      setPhone(salesRep?.phone || '');
      setZone(salesRep?.zone || '');
      setUsernameError('');
      setPhoneError('');
      setSaving(false);
      setTouched({ username: false, phone: false });
      if (currentUser.role !== 'rep') {
        api<any>('/branches?noPagination=true').then(res => setBranches(res?.items || [])).catch(() => {});
      }
    }
  }, [open, currentUser, salesRep]);

  const validateUsername = async (val: string) => {
    if (!val.trim()) { setUsernameError('اسم المستخدم مطلوب'); return false; }
    if (val.trim().length < 3) { setUsernameError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل'); return false; }
    if (val.trim() === currentUser.username) { setUsernameError(''); return true; }
    try {
      const usersRes = await api<any>('/auth/users');
      const users = usersRes?.users || [];
      const existing = users.find((u: any) => u.username === val.trim());
      if (existing && existing.id !== currentUser.id) {
        setUsernameError('اسم المستخدم موجود بالفعل');
        return false;
      }
      setUsernameError('');
      return true;
    } catch { setUsernameError(''); return true; }
  };

  const validatePhone = (val: string) => {
    if (currentUser.role !== 'rep') { setPhoneError(''); return true; }
    if (!val.trim()) { setPhoneError('رقم الهاتف مطلوب للمندوبين'); return false; }
    if (!/^01[0-9]{9}$/.test(val.trim())) { setPhoneError('رقم الهاتف غير صالح'); return false; }
    setPhoneError('');
    return true;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSave = async () => {
    setTouched({ username: true, phone: true });
    const isUsernameValid = await validateUsername(username);
    const isPhoneValid = validatePhone(phone);
    if (!isUsernameValid || !isPhoneValid) return;

    setSaving(true);
    try {
      const trimmedUsername = username.trim();

      if (currentUser.role === 'rep' && currentUser.repId) {
        const updateData: Partial<SalesRep> = {
          name: displayName.trim(),
          phone: phone.trim(),
          zone: zone.trim(),
        };
        await api(`/sales-reps/${currentUser.repId}`, { method: 'PUT', body: JSON.stringify(updateData) });
        await queryClient.invalidateQueries({ queryKey: ['salesReps'], refetchType: 'all' });
        await queryClient.invalidateQueries({ queryKey: ['salesReps', currentUser.repId] });
      }

      sessionManager.destroy();
      const updatedUser: UserAccount = {
        id: currentUser.id,
        username: trimmedUsername,
        role: currentUser.role,
        repId: currentUser.repId,
      };
      sessionManager.create(updatedUser);

      toast.success('تم تحديث الحساب بنجاح');
      onSaved(updatedUser);
      onClose();
    } catch (err) {
      toast.error('حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const isRep = currentUser.role === 'rep';
  const canSave = !saving && !usernameError && username.trim().length >= 3;

  return (
    <AnimatePresence>
      {open && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className='relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col'
            dir='rtl'
          >
            <div className='p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0'>
              <div>
                <h3 className='text-xl font-bold text-black'>تعديل الحساب</h3>
                <p className='text-[12px] text-gray-500'>{roleLabels[currentUser.role] || currentUser.role}</p>
              </div>
              <button onClick={onClose} type='button' className='p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0 mr-4'>
                <X className='w-5 h-5 text-gray-600' />
              </button>
            </div>

            <div className='flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar'>
              <div className='flex items-center gap-4 pb-4 border-b border-gray-50'>
                <div className='w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center border-2 border-gray-200'>
                  <User className='w-8 h-8 text-gray-400' />
                </div>
                <div>
                  <p className='text-sm font-bold text-black'>{displayName || username}</p>
                  <p className='text-[11px] text-gray-400'>{roleLabels[currentUser.role] || currentUser.role}</p>
                </div>
              </div>

              <div>
                <label className='text-xs font-bold text-gray-500 block mb-1.5'>اسم المستخدم</label>
                <input
                  type='text'
                  value={username}
                  onChange={e => { setUsername(e.target.value); if (touched.username) validateUsername(e.target.value); }}
                  onBlur={() => { handleBlur('username'); validateUsername(username); }}
                  className={'w-full bg-gray-50 border-2 rounded-xl py-3 px-4 text-sm font-medium outline-none transition-all ' + (usernameError && touched.username ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-black focus:bg-white')}
                  placeholder='اسم المستخدم'
                />
                {touched.username && usernameError && (
                  <p className='text-[11px] text-red-500 mt-1 flex items-center gap-1'>
                    <AlertCircle className='w-3 h-3' />
                    {usernameError}
                  </p>
                )}
              </div>

              <div>
                <label className='text-xs font-bold text-gray-500 block mb-1.5'>
                  {isRep ? 'الاسم الكامل' : 'الاسم المعروض'}
                </label>
                <input
                  type='text'
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className='w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-black focus:bg-white transition-all'
                  placeholder={isRep ? 'الاسم الكامل' : 'الاسم المعروض'}
                />
              </div>

              {isRep && (
                <div>
                  <label className='text-xs font-bold text-gray-500 block mb-1.5'>رقم الهاتف</label>
                  <input
                    type='tel'
                    value={phone}
                    onChange={e => { setPhone(e.target.value); if (touched.phone) validatePhone(e.target.value); }}
                    onBlur={() => { handleBlur('phone'); validatePhone(phone); }}
                    className={'w-full bg-gray-50 border-2 rounded-xl py-3 px-4 text-sm font-medium outline-none transition-all ' + (phoneError && touched.phone ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-black focus:bg-white')}
                    placeholder='رقم الهاتف'
                  />
                  {touched.phone && phoneError && (
                    <p className='text-[11px] text-red-500 mt-1 flex items-center gap-1'>
                      <AlertCircle className='w-3 h-3' />
                      {phoneError}
                    </p>
                  )}
                </div>
              )}

              {isRep && (
                <div>
                  <label className='text-xs font-bold text-gray-500 block mb-1.5'>منطقة التغطية</label>
                  <input
                    type='text'
                    value={zone}
                    onChange={e => setZone(e.target.value)}
                    className='w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-black focus:bg-white transition-all'
                    placeholder='منطقة التغطية'
                  />
                </div>
              )}

              {isRep && salesRep && (
                <div>
                  <label className='text-xs font-bold text-gray-500 block mb-1.5'>نسبة العمولة</label>
                  <div className='w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 flex items-center gap-2'>
                    <Percent className='w-4 h-4 text-gray-400' />
                    {salesRep.commissionRate}%
                    <span className='text-[10px] text-gray-400 mr-auto'>للعلم فقط</span>
                  </div>
                </div>
              )}

              {!isRep && (
                <div>
                  <label className='text-xs font-bold text-gray-500 block mb-1.5'>الفرع</label>
                  <select
                    value={''}
                    onChange={() => {}}
                    className='w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-black focus:bg-white transition-all'
                  >
                    <option value=''>— اختار الفرع —</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className='p-6 border-t border-gray-100 bg-gray-50/50 shrink-0'>
              <div className='flex items-center gap-3'>
                <button
                  onClick={handleSave}
                  disabled={!canSave}
                  className='flex-1 flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed'
                >
                  <Save className='w-4 h-4' />
                  {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
                <button
                  onClick={onClose}
                  disabled={saving}
                  className='px-6 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-40'
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
