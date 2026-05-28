import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  MapPin, 
  Plus, 
  ArrowRightLeft, 
  Search, 
  UserPlus, 
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  FileText,
  XCircle,
  MoreVertical,
  ShoppingCart,
  DollarSign
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api-client';
import { useSalesReps, useCreateSalesRep, useDeleteSalesRep } from '../hooks/useSalesReps';
import { useInventory } from '../hooks/useInventory';
import { useCustomers } from '../hooks/useCustomers';
import { useStockTransfers, useCreateStockTransfer } from '../hooks/useStockTransfers';
import { useStockRequests, useUpdateStockRequest } from '../hooks/useStockRequests';
import { useConfirmCollection } from '../hooks/useAccounting';
import { useCreateNotification } from '../hooks/useNotifications';
import type { SalesRep } from '../types';
import { cn, formatDate } from '../lib/utils';
import { toast } from 'sonner';

export default function SalesRepManagement() {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedRepForDetail, setSelectedRepForDetail] = useState<SalesRep | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteReasonModalOpen, setDeleteReasonModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [repToDelete, setRepToDelete] = useState<number | null>(null);
  const [transferDetailsModalOpen, setTransferDetailsModalOpen] = useState(false);
  const [selectedTransferForDetails, setSelectedTransferForDetails] = useState<any>(null);

  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'payments'>('stock');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data: repsData } = useSalesReps();
  const reps = repsData?.items;

  const { data: itemsData } = useInventory({ pageSize: '10000' } as any);
  const items = itemsData?.items;

  const { data: transfersData } = useStockTransfers();
  const transfers = transfersData?.items;

  const { data: requestsData } = useStockRequests();
  const stockRequests = requestsData?.items;

  const { data: collectionsData } = useQuery({
    queryKey: ['paymentCollections'],
    queryFn: () => api<any>('/payment-collections'),
  });
  const collections = collectionsData?.items;

  const { data: customersData } = useCustomers();
  const customers = customersData?.items;

  const { data: dailyStats } = useQuery({
    queryKey: ['dailyStats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();

      const [salesRes, repsRes] = await Promise.all([
        api<any>('/sales-orders', { params: { pageSize: '10000' } }),
        api<any>('/sales-reps'),
      ]);

      const salesToday = (salesRes.orders || []).filter((s: any) => s.date >= todayTime);
      const totalSalesToday = salesToday.reduce((sum: number, s: any) => sum + s.totalAmount, 0);

      const allReps = repsRes.items || [];
      const totalTargets = allReps.reduce((sum: number, r: any) => sum + r.target, 1);
      const totalCurrentSales = allReps.reduce((sum: number, r: any) => sum + r.currentSales, 0);
      const avgPerformance = Math.round((totalCurrentSales / totalTargets) * 100);

      return { totalSalesToday, avgPerformance };
    },
    staleTime: 30_000,
  });

  const { data: repDetailData } = useQuery({
    queryKey: ['repDetail', selectedRepForDetail?.id],
    queryFn: async () => {
      if (!selectedRepForDetail?.id) return null;

      const [invRes, salesRes, transfersRes, allItemsRes] = await Promise.all([
        api<any>(`/sales-reps/${selectedRepForDetail.id}/inventory`),
        api<any>('/sales-orders', { params: { repId: String(selectedRepForDetail.id) } }),
        api<any>('/stock-transfers', { params: { toType: 'rep', toId: String(selectedRepForDetail.id) } }),
        api<any>('/inventory', { params: { pageSize: '10000' } }),
      ]);

      const inventory = invRes.items || [];
      const sales = salesRes.orders || [];
      const transfersToRep = transfersRes.items || [];
      const allItems = allItemsRes.items || [];

      const invValue = inventory.reduce((sum: number, inv: any) => {
        const item = allItems.find((i: any) => i.id === inv.itemId);
        return sum + (inv.quantity * (item?.purchasePrice || 0));
      }, 0);
      const unsettledCash = sales
        .filter((o: any) => o.paidAmount > 0 && !o.isSettledWithWarehouse && o.status !== 'cancelled' && o.status !== 'pending')
        .reduce((sum: number, o: any) => sum + ((o.paidAmount || 0) - (o.settledAmount || 0)), 0);
      const receivables = sales
        .filter((o: any) => o.paymentStatus !== 'paid' && o.status !== 'cancelled' && o.status !== 'pending')
        .reduce((sum: number, o: any) => sum + (o.totalAmount - (o.paidAmount || 0)), 0);

      return { inventory, sales, transfers: transfersToRep, invValue, unsettledCash, receivables };
    },
    enabled: !!selectedRepForDetail?.id,
  });

  const createRep = useCreateSalesRep();
  const deleteRep = useDeleteSalesRep();
  const createTransfer = useCreateStockTransfer();
  const updateStockRequest = useUpdateStockRequest();
  const confirmCollection = useConfirmCollection();
  const createNotification = useCreateNotification();

  const handleApproveRequest = async (requestId: number, updatedItems?: { itemId: number; quantity: number; sellingPrice?: number }[], modificationReason?: string) => {
    const request = stockRequests?.find((r: any) => r.id === requestId);
    if (!request || request.status !== 'pending') return;

    const finalItems = updatedItems || request.items;

    try {
      const transferNumber = `TR-REQ-${requestId}`;
      await createTransfer.mutateAsync({
        fromType: 'warehouse',
        fromId: 1,
        toType: 'rep',
        toId: request.repId,
        items: finalItems,
        transferNumber,
        status: 'completed',
        date: Date.now(),
        requestId,
      } as any);

      const updateData: any = { status: 'approved' };
      if (updatedItems) {
        updateData.items = finalItems;
      }
      await updateStockRequest.mutateAsync({ id: requestId, data: updateData });

      const rep = reps?.find((r: any) => r.id === request.repId);
      await api('/activity-logs', {
        method: 'POST',
        body: JSON.stringify({
          action: `موافقة على طلب توريد: ${rep?.name}`,
          userId: 'admin',
          username: 'المدير العام',
          entity: 'StockRequest',
          entityId: requestId,
          timestamp: Date.now(),
          details: modificationReason ? `تم تعديل الكميات. السبب: ${modificationReason}` : 'تمت الموافقة على الطلب كما هو'
        }),
      });

      await createNotification.mutateAsync({
        title: 'طلب توريد مقبول',
        message: `تم قبول طلب التوريد للمندوب ${rep?.name}. ${modificationReason ? ' (مع تعديلات)' : ''}`,
        type: 'success',
      });

      toast.success('تم اعتماد الطلب وتوريد البضاعة');
      if (expandedRequestId === requestId) setExpandedRequestId(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'فشل اعتماد الطلب');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await updateStockRequest.mutateAsync({ id: requestId, data: { status: 'rejected' } as any });
      toast.success('تم رفض الطلب');
    } catch (error: any) {
      toast.error(error.message || 'فشل رفض الطلب');
    }
  };

  const handleConfirmCollection = async (id: number) => {
    try {
      await confirmCollection.mutateAsync(id);
      toast.success('تم التأكيد بنجاح');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ');
    }
  };

  const handleRejectCollection = async (id: number) => {
    try {
      await api(`/payment-collections/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'rejected' }) });
      queryClient.invalidateQueries({ queryKey: ['paymentCollections'] });
      toast.success('تم الرفض');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ');
    }
  };

  const [newRep, setNewRep] = useState({
    name: '',
    phone: '',
    email: '',
    zone: '',
    target: 0,
    commissionRate: 5,
    username: '',
    password: '',
    confirmPassword: '',
    nationalId: ''
  });

  const [newTransfer, setNewTransfer] = useState({
    repId: 0,
    items: [] as { itemId: number; quantity: number; sellingPrice: number }[]
  });

  const handleAddRep = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setIsSubmitting(true);
    try {
      const errors: Record<string, string> = {};

      const cleanedPhone = newRep.phone.replace(/\s/g, '');
      if (!/^01[0-9]{9}$/.test(cleanedPhone)) {
        errors.phone = 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)';
      }

      const cleanedNationalId = newRep.nationalId.trim();
      if (!/^\d{14}$/.test(cleanedNationalId)) {
        errors.nationalId = 'الرقم القومي غير صحيح (يجب أن يكون 14 رقماً)';
      }

      const cleanUsername = newRep.username.trim().toLowerCase();
      if (!cleanUsername) {
        errors.username = 'اسم المستخدم مطلوب';
      } else if (cleanUsername.length < 3) {
        errors.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
      }

      if (!newRep.password) {
        errors.password = 'كلمة المرور مطلوبة';
      } else if (newRep.password.length < 6) {
        errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      }

      if (newRep.password !== newRep.confirmPassword) {
        errors.confirmPassword = 'كلمة المرور غير متطابقة';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setIsSubmitting(false);
        return;
      }

      const repResult = await createRep.mutateAsync({
        name: newRep.name,
        phone: cleanedPhone,
        email: newRep.email,
        zone: newRep.zone,
        target: newRep.target,
        commissionRate: newRep.commissionRate,
        currentSales: 0,
        createdAt: Date.now()
      });

      const repId = (repResult as any).id;

      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: cleanUsername,
          password: newRep.password,
          role: 'rep',
          repId,
          nationalId: cleanedNationalId
        }),
      });

      await api('/activity-logs', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'admin',
          username: 'المدير العام',
          action: `إضافة مندوب جديد: ${newRep.name}`,
          entity: 'SalesRep',
          entityId: repId,
          timestamp: Date.now(),
          details: `تم إنشاء حساب للمندوب ${newRep.name} مع صلاحيات مندوب مبيعات`
        }),
      });

      await createNotification.mutateAsync({
        title: 'تم إضافة مندوب جديد',
        message: `تم إضافة المندوب ${newRep.name} وإنشاء حساب دخول له`,
        type: 'success',
      });

      toast.success(`تم إضافة المندوب ${newRep.name} بنجاح`);
      setAddModalOpen(false);
      setNewRep({ name: '', phone: '', email: '', zone: '', target: 0, commissionRate: 5, username: '', password: '', confirmPassword: '', nationalId: '' });
    } catch (error: any) {
      toast.error(error?.message || 'حدث خطأ أثناء إضافة المندوب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteRep = (id: number) => {
    setRepToDelete(id);
    setDeleteReasonModalOpen(true);
  };

  const handleDeleteRep = async () => {
    if (!repToDelete || !deleteReason) {
      toast.error('يرجى تحديد سبب الحذف');
      return;
    }

    try {
      const rep = reps?.find((r: any) => r.id === repToDelete);

      await deleteRep.mutateAsync({ id: repToDelete, reason: deleteReason });

      await api('/activity-logs', {
        method: 'POST',
        body: JSON.stringify({
          action: `حذف مندوب: ${rep?.name}`,
          userId: 'admin',
          username: 'المدير العام',
          entity: 'SalesRep',
          entityId: repToDelete,
          timestamp: Date.now(),
          details: `سبب الحذف: ${deleteReason}`
        }),
      });

      await createNotification.mutateAsync({
        title: 'حذف مندوب',
        message: `تم إيقاف التعامل وحذف بيانات المندوب (${rep?.name})`,
        type: 'error',
      });

      setDeleteReasonModalOpen(false);
      setRepToDelete(null);
      setDeleteReason('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTransfer.items.length === 0 || !newTransfer.repId) return;

    try {
      const transferNumber = `TR-${Math.floor(Math.random() * 100000)}`;
      await createTransfer.mutateAsync({
        fromType: 'warehouse',
        fromId: 1,
        toType: 'rep',
        toId: newTransfer.repId,
        items: newTransfer.items,
        transferNumber,
        status: 'completed',
        date: Date.now(),
      } as any);

      toast.success('تم تحويل المخزون بنجاح');
      setTransferModalOpen(false);
      setNewTransfer({ repId: 0, items: [] });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'فشل التحويل');
    }
  };

  const addItemToTransfer = (itemId: number) => {
    const item = items?.find((i: any) => i.id === itemId);
    if (!item || newTransfer.items.find(i => i.itemId === itemId)) return;
    setNewTransfer({
      ...newTransfer,
      items: [...newTransfer.items, { itemId, quantity: 1, sellingPrice: item.sellingPrice }]
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المناديب', value: reps?.length || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'مبيعات المناديب اليوم', value: (dailyStats?.totalSalesToday || 0).toLocaleString() + ' ج.م', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'حوّلات قيد الانتظار', value: transfers?.filter((t: any) => t.status === 'pending').length || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'أداء المناديب', value: (dailyStats?.avgPerformance || 0) + '%', icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-[#E0E3E5] flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#44474D]">{stat.label}</p>
              <h3 className="text-xl font-black text-black">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E0E3E5]">
        <div className="flex gap-4">
          <button 
            onClick={() => setAddModalOpen(true)}
            className="bg-black text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-black transition-all"
          >
            <UserPlus className="w-4 h-4" />
            إضافة مندوب جديد
          </button>
          <button 
             onClick={() => setTransferModalOpen(true)}
             className="bg-white border border-[#E0E3E5] px-6 py-2.5 rounded-xl flex items-center gap-2 font-black hover:bg-[#F2F4F6] transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" />
            تحويل مخزون لمندوب
          </button>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474D]" />
          <input 
            type="text" 
            placeholder="بحث عن مندوب أو منطقة..."
            className="bg-[#F2F4F6] border-none rounded-xl py-2 pr-10 pl-4 w-64 outline-none focus:ring-1 focus:ring-black transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests Management Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="font-black text-black flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              إدارة الطلبات الواردة من المناديب
            </h3>
            <div className="bg-white p-1 rounded-xl border border-gray-200 flex gap-1">
              <button 
                onClick={() => setActiveSubTab('stock')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2",
                  activeSubTab === 'stock' ? "bg-black text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                طلبات البضاعة (In)
                {stockRequests?.filter((r: any) => r.status === 'pending').length ? (
                  <span className="bg-orange-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">
                    {stockRequests.filter((r: any) => r.status === 'pending').length}
                  </span>
                ) : null}
              </button>
              <button 
                onClick={() => setActiveSubTab('payments')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2",
                  activeSubTab === 'payments' ? "bg-black text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                طلبات تسليم الأموال (Out)
                {collections?.filter((c: any) => c.status === 'pending').length ? (
                  <span className="bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">
                    {collections.filter((c: any) => c.status === 'pending').length}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          <div className="divide-y min-h-[200px]">
            {activeSubTab === 'stock' ? (
              stockRequests?.filter((r: any) => r.status === 'pending').map((req: any) => {
                const rep = reps?.find((r: any) => r.id === req.repId);
                const isExpanded = expandedRequestId === req.id;

                return (
                  <div key={req.id} className="bg-white border-b last:border-b-0">
                    <div 
                      className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedRequestId(isExpanded ? null : req.id!)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center font-bold">
                          {rep?.name?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-black text-sm">{rep?.name}</p>
                          <p className="text-[10px] text-[#44474D]">
                            {req.items.length} أصناف • {formatDate(req.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRequestId(isExpanded ? null : req.id!);
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1",
                              isExpanded ? "bg-black text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            )}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {isExpanded ? 'إخفاء' : 'عرض'}
                          </button>
                          <div className="flex gap-2 border-r pr-2 border-gray-200">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveRequest(req.id!);
                              }}
                              className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-green-600 shadow-md shadow-green-100 transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              موافق
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectRequest(req.id!);
                              }}
                              className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-red-100 transition-all"
                            >
                              رفض
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-gray-50/80 border-t border-gray-100"
                        >
                          <div className="p-4 flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {req.items.map((reqItem: any, idx: number) => {
                                const item = items?.find((i: any) => i.id === reqItem.itemId);
                                const hasEnoughStock = (item?.quantity || 0) >= reqItem.quantity;
                                
                                return (
                                  <div key={idx} className={cn(
                                    "bg-white border p-3 rounded-2xl flex flex-col gap-2 transition-all shadow-sm",
                                    !hasEnoughStock ? "border-red-200 bg-red-50/30" : "border-gray-200"
                                  )}>
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs",
                                        !hasEnoughStock ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
                                      )}>
                                        {idx + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-black truncate">{item?.name || 'صنف غير معروف'}</p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                      <div className="bg-gray-50 p-2 rounded-xl text-center">
                                        <p className="text-[8px] text-gray-400 font-bold mb-1">المطلوبة</p>
                                        <p className="text-[10px] font-black text-black">{reqItem.quantity}</p>
                                      </div>
                                      <div className={cn("p-2 rounded-xl text-center", hasEnoughStock ? "bg-green-50" : "bg-red-50")}>
                                        <p className="text-[8px] text-gray-400 font-bold mb-1">المتاح</p>
                                        <p className={cn("text-[10px] font-black", hasEnoughStock ? "text-green-600" : "text-red-600")}>
                                          {item?.quantity || 0}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-2">
                              <button 
                                onClick={() => handleApproveRequest(req.id!)}
                                className="bg-black text-white px-8 py-2.5 rounded-xl text-xs font-black shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                اعتماد وتوريد الكميات
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            ) : (
              collections?.filter((c: any) => c.status === 'pending').map((col: any) => {
                const rep = reps?.find((r: any) => r.id === col.repId);
                const customer = customers?.find((c: any) => c.id === col.customerId);
                return (
                  <div key={col.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center font-bold">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-black text-sm">
                          {col.type === 'rep_settlement' ? 'تصفية تحصيلات يومية' : 'تحصيل من عميل'}
                        </p>
                        <p className="text-[10px] text-[#44474D]">
                          المندوب: <span className="font-bold">{rep?.name || 'غير معروف'}</span>
                        </p>
                        <p className="text-[10px] text-[#44474D]">
                          المبلغ: <span className="font-black text-green-600">{col.amount.toLocaleString()} ج.م</span>
                          {col.type !== 'rep_settlement' && customer && ` • للعميل: ${customer.name}`}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold">{formatDate(col.date)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => handleConfirmCollection(col.id!)}
                        className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-green-600 flex items-center gap-1 shadow-md shadow-green-100"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        تأكيد الاستلام
                      </button>
                      <button 
                        onClick={() => handleRejectCollection(col.id!)}
                        className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-red-100 transition-all"
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                )
              })
            )}

            {(activeSubTab === 'stock' && stockRequests?.filter((r: any) => r.status === 'pending').length === 0) && (
              <div className="p-10 text-center text-[#44474D] text-sm flex flex-col items-center gap-2">
                <Package className="w-8 h-8 opacity-20" />
                لا توجد طلبات توريد مخزون معلقة حالياً
              </div>
            )}
            {(activeSubTab === 'payments' && collections?.filter((c: any) => c.status === 'pending').length === 0) && (
              <div className="p-10 text-center text-[#44474D] text-sm flex flex-col items-center gap-2">
                <DollarSign className="w-8 h-8 opacity-20" />
                لا توجد مبالغ نقدية واردة بانتظار التأكيد
              </div>
            )}
          </div>
        </div>

        {/* Reps List */}
        <div className="bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-black text-black flex items-center gap-2">
              <Users className="w-5 h-5" />
              قائمة المناديب النشطين
            </h3>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto no-scrollbar">
            {reps?.filter((r: any) => r.name.includes(searchTerm) || r.zone.includes(searchTerm)).map((rep: any) => {
              const progressPct = rep.target > 0 ? Math.min(Math.round((rep.currentSales / rep.target) * 100), 100) : 0;
              return (
              <div 
                key={rep.id} 
                onClick={() => setSelectedRepForDetail(rep)}
                className="p-5 hover:bg-gray-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-sm">
                      {rep.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-black text-lg leading-tight truncate">{rep.name}</p>
                      <p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{rep.zone}</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      rep.id && confirmDeleteRep(rep.id);
                    }}
                    className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    title="حذف مندوب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">رقم الهاتف</p>
                    <p className="text-xs font-black text-black truncate" dir="ltr">{rep.phone || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">إجمالي المبيعات</p>
                    <p className="text-xs font-black text-green-700">{rep.currentSales.toLocaleString()} ج.م</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">نسبة العمولة</p>
                    <p className="text-xs font-black text-purple-700">{rep.commissionRate}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        progressPct >= 80 ? "bg-green-500" : progressPct >= 50 ? "bg-amber-500" : "bg-blue-500"
                      )} 
                      style={{ width: `${progressPct}%` }} 
                    />
                  </div>
                  <span className="text-[11px] font-black text-gray-500 shrink-0">
                    {progressPct}%
                  </span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0",
                    progressPct >= 80 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {progressPct >= 80 ? 'نشط' : 'نشط'}
                  </span>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Recent Transfers */}
        <div className="bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50">
            <h3 className="font-black text-black flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              سجل الحوالات المخزنية للمناديب
            </h3>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto no-scrollbar">
            {transfers?.map((transfer: any) => {
              const targetRep = reps?.find((r: any) => r.id === transfer.toId);
              return (
                <div key={transfer.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#44474D]">إلى المندوب: {targetRep?.name}</p>
                      <h4 className="font-black text-sm">{transfer.transferNumber}</h4>
                    </div>
                  </div>
                  <div className="text-left flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setSelectedTransferForDetails(transfer);
                        setTransferDetailsModalOpen(true);
                      }}
                      className="bg-gray-100 text-[#44474D] px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-gray-200 transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      إظهار التفاصيل
                    </button>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs text-[#44474D]">{formatDate(transfer.date)}</p>
                      <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-bold">تم التحويل</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add Rep Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAddModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-3xl p-8 relative z-10 shadow-2xl overflow-hidden">
              <h2 className="text-2xl font-black mb-6">إضافة مندوب جديد للمؤسسة</h2>
              <form onSubmit={handleAddRep} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#44474D]">اسم المندوب</label>
                    <input required type="text" value={newRep.name} onChange={e => setNewRep({...newRep, name: e.target.value})} className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4" placeholder="الاسم الكامل" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#44474D]">منطقة التغطية</label>
                    <input required type="text" value={newRep.zone} onChange={e => setNewRep({...newRep, zone: e.target.value})} className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4" placeholder="المحافظة - المدينة" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#44474D]">رقم الهاتف</label>
                    <input required type="tel" value={newRep.phone} onChange={e => setNewRep({...newRep, phone: e.target.value})} className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4" placeholder="01xxxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#44474D]">البريد الإلكتروني</label>
                    <input required type="email" value={newRep.email} onChange={e => setNewRep({...newRep, email: e.target.value})} className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4" placeholder="example@mail.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#44474D]">المستهدف الشهري (ج.م)</label>
                    <input required type="number" value={isNaN(newRep.target || 0) ? "" : newRep.target} onChange={e => setNewRep({...newRep, target: parseInt(e.target.value) || 0})} className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4" placeholder="50,000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#44474D]">نسبة العمولة (%)</label>
                    <input required type="number" step="0.1" value={isNaN(newRep.commissionRate || 0) ? "" : newRep.commissionRate} onChange={e => setNewRep({...newRep, commissionRate: parseFloat(e.target.value) || 0})} className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4" placeholder="5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#44474D]">الرقم القومي</label>
                  <input required type="text" inputMode="numeric" maxLength={14} value={newRep.nationalId} onChange={e => setNewRep({...newRep, nationalId: e.target.value.replace(/\D/g, '').slice(0, 14)})} className={cn("w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4", formErrors.nationalId ? "ring-2 ring-red-500" : "")} placeholder="14 رقم" />
                  {formErrors.nationalId && <p className="text-[10px] text-red-600 font-bold">{formErrors.nationalId}</p>}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-black text-black mb-4">بيانات تسجيل الدخول</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#44474D]">اسم المستخدم</label>
                      <input required type="text" value={newRep.username} onChange={e => setNewRep({...newRep, username: e.target.value})} className={cn("w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4", formErrors.username ? "ring-2 ring-red-500" : "")} placeholder="username" />
                      {formErrors.username && <p className="text-[10px] text-red-600 font-bold">{formErrors.username}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#44474D]">كلمة المرور</label>
                      <input required type="password" value={newRep.password} onChange={e => setNewRep({...newRep, password: e.target.value})} className={cn("w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4", formErrors.password ? "ring-2 ring-red-500" : "")} placeholder="أقل 6 أحرف" />
                      {formErrors.password && <p className="text-[10px] text-red-600 font-bold">{formErrors.password}</p>}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <label className="text-sm font-bold text-[#44474D]">تأكيد كلمة المرور</label>
                    <input required type="password" value={newRep.confirmPassword} onChange={e => setNewRep({...newRep, confirmPassword: e.target.value})} className={cn("w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4", formErrors.confirmPassword ? "ring-2 ring-red-500" : "")} placeholder="أعد كتابة كلمة المرور" />
                    {formErrors.confirmPassword && <p className="text-[10px] text-red-600 font-bold">{formErrors.confirmPassword}</p>}
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-black text-white py-3 rounded-xl font-bold disabled:opacity-50">{isSubmitting ? 'جاري الحفظ...' : 'حفظ المندوب'}</button>
                  <button type="button" onClick={() => setAddModalOpen(false)} className="flex-1 bg-gray-100 text-[#44474D] py-3 rounded-xl font-bold">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isTransferModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTransferModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-3xl p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
              <h2 className="text-2xl font-black mb-6">حوّلة مخزنية لمندوب بيع</h2>
              <form onSubmit={handleTransfer} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#44474D]">اختيار المندوب المستلم</label>
                  <select 
                    required 
                    className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4"
                    value={newTransfer.repId}
                    onChange={e => setNewTransfer({...newTransfer, repId: parseInt(e.target.value)})}
                  >
                    <option value="">اختر المندوب...</option>
                    {reps?.map((r: any) => <option key={r.id} value={r.id}>{r.name} - {r.zone}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-[#44474D]">إضافة أصناف من المخزن الرئيسي</label>
                    <select 
                      onChange={(e) => e.target.value !== "0" && addItemToTransfer(parseInt(e.target.value))}
                      className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      <option value="0">اختر صنف للتحويل...</option>
                      {items?.map((i: any) => <option key={i.id} value={i.id}>{i.name} (متاح: {i.quantity})</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    {newTransfer.items.map((tItem, idx) => {
                      const itemDetails = items?.find((i: any) => i.id === tItem.itemId);
                      return (
                        <div key={idx} className="bg-gray-50 p-4 rounded-xl flex items-center justify-between gap-4 border border-gray-100">
                          <div className="flex-1">
                            <p className="font-bold text-sm text-black">{itemDetails?.name}</p>
                            <p className="text-[10px] text-[#44474D]">المتاح بالمخزن: {itemDetails?.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold text-gray-400">الكمية</p>
                              <input 
                                type="number" 
                                min="1"
                                max={itemDetails?.quantity}
                                value={tItem.quantity || ''}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  const items = [...newTransfer.items];
                                  items[idx].quantity = Math.min(val, itemDetails?.quantity || val);
                                  setNewTransfer({...newTransfer, items});
                                }}
                                className="w-20 bg-white border border-gray-200 rounded-lg p-2 text-center text-sm font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold text-gray-400">سعر البيع</p>
                              <input 
                                type="number" 
                                value={tItem.sellingPrice || ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const items = [...newTransfer.items];
                                  items[idx].sellingPrice = val;
                                  setNewTransfer({...newTransfer, items});
                                }}
                                className="w-24 bg-white border border-gray-200 rounded-lg p-2 text-center text-sm font-bold text-green-600"
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const items = newTransfer.items.filter((_, i) => i !== idx);
                                setNewTransfer({...newTransfer, items});
                              }}
                              className="text-red-500 p-2 mt-4"
                            >
                              <Plus className="w-4 h-4 rotate-45" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {newTransfer.items.length === 0 && (
                      <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                        لم يتم اختيار أصناف للتحويل بعد
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <button type="submit" disabled={newTransfer.items.length === 0} className="flex-1 bg-black text-white py-3 rounded-xl font-bold disabled:opacity-50">تأكيد عملية التحويل</button>
                  <button type="button" onClick={() => setTransferModalOpen(false)} className="flex-1 bg-gray-100 text-[#44474D] py-3 rounded-xl font-bold">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedRepForDetail && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRepForDetail(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-4xl rounded-3xl p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-black text-white rounded-2xl flex items-center justify-center text-3xl font-black">
                    {selectedRepForDetail.name[0]}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-black">{selectedRepForDetail.name}</h2>
                    <p className="text-gray-500 font-bold flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {selectedRepForDetail.zone} • {selectedRepForDetail.phone}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedRepForDetail(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <Plus className="w-8 h-8 rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-2xl">
                  <p className="text-xs font-bold text-blue-600 mb-1">إجمالي المبيعات</p>
                  <h3 className="text-2xl font-black text-blue-900">{selectedRepForDetail.currentSales.toLocaleString()} ج.م</h3>
                </div>
                <div className="bg-green-50 p-6 rounded-2xl">
                  <p className="text-xs font-bold text-green-600 mb-1">المستهدف الشهري</p>
                  <h3 className="text-2xl font-black text-green-900">{selectedRepForDetail.target.toLocaleString()} ج.م</h3>
                </div>
                <div className="bg-purple-50 p-6 rounded-2xl">
                  <p className="text-xs font-bold text-purple-600 mb-1">نسبة الإنجاز</p>
                  <h3 className="text-2xl font-black text-purple-900">{Math.round((selectedRepForDetail.currentSales / selectedRepForDetail.target) * 100)}%</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-600 mb-1">قيمة العهدة (مخزون)</p>
                  <h4 className="text-lg font-black text-orange-900">{(repDetailData?.invValue || 0).toLocaleString()} ج.م</h4>
                </div>
                <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                  <p className="text-[10px] font-bold text-yellow-600 mb-1">نقدية غير مسوّاة</p>
                  <h4 className="text-lg font-black text-yellow-900">{(repDetailData?.unsettledCash || 0).toLocaleString()} ج.م</h4>
                </div>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <p className="text-[10px] font-bold text-red-600 mb-1">آجال (مديونية عملاء)</p>
                  <h4 className="text-lg font-black text-red-900">{(repDetailData?.receivables || 0).toLocaleString()} ج.م</h4>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-600 mb-1">الرصيد النقدي</p>
                  <h4 className="text-lg font-black text-black">{(selectedRepForDetail.balance || 0).toLocaleString()} ج.م</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-black text-black flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    المخزون المتوفر في عهدة المندوب
                  </h3>
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 divide-y">
                    {repDetailData?.inventory.map((inv: any) => {
                      const item = items?.find((i: any) => i.id === inv.itemId);
                      return (
                        <div key={inv.id} className="p-4 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-sm">{item?.name}</p>
                            <p className="text-[10px] text-gray-500">{item?.sku}</p>
                          </div>
                          <span className="bg-white px-3 py-1 rounded-lg border border-gray-200 font-black text-sm">
                            {inv.quantity}
                          </span>
                        </div>
                      )
                    })}
                    {repDetailData?.inventory.length === 0 && (
                      <div className="p-8 text-center text-gray-400 text-sm">لا يوجد مخزون في العهدة حالياً</div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-black text-black flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    آخر التحركات والعمليات
                  </h3>
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 divide-y">
                    {[
                      ...(repDetailData?.sales.map((s: any) => ({ ...s, type: 'sale' as const })) || []),
                      ...(repDetailData?.transfers.map((t: any) => ({ ...t, type: 'transfer' as const })) || [])
                    ].sort((a: any, b: any) => b.date - a.date).slice(0, 5).map((activity: any, idx: number) => (
                      <div key={idx} className="p-4 flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          activity.type === 'sale' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                        )}>
                          {activity.type === 'sale' ? <ShoppingCart className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            {activity.type === 'sale' ? `عملية بيع رقم ${activity.orderNumber}` : `تحويل مخزني رقم ${(activity as any).transferNumber}`}
                          </p>
                          <p className="text-[10px] text-gray-500">
                             {formatDate(activity.date)} • {activity.type === 'sale' ? `إجمالي: ${activity.totalAmount} ج.م` : `${(activity as any).items.length} أصناف`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Rep Reason Modal */}
      <AnimatePresence>
        {deleteReasonModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-right" dir="rtl">
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
                  <h3 className="text-xl font-black text-red-900">حذف مندوب</h3>
                  <p className="text-xs font-bold text-red-600">سيتم إغلاق حساب المندوب وتسجيل سبب الحذف</p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-black text-black">ما سبب حذف هذا المندوب؟</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['استقالة المندوب', 'فصل من العمل', 'تغيير في الهيكلية', 'خطأ في إدخال البيانات', 'أخرى'].map((reason) => (
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
                    onClick={handleDeleteRep}
                    className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-red-700 transition-colors"
                  >
                    تأكيد الحذف
                  </button>
                  <button 
                    onClick={() => {
                      setDeleteReasonModalOpen(false);
                      setRepToDelete(null);
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

      {/* Transfer Details Modal */}
      <AnimatePresence>
        {transferDetailsModalOpen && selectedTransferForDetails && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-right" dir="rtl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">تفاصيل الحوّلة المخزنية</h3>
                    <p className="text-xs text-gray-500 font-bold">{selectedTransferForDetails.transferNumber}</p>
                  </div>
                </div>
                <button onClick={() => setTransferDetailsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="p-8">
                <div className="bg-gray-50 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400">التاريخ</p>
                    <p className="text-sm font-black">{formatDate(selectedTransferForDetails.date)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400">المستلم</p>
                    <p className="text-sm font-black">{reps?.find((r: any) => r.id === selectedTransferForDetails.toId)?.name}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-black text-black">الأصناف المحولة:</h4>
                  <div className="border rounded-2xl overflow-hidden divide-y">
                    {selectedTransferForDetails.items.map((tItem: any, idx: number) => {
                      const item = items?.find((i: any) => i.id === tItem.itemId);
                      return (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-[10px] font-black text-gray-500">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-black">{item?.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold">{item?.sku}</p>
                            </div>
                          </div>
                          <div className="text-left font-black">
                            <span className="text-black">{tItem.quantity} وحدة</span>
                            {tItem.sellingPrice && (
                              <p className="text-[10px] text-green-600">بسعر {tItem.sellingPrice} ج.م</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={() => setTransferDetailsModalOpen(false)}
                    className="w-full bg-black text-white py-4 rounded-2xl font-black shadow-lg hover:opacity-90 transition-opacity"
                  >
                    إغلاق العرض
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
