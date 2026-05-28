import React, { useState, useEffect } from 'react';
import { 
  Settings, Bell, Shield, Database, Trash2, AlertTriangle, Plus, X, Save, 
  Activity, Cloud, Building2, Receipt, Boxes, Store, Palette, Lock, History, 
  Smartphone, Key, Download, RefreshCw, Upload, Eye, EyeOff, CheckCircle2, ChevronRight,
  Globe, Languages, CreditCard, Printer, FileText, SmartphoneIcon, Mail, Laptop, Users, LogIn
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { apiKeyManager } from '../lib/apiKeys';
import { sessionManager } from '../lib/session';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Tabs, WorkspaceLayout, shadow } from '../components/design-system';
import { BackupSettings } from '../components/settings/BackupSettings';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { ActivityLogSettings } from '../components/settings/ActivityLogSettings';
import { InvoiceSettings } from '../components/settings/InvoiceSettings';
import { EmployeeSettings } from '../components/settings/EmployeeSettings';
import { InventorySettings } from '../components/settings/InventorySettings';
import { NotificationSettings } from '../components/settings/NotificationSettings';
import { BranchSettings } from '../components/settings/BranchSettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { useSystemConfig, useUpdateSystemConfig } from '../hooks/useSystemConfig';
import { useEmployees, useCreateEmployee, useDeleteEmployee } from '../hooks/useEmployees';
import { useBranches, useCreateBranch, useDeleteBranch } from '../hooks/useBranches';
import { useActivityLogs } from '../hooks/useActivityLogs';
import api from '../lib/api-client';
import type { SystemConfig, Employee } from '../types';

type TabType = 'general' | 'security' | 'activity' | 'employees' | 'invoices' | 'inventory' | 'backup' | 'notifications' | 'branches' | 'appearance';

export default function SettingsPage({ activeTab: propTab }: { activeTab?: TabType }) {
  const [activeTab, setActiveTab] = useState<TabType>(propTab || 'general');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isBranchModalOpen, setBranchModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', department: 'الإدارة', email: '', baseSalary: 0, permissions: { addItems: true, deleteInvoices: false, editPrices: false, viewProfits: false, manageEmployees: false, approveReturns: false } });
  const [newBranch, setNewBranch] = useState({ name: '', location: '', phone: '', managerId: undefined });
  const [isUnitModalOpen, setUnitModalOpen] = useState(false);
  const [newUnit, setNewUnit] = useState('');
  const [units, setUnits] = useState(['قطعة', 'كرتونة', 'علبة', 'كجم', 'لتر', 'متر']);

  useEffect(() => {
  if (propTab) {
  setActiveTab(propTab);
  }
  }, [propTab]);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'all' | 'employee' | 'branch' | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);
  
  const { data: config } = useSystemConfig();
  const { data: employeesData } = useEmployees({ noPagination: 'true' });
  const { data: branchesData } = useBranches({ noPagination: 'true' });
  const { data: logsData } = useActivityLogs({ pageSize: 50 });
  
  const employees = employeesData?.items ?? [];
  const branches = branchesData?.items ?? [];
  const logs = logsData?.items ?? [];
  
  const updateConfig = useUpdateSystemConfig();
  const createEmployee = useCreateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const createBranch = useCreateBranch();
  const deleteBranch = useDeleteBranch();

  const [localConfig, setLocalConfig] = useState<Partial<SystemConfig>>({});

  useEffect(() => {
  if (config?.data) {
  setLocalConfig(config.data);
  }
  }, [config]);

  const handleSaveConfig = async () => {
  if (!localConfig.id) return;
  try {
  await updateConfig.mutateAsync(localConfig);
  document.documentElement.dataset.theme = localConfig.theme;
  toast.success('تم حفظ الإعدادات بنجاح');
  } catch (error) {
  console.error(error);
  toast.error('فشل حفظ الإعدادات');
  }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
  const reader = new FileReader();
  reader.onloadend = () => {
  setLocalConfig({ ...localConfig, logo: reader.result as string });
  };
  reader.readAsDataURL(file);
  }
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdatePassword = async () => {
  if (!currentPassword) {
  toast.error('يرجى إدخال كلمة المرور الحالية');
  return;
  }
  if (!newPassword || newPassword.length < 4) {
  toast.error('كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل');
  return;
  }
  if (newPassword !== confirmPassword) {
  toast.error('كلمة المرور الجديدة وتأكيدها غير متطابقين');
  return;
  }

  try {
  await api('/auth/change-password', {
  method: 'PUT',
  body: JSON.stringify({ currentPassword, newPassword }),
  });

  setCurrentPassword('');
  setNewPassword('');
  setConfirmPassword('');
  toast.success('تم تحديث كلمة المرور بنجاح');
  } catch (err) {
  console.error(err);
  toast.error('فشل تحديث كلمة المرور');
  }
  };

  const handleExportLogs = () => {
  if (!logs) return;
  const headers = ['المستخدم', 'العملية', 'البيان', 'الوقت'];
  const rows = logs.map((l: { username: string; action: string; details: string; timestamp: number }) => [l.username, l.action, l.details, formatDate(l.timestamp)]);
  const csvContent ="\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `activity_logs_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  };

  const handleClearAllData = async () => {
  try {
  localStorage.setItem('disableSeeding', 'true');
  await api('/system/reset', { method: 'POST' });
  
  sessionManager.destroy();
  
  toast.success('تم تصفير النظام بنجاح. سيتم إعادة تشغيل المنصة الآن.');
  setTimeout(() => { window.location.href = '/'; }, 1500);
  } catch (error) {
  console.error('Reset error:', error);
  toast.error('حدث خطأ أثناء تصفير النظام. يرجى المحاولة مرة أخرى.');
  }
  };

  const executeDelete = async () => {
  if (deleteType === 'all') {
  await handleClearAllData();
  } else if (deleteType === ('transactions' as any)) {
  try {
  await api('/system/reset-transactions', { method: 'POST' });
  toast.success('تم حذف البيانات التشغيلية بنجاح. يمكنك الآن البدء من جديد.');
  setTimeout(() => window.location.reload(), 1500);
  } catch (err) {
  toast.error('حدث خطأ أثناء حذف البيانات');
  }
  } else if (deleteType === 'employee' && targetId) {
  await deleteEmployee.mutateAsync({ id: targetId, reason: 'حذف موظف' });
  setDeleteModalOpen(false);
  } else if (deleteType === 'branch' && targetId) {
  await deleteBranch.mutateAsync({ id: targetId, reason: 'حذف فرع' });
  setDeleteModalOpen(false);
  }
  setDeleteType(null);
  setTargetId(null);
  };

  const handleConfirmDelete = (type: 'all' | 'employee' | 'branch', id?: number) => {
  setDeleteType(type);
  if (id) setTargetId(id);
  setDeleteModalOpen(true);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
  await createEmployee.mutateAsync({
  name: newEmployee.name,
  role: newEmployee.role,
  department: newEmployee.department,
  email: newEmployee.email,
  permissions: newEmployee.permissions,
  branchId: 1,
  });
  setModalOpen(false);
  setNewEmployee({ name: '', role: '', department: 'الإدارة', email: '', baseSalary: 0, permissions: { addItems: true, deleteInvoices: false, editPrices: false, viewProfits: false, manageEmployees: false, approveReturns: false } });
  } catch (error) {
  console.error(error);
  toast.error('فشل إضافة الموظف');
  }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
  await createBranch.mutateAsync({
  ...newBranch,
  createdAt: Date.now(),
  });
  setBranchModalOpen(false);
  setNewBranch({ name: '', location: '', phone: '', managerId: undefined });
  } catch (error) {
  console.error(error);
  }
  };

  const tabs = [
  { id: 'general', label: 'إعدادات الشركة والهوية', icon: Building2 },
  { id: 'security', label: 'الأمان والخصوصية', icon: Shield },
  { id: 'activity', label: 'سجل النشاطات', icon: Activity },
  { id: 'employees', label: 'الموظفين والصلاحيات', icon: Users },
  { id: 'invoices', label: 'الفواتير والطباعة', icon: Receipt },
  { id: 'inventory', label: 'إعدادات المخزون', icon: Boxes },
  { id: 'backup', label: 'النسخ الاحتياطي', icon: Cloud },
  { id: 'notifications', label: 'الإشعارات', icon: Bell },
  { id: 'branches', label: 'إدارة الفروع', icon: Store },
  { id: 'appearance', label: 'المظهر والواجهة', icon: Palette },
  ];

  return (
  <WorkspaceLayout maxWidth="xl">
  <WorkspaceLayout.Header
  icon={Settings}
  title="إعدادات النظام المتقدمة"
  subtitle="تحكم كامل في كافة جوانب المنصة والتقارير"
  actions={
  <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded text-[10px] font-medium shrink-0">
  بصفتك المسئول الرئيسي
  </span>
  }
  />

  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
  {[
  { label: 'إجمالي الموظفين', value: employees?.length || 0, icon: Users },
  { label: 'الفروع النشطة', value: branches?.length || 0, icon: Store },
  { label: 'سجل النشاطات', value: logs?.length || 0, icon: Activity },
  { label: 'وحدات القياس', value: units.length, icon: Boxes },
  ].map((stat, i) => (
  <div key={i} className="bg-white p-4 rounded-xl border border-[#E0E3E5] flex items-center gap-4">
  <div className="p-2 rounded-lg bg-gray-50 text-gray-500">
  <stat.icon className="w-5 h-5" />
  </div>
  <div>
  <p className="text-[#44474D] text-[12px]">{stat.label}</p>
  <h4 className="text-xl font-bold text-black">{stat.value}</h4>
  </div>
  </div>
  ))}
  </div>

  <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabType)} variant="pills" />

  <div className="flex flex-col lg:flex-row gap-10">
  <div className="flex-1 min-h-[700px]">
  <motion.div
  key={activeTab}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
  >
  {activeTab === 'general' && (
  <GeneralSettings
  config={config?.data}
  localConfig={localConfig}
  setLocalConfig={setLocalConfig}
  handleSaveConfig={handleSaveConfig}
  onLogoUpload={handleLogoUpload}
  />
  )}
  {activeTab === 'security' && (
  <SecuritySettings
  config={config?.data}
  logs={logs}
  currentPassword={currentPassword}
  newPassword={newPassword}
  confirmPassword={confirmPassword}
  setCurrentPassword={setCurrentPassword}
  setNewPassword={setNewPassword}
  setConfirmPassword={setConfirmPassword}
  handleUpdatePassword={handleUpdatePassword}
  />
  )}
  {activeTab === 'activity' && (
  <ActivityLogSettings
  activityLog={logs}
  onExport={handleExportLogs}
  />
  )}
  {activeTab === 'backup' && (
  <BackupSettings
  onDeleteTransactions={() => { setDeleteType('transactions' as any); setDeleteModalOpen(true); }}
  onDeleteAll={() => { setDeleteType('all'); setDeleteModalOpen(true); }}
  />
  )}
  {activeTab === 'invoices' && (
  <InvoiceSettings
  config={config?.data}
  localConfig={localConfig}
  setLocalConfig={setLocalConfig}
  handleSaveConfig={handleSaveConfig}
  />
  )}
  {activeTab === 'employees' && (
  <EmployeeSettings
  employees={employees}
  onAddEmployee={() => setModalOpen(true)}
  onConfirmDelete={handleConfirmDelete}
  />
  )}
  {activeTab === 'inventory' && (
  <InventorySettings
  config={config?.data}
  localConfig={localConfig}
  setLocalConfig={setLocalConfig}
  handleSaveConfig={handleSaveConfig}
  units={units}
  setUnits={setUnits}
  onOpenUnitModal={() => setUnitModalOpen(true)}
  />
  )}
  {activeTab === 'notifications' && (
  <NotificationSettings
  config={config?.data}
  localConfig={localConfig}
  setLocalConfig={setLocalConfig}
  handleSaveConfig={handleSaveConfig}
  />
  )}
  {activeTab === 'branches' && (
  <BranchSettings
  branches={branches}
  employees={employees}
  onAddBranch={() => setBranchModalOpen(true)}
  />
  )}
  {activeTab === 'appearance' && (
  <AppearanceSettings
  localConfig={localConfig}
  setLocalConfig={setLocalConfig}
  handleSaveConfig={handleSaveConfig}
  />
  )}
  </motion.div>
  </div>
  </div>

  <AnimatePresence>
  {isModalOpen && (
  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50">
  <motion.div
  initial={{ opacity: 0, scale: 0.95, y: 10 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: 10 }}
  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
  className={`bg-white rounded-3xl w-full max-w-lg ${shadow.modal} overflow-hidden`}
  >
  <div className="px-8 pt-8 pb-4 border-b border-gray-50 flex justify-between items-center">
  <h3 className="text-xl font-bold">إضافة موظف جديد</h3>
  <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
  </div>
  <form onSubmit={handleAddEmployee} className="p-6 space-y-5">
  <div className="space-y-4">
  <div className="space-y-1.5">
  <label className="text-xs font-bold text-gray-500">اسم الموظف</label>
  <input
  required
  type="text"
  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none border-2 border-transparent focus:border-black focus:bg-white transition-all"
  value={newEmployee.name}
  onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
  />
  </div>
  <div className="grid grid-cols-2 gap-4">
  <div className="space-y-1.5">
  <label className="text-xs font-bold text-gray-500">المسمى الوظيفي</label>
  <input
  required
  type="text"
  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none border-2 border-transparent focus:border-black focus:bg-white transition-all"
  value={newEmployee.role}
  onChange={e => setNewEmployee({...newEmployee, role: e.target.value})}
  />
  </div>
  <div className="space-y-1.5">
  <label className="text-xs font-bold text-gray-500">القسم</label>
  <select
  required
  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none border-2 border-transparent focus:border-black focus:bg-white transition-all"
  value={newEmployee.department}
  onChange={e => setNewEmployee({...newEmployee, department: e.target.value})}
  >
  <option value="الإدارة">الإدارة</option>
  <option value="الحسابات">الحسابات</option>
  <option value="المستودعات">المستودعات</option>
  <option value="المبيعات">المبيعات</option>
  <option value="التوصيل">التوصيل</option>
  </select>
  </div>
  <div className="space-y-1.5">
  <label className="text-xs font-bold text-gray-500">البريد الإلكتروني</label>
  <input
  required
  type="email"
  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none border-2 border-transparent focus:border-black focus:bg-white transition-all"
  value={newEmployee.email}
  onChange={e => setNewEmployee({...newEmployee, email: e.target.value})}
  />
  </div>
  </div>
  <div className="space-y-1.5">
  <label className="text-xs font-bold text-gray-500">الراتب الأساسي (ج.م)</label>
  <input
  required
  type="number"
  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none border-2 border-transparent focus:border-black focus:bg-white transition-all"
  value={newEmployee.baseSalary || ''}
  onChange={e => setNewEmployee({...newEmployee, baseSalary: parseFloat(e.target.value) || 0})}
  />
  </div>
  <div className="space-y-3 pt-2">
  <span className="text-xs font-bold text-gray-600">صلاحيات الموظف</span>
  <div className="grid grid-cols-2 gap-3">
  {(Object.keys(newEmployee.permissions) as (keyof typeof newEmployee.permissions)[]).map(pKey => (
  <label key={pKey} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
  <input
  type="checkbox"
  className="w-4 h-4 accent-black rounded"
  checked={newEmployee.permissions[pKey]}
  onChange={e => setNewEmployee({
  ...newEmployee,
  permissions: { ...newEmployee.permissions, [pKey]: e.target.checked }
  })}
  />
  <span className="text-[11px] font-bold">
  {pKey === 'addItems' ? 'إضافة أصناف' :
  pKey === 'deleteInvoices' ? 'حذف فواتير' :
  pKey === 'editPrices' ? 'تعديل أسعار' :
  pKey === 'viewProfits' ? 'رؤية الأرباح' :
  pKey === 'manageEmployees' ? 'إدارة الموظفين' : 'مرتجعات'}
  </span>
  </label>
  ))}
  </div>
  </div>
  </div>
  <div className="flex gap-3 pt-2">
  <button type="submit" className="flex-1 bg-black text-white py-3.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-all">حفظ بيانات الموظف</button>
  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-200 active:scale-[0.98] transition-all">إلغاء</button>
  </div>
  </form>
  </motion.div>
  </div>
  )}
  </AnimatePresence>

  <AnimatePresence>
  {isDeleteModalOpen && (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60">
  <motion.div
  initial={{ opacity: 0, scale: 0.95, y: 10 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: 10 }}
  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
  className={`bg-white rounded-3xl w-full max-w-sm ${shadow.modal} overflow-hidden p-6 text-center`}
  >
  <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-1 ring-rose-200/50">
  <AlertTriangle className="w-8 h-8" />
  </div>
  <h3 className="text-xl font-bold text-black mb-2">
  {deleteType === 'all' ? 'حذف شامل لكل شيء؟' : 'تأكيد الحذف'}
  </h3>
  <p className="text-gray-500 text-sm font-bold mb-8 leading-relaxed">
  {deleteType === 'all'
  ? 'هل أنت متأكد تماماً من تصفير النظام؟ سيتم مسح المناديب، العملاء، الفواتير وكأنك تبدأ من الصفر.'
  : deleteType === ('transactions' as any)
  ? 'سيتم حذف كافة الفواتير، المصروفات، وحركات المخزون، مع الإبقاء على العملاء والموردين والمناديب. هل أنت متأكد؟'
  : 'هل أنت متأكد من حذف هذا السجل نهائياً من قاعدة البيانات؟'}
  </p>

  <div className="space-y-3">
  <button
  onClick={executeDelete}
  className="w-full bg-rose-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-rose-700 active:scale-[0.98] transition-all"
  >
  {deleteType === 'all' ? 'نعم، احذف كل شيء' : 'نعم، قم بالحذف'}
  </button>
  <button
  onClick={() => {
  setDeleteModalOpen(false);
  setDeleteType(null);
  }}
  className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-200 active:scale-[0.98] transition-all"
  >
  تراجع، لا تحذف
  </button>
  </div>
  </motion.div>
  </div>
  )}
  </AnimatePresence>
  </WorkspaceLayout>
  );
}
