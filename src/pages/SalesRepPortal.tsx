import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProtectedMutation } from '../hooks/useProtectedMutation';
import { motion, AnimatePresence } from 'motion/react';
import { 
 Users, 
 Package, 
 ShoppingCart, 
 LayoutDashboard, 
 Plus, 
 Search, 
 ArrowRightLeft, 
 UserCircle,
 TrendingUp,
 MapPin,
 ClipboardList,
 CheckCircle2,
 AlertCircle,
 Coins,
 Clock,

 Send,
 Eye
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { toast } from 'sonner';
import SalesInvoiceModal from '../components/SalesInvoiceModal';
import { WorkspaceLayout, Tabs } from '../components/design-system';
import { useSalesReps } from '../hooks/useSalesReps';
import { useInventory } from '../hooks/useInventory';
import { useCustomers, useCreateCustomer } from '../hooks/useCustomers';
import api from '../lib/api-client';
import { LoadingButton } from '../components/ui/LoadingButton';
import type { UserAccount } from '../types';

interface SalesRepPortalProps {
 currentUser?: UserAccount | null;
 activeTab?: 'dashboard' | 'inventory' | 'customers' | 'sales' | 'requests' | 'overview';
}

const PORTAL_TABS = [
 { id: 'dashboard', label: 'لوحة القيادة', icon: LayoutDashboard },
 { id: 'overview', label: 'نظرة عامة', icon: ClipboardList },
 { id: 'inventory', label: 'عهدتي', icon: Package },
 { id: 'customers', label: 'العملاء', icon: Users },
 { id: 'sales', label: 'المبيعات', icon: ShoppingCart },
 { id: 'requests', label: 'الطلبات', icon: ArrowRightLeft },
];

export default function SalesRepPortal({ currentUser, activeTab: propTab }: SalesRepPortalProps) {
 const [selectedRepId, setSelectedRepId] = useState<number | null>(currentUser?.repId || null);
 const [internalTab, setInternalTab] = useState<'dashboard' | 'inventory' | 'customers' | 'sales' | 'requests' | 'overview'>('overview');
 
 const activeTab = propTab || internalTab;
 const setActiveTab = (tab: any) => setInternalTab(tab);

 React.useEffect(() => {
 if (propTab) {
 setInternalTab(propTab);
 }
 }, [propTab]);

 const [isRequestModalOpen, setRequestModalOpen] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [isSaleModalOpen, setSaleModalOpen] = useState(false);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [isCollectionModalOpen, setCollectionModalOpen] = useState(false);

 const [isInvoiceOpen, setInvoiceOpen] = useState(false);
 const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

 const [excessPaymentModal, setExcessPaymentModal] = useState(false);
 const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
 const [excessAmount, setExcessAmount] = useState(0);

 const [newCustomer, setNewCustomer] = useState({
  name: '',
  phone: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined
 });
 const [isLocating, setIsLocating] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);

 const [newSale, setNewSale] = useState({
 customerId: 0,
 paidAmount: 0,
 items: [] as { itemId: number; quantity: number; price: number }[]
 });

 const [newCollection, setNewCollection] = useState({
 customerId: 0,
 amount: 0,
 method: 'cash' as const
 });

 const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);

 const qc = useQueryClient();
 const { data: repsData } = useSalesReps();
 const reps = repsData?.items;
 const selectedRep = reps?.find(r => r.id === selectedRepId);
 
  // Auto-resolve selectedRepId for rep users
  React.useEffect(() => {
    if (!reps || reps.length === 0) return;

    // Rep role: use repId from user account or match by username
    if (currentUser?.role === 'rep') {
      if (currentUser.repId && reps.some(r => r.id === currentUser.repId)) {
        setSelectedRepId(currentUser.repId);
        return;
      }
      // Fallback: match by username in rep name
      const byName = reps.find(r =>
        r.name.replace(/\s/g, '').includes(currentUser.username.replace(/\s/g, '')) ||
        currentUser.username.replace(/\s/g, '').includes(r.name.replace(/\s/g, ''))
      );
      if (byName) {
        setSelectedRepId(byName.id!);
        return;
      }
      // Last resort: match by index (single-rep scenario)
      if (reps.length === 1) {
        setSelectedRepId(reps[0].id!);
        return;
      }
      return;
    }

    // Admin/manager: auto-match only if repId is already set and valid
    if (!selectedRepId && currentUser?.username === '1') {
      const mohamed = reps.find(r => r.name === 'محمد محمود');
      if (mohamed) { setSelectedRepId(mohamed.id!); return; }
    }

    if (!selectedRepId) {
      const matchingRep = reps.find(r =>
        r.name.toLowerCase().includes(currentUser?.username.toLowerCase() || '') ||
        r.email?.toLowerCase().includes(currentUser?.username.toLowerCase() || '')
      );
      if (matchingRep) { setSelectedRepId(matchingRep.id!); return; }
    }

    if (selectedRepId !== null && !selectedRep) {
      const matchingRep = reps.find(r =>
        r.name.toLowerCase().includes(currentUser?.username.toLowerCase() || '') ||
        (currentUser?.username === '1' && r.name === 'محمد محمود')
      );
      if (matchingRep) { setSelectedRepId(matchingRep.id!); }
    }
  }, [reps, selectedRep, selectedRepId, currentUser]);

 const { data: repInvData } = useQuery({
 queryKey: ['repInventory', selectedRepId],
  queryFn: () => api(`/rep-inventory?repId=${selectedRepId}`),
  enabled: !!selectedRepId,
  retry: false,
  });
  const myInventory = Array.isArray(repInvData) ? repInvData : (repInvData as any)?.items ?? [];

 const { data: inventoryData } = useInventory();
 const allItems = inventoryData?.items;

 const { data: customersData } = useCustomers();
 const customers = customersData?.items;

 const { data: requestsData } = useQuery({
 queryKey: ['stockRequests', 'rep', selectedRepId],
  queryFn: () => api(`/stock-requests?repId=${selectedRepId}`),
  enabled: !!selectedRepId,
  retry: false,
  });
  const myRequests = (requestsData as any)?.items;

 const { data: salesData } = useQuery({
 queryKey: ['salesOrders', 'rep', selectedRepId],
  queryFn: () => api(`/sales-orders?repId=${selectedRepId}`),
  enabled: !!selectedRepId,
  retry: false,
  });
  const mySales = (salesData as any)?.orders;

  const { data: unsettledOrders } = useQuery({
  queryKey: ['unsettledOrders', selectedRepId],
  queryFn: () => api(`/sales-orders/unsettled?repId=${selectedRepId}`),
  enabled: !!selectedRepId,
  retry: false,
  });
  const unsettledAmount = unsettledOrders as number | undefined;

  const { data: pendingSettlement } = useQuery({
  queryKey: ['pendingSettlement', selectedRepId],
  queryFn: () => api(`/payment-collections/pending-settlement?repId=${selectedRepId}`),
  enabled: !!selectedRepId,
  retry: false,
  });
  console.log('[FRONTEND pendingSettlement]', pendingSettlement);

  const { data: settledCommission } = useQuery({
  queryKey: ['settledCommission', selectedRepId],
  queryFn: () => api(`/sales-orders/settled-commission?repId=${selectedRepId}&commissionRate=${selectedRep?.commissionRate || 0}`),
  enabled: !!selectedRepId && !!selectedRep,
  retry: false,
  });
  const handleDaySettlement = async () => {
  if (!selectedRepId || (unsettledAmount ?? 0) <= 0) return;

  if (pendingSettlement) {
  toast.error('يوجد طلب تسوية معلق بالفعل، يرجى انتظار المراجعة');
  return;
  }

  try {
  await api('/payment-collections', {
  method: 'POST',
  body: JSON.stringify({
  repId: selectedRepId,
  amount: unsettledAmount ?? 0,
  method: 'cash',
  status: 'pending',
  type: 'rep_settlement',
  date: Date.now()
  }),
  });

  await api('/notifications', {
  method: 'POST',
  body: JSON.stringify({
  title: 'طلب تسوية عهدة نقدية',
  message: `المندوب ${selectedRep?.name} يطلب تسوية مبلغ ${unsettledAmount} ج.م حصيلة اليوم.`,
  type: 'warning',
  }),
  });

  await api('/activity-logs', {
  method: 'POST',
  body: JSON.stringify({
  userId: selectedRepId, username: selectedRep?.name || '',
  action: 'طلب تسوية عهدة', entity: 'PaymentCollection',
  details: `طلب تسوية ${unsettledAmount} ج.م للخزينة`,
  timestamp: Date.now()
  }),
  });

  qc.invalidateQueries({ queryKey: ['pendingSettlement'] });
  qc.invalidateQueries({ queryKey: ['unsettledOrders'] });

  toast.success('تم إرسال طلب التوريد بنجاح');
  } catch (error) {
  console.error(error);
  toast.error('فشل إرسال الطلب');
  }
  };

 const [newRequest, setNewRequest] = useState({
 items: [] as { itemId: number; quantity: number }[]
 });

 const salesCount = mySales?.length || 0;

 const monthSales = mySales?.filter((o: { date: number; totalAmount: number }) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return o.date >= startOfMonth.getTime();
 }).reduce((sum: number, s: { totalAmount: number }) => sum + s.totalAmount, 0) || 0;

 const { data: newCustomersToday } = useQuery<number>({
 queryKey: ['newCustomersToday', selectedRepId],
  queryFn: () => api<number>(`/customers/count-today?repId=${selectedRepId}`),
  staleTime: 30_000,
  retry: false,
  enabled: !!selectedRepId,
  });

 const fetchUnpaidInvoices = async (customerId: number) => {
 const unpaid = await api(`/sales-orders/unpaid-by-customer?customerId=${customerId}`);
 setUnpaidInvoices(unpaid as any[]);
 };

 const { data: activityLogsData } = useQuery({
 queryKey: ['repActivity', selectedRepId],
 queryFn: async () => {
   const [sales, transfers] = await Promise.all([
     api(`/sales-orders?repId=${selectedRepId}`),
     api(`/stock-transfers?toId=${selectedRepId}&toType=rep`),
   ]);
   const salesList = (sales as any)?.orders || [];
   const transfersList = (transfers as any)?.items || [];
   return [
     ...salesList.map((s: any) => ({ ...s, type: 'sale' as const })), 
     ...transfersList.filter((t: any) => t.toType === 'rep').map((t: any) => ({ ...t, type: 'transfer' as const }))
    ].sort((a: any, b: any) => b.date - a.date).slice(0, 20);
  },
  enabled: !!selectedRepId,
  retry: false,
  });
  const activityLog = activityLogsData;

  const createCustomer = useCreateCustomer();

  const createSaleMutation = useProtectedMutation(async (data: {
    customerId: number;
    items: { itemId: number; quantity: number; price: number }[];
    paidAmount: number;
    repId: number;
  }) => {
    const total = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    const repOrderNumber = `REP-${requestId.slice(0, 8).toUpperCase()}`;

    const orderRes = await api('/sales-orders', {
      method: 'POST',
      body: JSON.stringify({
        orderNumber: requestId,
        customerId: data.customerId,
        repId: data.repId,
        items: data.items,
        totalAmount: total,
        status: 'delivered',
        paymentStatus: data.paidAmount >= total ? 'paid' : (data.paidAmount > 0 ? 'partial' : 'unpaid'),
        paidAmount: Math.min(data.paidAmount, total),
        settledAmount: 0,
        isSettledWithWarehouse: false,
        date: Date.now(),
      }),
    });
    const order = (orderRes as any)?.data || orderRes;
    const orderId = order.id;

    await api('/notifications', {
      method: 'POST',
      body: JSON.stringify({
        title: 'عملية بيع جديدة',
        message: `قام المندوب ${selectedRep?.name} ببيع مبلغ ${total} ج.م (محصل: ${Math.min(data.paidAmount, total)}).`,
        type: 'info',
      }),
    });

    for (const saleItem of data.items) {
      const repInvItem = myInventory?.find((i: any) => i.itemId === saleItem.itemId);
      if (!repInvItem || repInvItem.quantity < saleItem.quantity) {
        throw new Error(`رصيد غير كافٍ للصنف ID: ${saleItem.itemId}`);
      }

      await api(`/rep-inventory/${repInvItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: repInvItem.quantity - saleItem.quantity }),
      });
    }

    await api('/activity-logs', {
      method: 'POST',
      body: JSON.stringify({
        userId: selectedRepId, username: selectedRep?.name || '',
        action: 'تسجيل عملية بيع', entity: 'SalesOrder',
        entityId: orderId,
        details: `فاتورة ${repOrderNumber} بقيمة ${total} ج.م (محصل: ${Math.min(data.paidAmount, total)}) للعميل ${customers?.find(c => c.id === data.customerId)?.name}`,
        timestamp: Date.now()
      }),
    });

    return { orderId, total, repOrderNumber };
  },
  {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-orders'] });
      qc.invalidateQueries({ queryKey: ['repInventory'] });
      qc.invalidateQueries({ queryKey: ['salesReps'] });
    },
  },
);

  const handleCreateRequest = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isSubmitting) return;
  if (newRequest.items.length === 0) return;

  const existingPending = myRequests?.find((r: { repId: number; status: string }) => r.repId === selectedRepId && r.status === 'pending');
  if (existingPending) {
   toast.error('لديك طلب توريد معلق بالفعل، يرجى انتظار المراجعة');
   return;
  }

  setIsSubmitting(true);
  try {
  const requestRes = await api('/stock-requests', {
  method: 'POST',
  body: JSON.stringify({
  repId: selectedRepId!,
  items: newRequest.items,
  status: 'pending',
  date: Date.now()
  }),
  });

  await api('/notifications', {
  method: 'POST',
  body: JSON.stringify({
  title: 'طلب توريد بضاعة جديد',
  message: `المندوب ${currentUser?.username} أرسل طلب توريد بضاعة جديد.`,
  type: 'info',
  }),
  });

  await api('/activity-logs', {
  method: 'POST',
  body: JSON.stringify({
  userId: selectedRepId!, username: selectedRep?.name || '',
  action: 'طلب توريد بضاعة', entity: 'StockRequest',
  entityId: (requestRes as any)?.data?.id || (requestRes as any)?.id,
  details: `طلب توريد ${newRequest.items.length} أصناف`,
  timestamp: Date.now()
  }),
  });

  qc.invalidateQueries({ queryKey: ['stockRequests'] });

  setRequestModalOpen(false);
  setNewRequest({ items: [] });
  toast.success('تم إرسال طلب التوريد للمخزن بنجاح');
  } catch (error) {
  console.error(error);
  toast.error('فشل إرسال الطلب');
  } finally {
  setIsSubmitting(false);
  }
  };

  // Rep role: auto-resolve selectedRepId — never show selection screen
  if (currentUser?.role === 'rep') {
    if (!selectedRepId) {
      if (!reps) {
        return (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        );
      }
      return (
        <div className="p-12 text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <h2 className="text-xl font-bold">جاري تحميل ملفك الشخصي...</h2>
          <p className="text-[#44474D]">يرجى الانتظار</p>
        </div>
      );
    }
    if (!selectedRep) {
      return (
        <div className="p-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">عفواً، لم يتم العثور على ملف المندوب</h2>
          <p className="text-[#44474D]">يبدو أن سجل المندوب الخاص بك قد تم حذفه أو لم يتم إنشاؤه بعد.</p>
          <p className="text-sm font-bold text-black font-tajawal">يرجى التواصل مع الإدارة لتفعيل حسابك كمندوب.</p>
        </div>
      );
    }
  } else {
    // Admin/manager: show rep selection grid
    if (!reps) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      );
    }

    if (!selectedRepId) {
      return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-black">بوابة المندوبين</h1>
            <p className="text-[#44474D]">يرجى اختيار ملفك الشخصي للدخول إلى لوحة التحكم الخاصة بك</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reps?.map(rep => (
              <button
                key={rep.id}
                onClick={() => setSelectedRepId(rep.id!)}
                className="bg-white p-6 rounded-2xl border border-[#E0E3E5] hover:border-black transition-all text-right flex items-center gap-4 group"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <UserCircle className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-black">{rep.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-[#44474D] mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{rep.zone}</span>
                  </div>
                </div>
              </button>
            ))}

            <div className="bg-gray-50 border-2 border-dashed border-[#E0E3E5] p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 opacity-60">
              <Plus className="w-8 h-8 text-[#44474D]" />
              <span className="text-sm font-bold text-[#44474D]">يتم إضافة مناديب جدد من لوحة تحكم المدير</span>
            </div>
          </div>
        </div>
      );
    }

    if (selectedRepId && !selectedRep) {
      return (
        <div className="p-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">عفواً، لم يتم العثور على ملف المندوب</h2>
          <p className="text-[#44474D]">يبدو أن سجل المندوب الخاص بك قد تم حذفه أو لم يتم إنشاؤه بعد.</p>
          <button
            onClick={() => setSelectedRepId(null)}
            className="bg-black text-white px-6 py-2 rounded-xl font-bold"
          >
            العودة لاختيار مندوب
          </button>
        </div>
      );
    }
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newCustomer.name) {
  toast.error('يرجى إدخال اسم العميل');
  return;
  }

  if (isSubmitting) return;

  const phoneRegex = /^(010|011|012|015)\d{8}$/;
  if (!phoneRegex.test(newCustomer.phone)) {
  toast.error('رقم الهاتف يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقم');
  return;
  }

  try {
  setIsSubmitting(true);
  await createCustomer.mutateAsync({
  ...newCustomer,
  createdAt: Date.now()
  } as any);
  
  toast.success('تمت إضافة العميل بنجاح');
  setCustomerModalOpen(false);
  setNewCustomer({ 
  name: '', 
  phone: '', 
  latitude: undefined, 
  longitude: undefined 
  });
  } catch (error: any) {
  console.error(error);
  toast.error(error?.message || 'فشل إضافة العميل');
  } finally {
  setIsSubmitting(false);
  }
  };

 const captureLocation = () => {
  if (!navigator.geolocation) {
  toast.error('متصفحك لا يدعم تحديد الموقع');
  return;
  }

  setIsLocating(true);

  const attemptLocation = (isRetry: boolean) => {
  const options: PositionOptions = isRetry
  ? { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
  : { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 };

  navigator.geolocation.getCurrentPosition(
  (position) => {
  setNewCustomer({
  ...newCustomer,
  latitude: position.coords.latitude,
  longitude: position.coords.longitude
  });
  toast.success('تم تحديد الموقع بنجاح');
  setIsLocating(false);
  },
  (error) => {
  console.error('Geolocation error:', { code: error.code, message: error.message });
  if (!isRetry && error.code === 3) {
  attemptLocation(true);
  return;
  }
  toast.error('تعذر تحديد الموقع الحالي، يمكنك المحاولة لاحقاً');
  setIsLocating(false);
  },
  options
  );
  };

  attemptLocation(false);
   };

  const handleCreateSale = async (e: React.FormEvent) => {
 e.preventDefault();
 if (newSale.items.length === 0 || !newSale.customerId) {
 toast.error('يرجى إضافة أصناف واختيار عميل');
 return;
 }

  if (newSale.items.some(i => i.quantity <= 0)) {
  toast.error('الكميات يجب أن تكون أكبر من صفر');
  return;
  }

  if (createSaleMutation.isPending) return;

  try {
 const total = newSale.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
 
  if (newSale.paidAmount > total) {
  setExcessAmount(newSale.paidAmount - total);
  await fetchUnpaidInvoices(newSale.customerId);
  setExcessPaymentModal(true);
  return;
  }

  const result = await createSaleMutation.mutateAsync({
   customerId: newSale.customerId,
   items: newSale.items,
   paidAmount: newSale.paidAmount,
   repId: selectedRepId!,
 });

  toast.success('تم تسجيل عملية البيع بنجاح');
  setSaleModalOpen(false);
  setNewSale({ customerId: 0, items: [], paidAmount: 0 });
  setRequestId(crypto.randomUUID());
 
 if (newSale.paidAmount <= total) {
 const lastOrderRes = await api(`/sales-orders?repId=${selectedRepId}&pageSize=1`);
 const lastOrders = (lastOrderRes as any)?.orders || [];
 setSelectedInvoice(lastOrders[0]);
 setInvoiceOpen(true);
 }
 } catch (error: any) {
 console.error(error);
 toast.error(error.message || 'فشل تسجيل عملية البيع');
 }
 };

  const handleCreateCollection = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isSubmitting) return;
  if (!newCollection.customerId || newCollection.amount <= 0) return;

  setIsSubmitting(true);
  try {
  await api('/payment-collections', {
 method: 'POST',
 body: JSON.stringify({
 repId: selectedRepId!,
 customerId: newCollection.customerId,
 amount: newCollection.amount,
 method: newCollection.method,
 status: 'pending',
 date: Date.now()
 }),
 });

 await api('/notifications', {
 method: 'POST',
 body: JSON.stringify({
 title: 'تحصيل جديد',
 message: `قام المندوب ${selectedRep?.name} بتسجيل تحصيل بقيمة ${newCollection.amount} ج.م من ${customers?.find(c => c.id === newCollection.customerId)?.name}. يرجى المراجعة والتأكيد.`,
 type: 'info',
 }),
 });

 setCollectionModalOpen(false);
 setNewCollection({ customerId: 0, amount: 0, method: 'cash' });
  toast.success('تم تسجيل التحصيل بنجاح');
  } catch (error) {
  console.error(error);
  toast.error('فشل تسجيل التحصيل');
  } finally {
  setIsSubmitting(false);
  }
  };

 const addItemToSale = (itemId: number) => {
 const item = allItems?.find(i => i.id === itemId);
 if (!item) return;

 const repStock = myInventory?.find((i: any) => i.itemId === itemId)?.quantity || 0;
 if (repStock <= 0) {
 toast.error('لا يوجد رصيد كافٍ في عهدتك لهذا الصنف');
 return;
 }

 if (newSale.items.find(i => i.itemId === itemId)) return;

 setNewSale({
 ...newSale,
 items: [...newSale.items, { itemId, quantity: 1, price: item.sellingPrice }]
 });
 };

 return (
 <WorkspaceLayout maxWidth="xl">
 {!propTab && (
 <>
 <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] flex justify-between items-center">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold">
 {selectedRep?.name?.[0] || 'R'}
 </div>
 <div>
 <h2 className="text-xl font-bold text-black">{selectedRep?.name}</h2>
 <p className="text-sm text-[#44474D] flex items-center gap-1">
 <MapPin className="w-3 h-3" />
 {selectedRep?.zone}
 </p>
 </div>
 </div>
 {currentUser?.role === 'admin' && (
 <button 
 onClick={() => setSelectedRepId(null)}
 className="text-[#44474D] hover:text-black flex items-center gap-2 text-sm font-bold"
 >
 <ArrowRightLeft className="w-4 h-4" />
 تغيير المندوب (أدمن)
 </button>
 )}
 </div>

 <Tabs
 tabs={PORTAL_TABS}
 activeTab={activeTab}
 onChange={(tab) => setActiveTab(tab as any)}
 />
 </>
 )}

 {propTab && (
 <div className="flex flex-col gap-1">
 <h1 className="text-2xl font-bold text-black">
 {propTab === 'dashboard' && 'سجل العمليات والنشاط'}
 {propTab === 'overview' && 'لوحة التحكم والمؤشرات'}
 {propTab === 'inventory' && 'عهدتي (المخزون)'}
 {propTab === 'customers' && 'إدارة العملاء'}
 {propTab === 'sales' && 'سجل عمليات البيع'}
 {propTab === 'requests' && 'طلبات توريد المخزون'}
 </h1>
 <p className="text-sm text-[#44474D]">مرحباً بك {selectedRep?.name} • {selectedRep?.zone}</p>
 </div>
 )}

 <AnimatePresence mode="wait">
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.2 }}
 >
 {activeTab === 'dashboard' && (
 <div className="space-y-4">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden">
 <div className="p-4 border-b bg-orange-50/50 flex justify-between items-center text-orange-800">
 <h3 className="font-bold flex items-center gap-2">
 <AlertCircle className="w-5 h-5" />
 أصناف أوشكت على الانتهاء في عهدتك
 </h3>
 </div>
 <div className="divide-y">
 {myInventory?.filter((inv: any) => inv.quantity < 5).map((inv: any) => {
 const item = allItems?.find(i => i.id === inv.itemId);
 return (
 <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold">
 {item?.name?.[0] || 'P'}
 </div>
 <div>
 <p className="font-bold text-sm text-black">{item?.name || 'صنف غير معروف'}</p>
 <p className="text-[10px] text-[#44474D]">الكمية الحالية: <span className="text-red-600 font-bold">{inv.quantity}</span></p>
 </div>
 </div>
 <button 
 onClick={() => {
 setNewRequest({ items: [{ itemId: inv.itemId, quantity: 10 }] });
 setRequestModalOpen(true);
 }}
 className="bg-black text-white px-4 py-1.5 rounded-lg text-[10px] font-bold hover:opacity-80 transition-opacity"
 >
 تجديد الطلب
 </button>
 </div>
 )
 })}
 {myInventory?.filter((inv: any) => inv.quantity < 5).length === 0 && (
 <div className="p-10 text-center text-[#44474D] text-xs">لا توجد أصناف منخفضة المخزون حالياً</div>
 )}
 </div>
 </div>

 <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-4">
 <h3 className="font-bold text-black">ملخص الأداء السريع</h3>
 <div className="space-y-4">
 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
 <span className="text-xs font-bold text-[#44474D]">عدد العملاء الجدد اليوم</span>
 <span className="font-bold">{newCustomersToday ?? 0}</span>
 </div>
 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
 <span className="text-xs font-bold text-[#44474D]">المبيعات المكتملة</span>
 <span className="font-bold text-green-600">{salesCount ?? 0}</span>
 </div>
 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
 <span className="text-xs font-bold text-[#44474D]">طلبات التوريد</span>
 <span className="font-bold text-blue-600">{myRequests?.length || 0}</span>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden">
 <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
 <h3 className="font-bold text-black flex items-center gap-2">
 <ClipboardList className="w-5 h-5 text-blue-600" />
 سجل العمليات وآخر التحركات
 </h3>
 </div>
 <div className="divide-y max-h-[400px] overflow-y-auto no-scrollbar">
 {activityLog?.map((activity: any, idx: number) => (
 <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
 <div className="flex items-center gap-4">
 <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
 activity.type === 'sale' ?"bg-green-50 text-green-600" :"bg-blue-50 text-blue-600"
 )}>
 {activity.type === 'sale' ? <ShoppingCart className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
 </div>
 <div>
 <p className="font-bold text-[13px] text-black">
 {activity.type === 'sale' ? `عملية بيع رقم ${activity.orderNumber}` : `استلام بضاعة رقم ${activity.transferNumber}`}
 </p>
 <p className="text-[10px] text-[#44474D]">
 {activity.type === 'sale' ? `العميل: ${customers?.find(c => c.id === activity.customerId)?.name || 'غير معروف'}` : `عدد الأصناف: ${activity.items?.length || 0}`}
 </p>
 </div>
 </div>
 <div className="text-left">
 <p className="text-[10px] text-[#44474D]">{formatDate(activity.date)}</p>
 <p className={cn("text-xs font-bold",
 activity.type === 'sale' ?"text-green-600" :"text-blue-600"
 )}>
 {activity.type === 'sale' ? `+ ${activity.totalAmount} ج.م` : 'استلام مخزني'}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {activeTab === 'overview' && (
 <div className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-2 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-10">
 <TrendingUp className="w-16 h-16" />
 </div>
 <p className="text-sm font-bold text-[#44474D]">مبيعاتك هذا الشهر</p>
 <h3 className="text-3xl font-bold text-black">{(monthSales || 0).toLocaleString()} <span className="text-sm">ج.م</span></h3>
 <div className="w-full bg-gray-100 h-2 rounded-full mt-4">
 <div 
 className="bg-black h-full rounded-full" 
 style={{ width: `${Math.min(100, ((monthSales || 0) / (selectedRep?.target ?? 1))) * 100}%` }}
 />
 </div>
 <p className="text-[10px] text-[#44474D] text-left">
 المستهدف الشهري: {(selectedRep?.target || 0).toLocaleString()} ج.م
 </p>
 </div>

 <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-2">
 <p className="text-sm font-bold text-[#44474D]">عدد الأصناف في العهدة</p>
 <h3 className="text-3xl font-bold text-black">{myInventory?.length || 0}</h3>
 <p className="text-xs text-green-600 flex items-center gap-1">
 <CheckCircle2 className="w-3 h-3" />
 جميع الأصناف متوفرة
 </p>
 </div>

  <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-2">
  <p className="text-sm font-bold text-[#44474D]">العمولة المحققة (من المبيعات المسوّاة)</p>
  <h3 className="text-3xl font-bold text-black">
  {((settledCommission as number) || 0).toLocaleString()} <span className="text-sm">ج.م</span>
  </h3>
  <p className="text-xs text-[#44474D]">بمعدل عمولة {selectedRep?.commissionRate || 0}% على المبيعات المسوّاة فقط</p>
  </div>
 </div>

 <div className="bg-black text-white p-6 rounded-3xl relative overflow-hidden">
 <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-20 -translate-y-20" />
 <div className="relative flex flex-col md:flex-row justify-between items-center gap-4">
 <div>
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
 <Coins className="w-4 h-4 text-white" />
 </div>
 <span className="text-sm font-bold text-white/80">ملخص التحصيلات اليومية</span>
 </div>
 <h3 className="text-4xl font-bold mb-1">{(unsettledAmount || 0).toLocaleString()} <span className="text-lg">ج.م</span></h3>
 <p className="text-sm text-white/60 font-bold">إجمالي مبالغ في حوزتك لم يتم توريدها للخزينة</p>
 </div>
 
  <div className="flex flex-col gap-3 w-full md:w-auto">
  {(() => { console.log('[RENDER pendingSettlement check]', { value: pendingSettlement, isTruthy: !!pendingSettlement, hasId: !!(pendingSettlement as any)?.id }); return null; })()}
  {pendingSettlement ? (
 <div className="bg-orange-500/20 border border-orange-500/30 px-6 py-4 rounded-2xl flex items-center gap-4">
 <Clock className="w-6 h-6 text-orange-500 animate-pulse" />
 <div>
 <p className="text-sm font-bold text-orange-500">طلب التوريد قيد المراجعة</p>
 <p className="text-[10px] text-white/50">بانتظار تأكيد الاستلام من الإدارة</p>
 </div>
 </div>
 ) : (
 <button 
 onClick={handleDaySettlement}
 disabled={(unsettledAmount ?? 0) <= 0}
 className="bg-white text-black px-10 py-4 rounded-2xl font-bold text-sm hover:bg-green-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
 >
 {(unsettledAmount ?? 0) > 0 ? 'توريد تحصيلات اليوم للخزينة' : 'لا توجد تحصيلات للتوريد'}
 </button>
 )}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-4">
 <h4 className="font-bold text-black flex items-center gap-2">
 <ClipboardList className="w-5 h-5" />
 تنبيهات هامة
 </h4>
 <div className="space-y-3">
 {myInventory?.some((i: any) => i.quantity < 5) ? (
 <div className="flex gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100 text-orange-800">
 <AlertCircle className="w-5 h-5 shrink-0" />
 <div>
 <p className="text-sm font-bold">مخزون منخفض</p>
 <p className="text-xs">توجد أصناف في عهدتك وصلت للحد الأدنى، يرجى طلب توريد.</p>
 </div>
 </div>
 ) : (
 <div className="flex gap-4 p-4 bg-green-50 rounded-xl border border-green-100 text-green-800">
 <CheckCircle2 className="w-5 h-5 shrink-0" />
 <div>
 <p className="text-sm font-bold">حالة المخزون ممتازة</p>
 <p className="text-xs">رصيد عهدتك كافٍ لعمليات البيع اليوم.</p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'inventory' && (
 <div className="bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden">
 <div className="p-4 border-b border-[#E0E3E5] flex justify-between items-center bg-gray-50/30">
 <div className="flex items-center gap-4">
 <div className="relative">
 <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474D]" />
 <input 
 type="text" 
 placeholder="بحث في العهدة..."
 className="bg-white border text-sm border-[#E0E3E5] rounded-xl py-2 pr-10 pl-4 focus:ring-1 focus:ring-black outline-none w-64"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-right border-collapse">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#E0E3E5]">
 <th className="p-4 text-sm font-bold text-[#44474D]">اسم الصنف</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">الكمية المتوفرة</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">السعر المقترح</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">الحالة</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#F2F4F6]">
 {myInventory?.map((inv: any) => {
 const item = allItems?.find(i => i.id === inv.itemId);
 if (!item) return null;
 if (searchTerm && !item.name.includes(searchTerm)) return null;

 return (
 <tr key={inv.id} className="hover:bg-[#F2F4F6] transition-colors">
 <td className="p-4">
 <p className="font-bold text-black">{item.name}</p>
 <p className="text-[10px] text-[#44474D]">{item.sku}</p>
 </td>
 <td className="p-4 font-bold">{inv.quantity}</td>
 <td className="p-4">{item.sellingPrice} ج.م</td>
 <td className="p-4">
 {inv.quantity < 5 ? (
 <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-1 rounded-full font-bold">منخفض</span>
 ) : (
 <span className="bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-full font-bold">متوفر</span>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {activeTab === 'customers' && (
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <div className="relative">
 <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474D]" />
 <input 
 type="text" 
 placeholder="بحث في العملاء..."
 className="bg-white border text-sm border-[#E0E3E5] rounded-xl py-2 pr-10 pl-4 w-64"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 <button 
 onClick={() => setCustomerModalOpen(true)}
 className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm"
 >
 <Plus className="w-4 h-4" />
 إضافة عميل جديد
 </button>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
 {customers?.filter((c: any) => c.name.includes(searchTerm) || c.phone.includes(searchTerm)).map(customer => (
 <div key={customer.id} className="bg-white p-5 rounded-2xl border border-[#E0E3E5] space-y-3 hover:border-black transition-colors group">
 <div className="flex justify-between items-start">
 <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
 <UserCircle className="w-6 h-6" />
 </div>
 <span className="text-[10px] text-[#44474D]">{formatDate(customer.createdAt)}</span>
 </div>
 <div>
 <h3 className="font-bold text-black">{customer.name}</h3>
 <p className="text-sm text-[#44474D]">{customer.phone}</p>
 </div>
  <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
  <div className="flex items-center gap-2">
  {customer.latitude && customer.longitude ? (
  <a 
  href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`}
  target="_blank"
  rel="noreferrer"
  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
  >
  <MapPin className="w-3.5 h-3.5" />
  عرض الموقع
  </a>
  ) : (
  <span className="text-xs text-[#44474D] flex items-center gap-1">
  <MapPin className="w-3 h-3" />
  لا يوجد موقع مسجل لهذا العميل
  </span>
  )}
  </div>
  <button 
  onClick={() => {
  setNewCollection({...newCollection, customerId: customer.id!});
  setCollectionModalOpen(true);
  }}
  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
  title="تسجيل تحصيل"
  >
  <Coins className="w-4 h-4" />
  </button>
  </div>
 </div>
 ))}
 </div>

 <div className="bg-white rounded-2xl border border-[#E0E3E5] flex flex-col h-fit">
 <div className="p-4 border-b bg-gray-50/50">
 <h3 className="text-sm font-bold text-black flex items-center gap-2">
 <ClipboardList className="w-4 h-4 text-blue-600" />
 آخر فواتير العملاء (المبيعات)
 </h3>
 </div>
 <div className="divide-y max-h-[600px] overflow-y-auto no-scrollbar">
  {mySales?.slice(0, 15).map((order: { customerId: number; totalAmount: number; paidAmount?: number; id: number; orderNumber: string; status: string; date: number; paymentStatus: string }) => {
  const customer = customers?.find((c: any) => c.id === order.customerId);
  const remaining = order.totalAmount - (order.paidAmount || 0);
  return (
  <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors space-y-1">
  <div className="flex justify-between items-start">
  <p className="text-xs font-bold text-black">{order.orderNumber}</p>
  <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold",
 order.paymentStatus === 'paid' ?"bg-green-100 text-green-600" : (order.paymentStatus === 'partial' ?"bg-orange-100 text-orange-600" :"bg-red-100 text-red-600")
 )}>
 {order.paymentStatus === 'paid' ? 'خالص' : (order.paymentStatus === 'partial' ? 'جزئي' : 'آجل')}
 </span>
 </div>
 <p className="text-[10px] text-gray-500 font-bold">{customer?.name}</p>
 <div className="flex justify-between items-center text-[10px] pt-1">
 <span className="text-gray-400 font-bold">{formatDate(order.date)}</span>
 <div className="flex items-center gap-2">
 <button 
 onClick={() => {
 setSelectedInvoice(order);
 setInvoiceOpen(true);
 }}
 className="p-1 text-black hover:bg-gray-200 rounded transition-colors"
 title="عرض الفاتورة"
 >
 <Eye className="w-3 h-3" />
 </button>
 <span className="font-bold">{order.totalAmount.toLocaleString()} ج.م</span>
 </div>
 </div>
 {remaining > 0 && (
 <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-100 italic">
 <p className="text-[9px] text-[#44474D]">المتبقي:</p>
 <p className="text-[9px] text-red-600 font-bold">{remaining.toLocaleString()} ج.م</p>
 </div>
 )}
 </div>
 )
 })}
 {mySales?.length === 0 && (
 <div className="p-10 text-center text-gray-400 text-xs italic">لا توجد سجلات مبيعات بعد</div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'sales' && (
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <h3 className="text-lg font-bold text-black">سجل مبيعات المندوب</h3>
 <button 
  onClick={() => { setRequestId(crypto.randomUUID()); setSaleModalOpen(true); }}
 className="bg-green-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold -100 hover:bg-green-700 transition-all"
 >
 <Plus className="w-5 h-5" />
 تحرير فاتورة بيع جديدة
 </button>
 </div>

 <div className="bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden">
 <table className="w-full text-right">
 <thead>
 <tr className="bg-[#F9FAFB] border-b">
 <th className="p-4 text-sm font-bold text-[#44474D]">رقم الفاتورة</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">العميل</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">القيمة</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">التاريخ</th>
 <th className="p-4 text-sm font-bold text-[#44474D] text-left">الإجراءات</th>
 </tr>
 </thead>
 <tbody className="divide-y">
  {mySales?.map((order: { id: number; orderNumber: string; customerId: number; totalAmount: number; date: number }) => (
  <tr key={order.id} className="hover:bg-gray-50">
  <td className="p-4 font-bold">{order.orderNumber}</td>
  <td className="p-4">{customers?.find((c: any) => c.id === order.customerId)?.name}</td>
  <td className="p-4 font-bold">{order.totalAmount.toLocaleString()} ج.م</td>
  <td className="p-4 text-xs text-[#44474D]">{formatDate(order.date)}</td>
 <td className="p-4 text-left">
 <button 
 onClick={() => {
 setSelectedInvoice(order);
 setInvoiceOpen(true);
 }}
 className="p-2 text-black hover:bg-gray-100 rounded-lg transition-colors"
 title="عرض الفاتورة"
 >
 <Eye className="w-4 h-4" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {activeTab === 'requests' && (
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <h3 className="text-lg font-bold text-black">طلبات توريد مخزون جديد</h3>
 <button 
 onClick={() => setRequestModalOpen(true)}
 className="bg-black text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all"
 >
 <Plus className="w-5 h-5" />
 إنشاء طلب توريد جديد
 </button>
 </div>

 <div className="bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden">
 <table className="w-full text-right border-collapse">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#E0E3E5]">
 <th className="p-4 text-sm font-bold text-[#44474D]">رقم الطلب</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">عدد الأصناف</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">الحالة</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">التاريخ</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#F2F4F6]">
  {myRequests?.map((req: { id: number; status: string; date: number; items: { itemId: number; quantity: number }[] }) => {
  const isExpanded = expandedRequestId === req.id;
  return (
  <React.Fragment key={req.id}>
  <tr 
  className="hover:bg-[#F2F4F6] transition-colors cursor-pointer"
  onClick={() => setExpandedRequestId(isExpanded ? null : req.id!)}
  >
  <td className="p-4 font-bold">REQ-{req.id}</td>
  <td className="p-4">
 <p className="font-bold">{req.items.length} أصناف</p>
 <p className="text-[9px] text-blue-600 font-bold">
 {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
 </p>
 </td>
 <td className="p-4">
 {req.status === 'pending' && <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-1 rounded-full font-bold">قيد المراجعة</span>}
 {req.status === 'approved' && <span className="bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-full font-bold">تمت الموافقة</span>}
 {req.status === 'rejected' && <span className="bg-red-100 text-red-800 text-[10px] px-2 py-1 rounded-full font-bold">مرفوض</span>}
 </td>
 <td className="p-4 text-xs text-[#44474D]">{formatDate(req.date)}</td>
 </tr>
 {isExpanded && (
 <tr>
 <td colSpan={4} className="bg-gray-50/50 p-4 border-t">
 <div className="flex flex-wrap gap-2 mb-3">
 {req.items.map((reqItem: any, idx: number) => {
 const item = allItems?.find(i => i.id === reqItem.itemId);
 return (
 <div key={idx} className="bg-white border border-gray-100 px-3 py-2 rounded-xl flex items-center gap-3">
 <Package className="w-4 h-4 text-gray-300" />
 <div>
 <p className="text-xs font-bold text-black">{item?.name || 'صنف غير معروف'}</p>
 <p className="text-[10px] text-gray-500">الكمية المطلوبة: <span className="font-bold text-black">{reqItem.quantity}</span></p>
 </div>
 </div>
 );
 })}
 </div>
 <div className="flex justify-end">
 <button 
 onClick={(e) => {
 e.stopPropagation();
 const text = `*طلب توريد مخزون جديد*
رقم الطلب: REQ-${req.id}
المندوب: ${currentUser?.username}
التاريخ: ${formatDate(req.date)}
عدد الأصناف: ${req.items.length}`;
 window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
 }}
 className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition-all flex items-center gap-2"
 >
 <Send className="w-3.5 h-3.5" />
 إرسال للمدير للموافقة
 </button>
 </div>
 </td>
 </tr>
 )}
 </React.Fragment>
 );
 })}
 {myRequests?.length === 0 && (
 <tr>
 <td colSpan={4} className="p-10 text-center text-gray-400">لا توجد طلبات توريد حالية</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </motion.div>
 </AnimatePresence>

 <AnimatePresence>
 {isInvoiceOpen && selectedInvoice && (
 <SalesInvoiceModal 
 order={selectedInvoice} 
 onClose={() => setInvoiceOpen(false)} 
 />
 )}

 {excessPaymentModal && (
 <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60">
 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] w-full max-w-lg p-6 relative overflow-hidden text-right">
 <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -translate-y-16 translate-x-16" />
 
 <h3 className="text-2xl font-bold text-black mb-1">مبلغ إضافي مكتشف!</h3>
 <p className="text-sm text-gray-500 font-bold mb-6">لقد دفع العميل <span className="text-green-600">({excessAmount.toLocaleString()} ج.م)</span> زيادة عن قيمة الفاتورة الحالية.</p>
 
 <div className="space-y-4">
 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">توجيه المبلغ الزائد إلى:</p>
 
 {unpaidInvoices.length > 0 ? (
 <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
 {unpaidInvoices.map(order => (
 <button 
 key={order.id}
 onClick={async () => {
 const unpaidAmount = order.totalAmount - (order.paidAmount || 0);
 const amountToApply = Math.min(excessAmount, unpaidAmount);
 const newPaid = (order.paidAmount || 0) + amountToApply;
 
 try {
 await api(`/sales-orders/${order.id}/payments`, {
 method: 'POST',
 body: JSON.stringify({ amount: amountToApply, method: 'cash' }),
 });
 
 setExcessPaymentModal(false);
 setInvoiceOpen(true);
 qc.invalidateQueries({ queryKey: ['sales-orders'] });
 } catch (error) {
 console.error(error);
 toast.error('فشل تطبيق الدفعة');
 }
 }}
 className="w-full text-right p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:border-green-500 hover:bg-green-50 group transition-all"
 >
 <div className="flex justify-between items-center mb-1">
 <span className="text-xs font-bold text-black">فاتورة: {order.orderNumber}</span>
 <span className="text-[10px] text-gray-400">{formatDate(order.date)}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] text-red-500 font-bold">باقي عليها: {(order.totalAmount - (order.paidAmount || 0)).toLocaleString()} ج.م</span>
 <span className="text-xs font-bold text-green-600 group-hover:underline">سدد الآن</span>
 </div>
 </button>
 ))}
 </div>
 ) : (
 <div className="p-10 border-2 border-dashed border-gray-100 rounded-3xl text-center">
 <p className="text-xs text-gray-400 font-bold italic">لا توجد مديونيات سابقة لهذا العميل</p>
 </div>
 )}

 <button 
 onClick={() => {
 setExcessPaymentModal(false);
 setInvoiceOpen(true);
 }}
 className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm mt-4 hover:opacity-90 transition-opacity"
 >
 تجاهل وإظهار فاتورة اليوم فقط
 </button>
 </div>
 </motion.div>
 </div>
 )}

 {isCustomerModalOpen && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCustomerModalOpen(false)} className="absolute inset-0 bg-black/40" />
 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl p-6 relative z-10 overflow-hidden">
 <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
 <UserCircle className="w-6 h-6" />
 إضافة عميل جديد
 </h2>
   <form onSubmit={handleAddCustomer} className="space-y-4">
  <div className="space-y-2">
  <label className="text-sm font-bold text-[#44474D]">اسم العميل</label>
  <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none" placeholder="الاسم الرباعي" />
  </div>
  <div className="space-y-2">
  <label className="text-sm font-bold text-[#44474D]">رقم الهاتف</label>
  <input required type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none" placeholder="01xxxxxxxxx" />
  </div>
  <div className="space-y-2">
  <label className="text-sm font-bold text-[#44474D]">الموقع الجغرافي</label>
  <button 
  type="button" 
  onClick={captureLocation}
  disabled={isLocating}
  className={cn("w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all",
  newCustomer.latitude 
  ?"bg-green-100 text-green-600 border border-green-200" 
  :"bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
  )}
  >
  {isLocating ? (
  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent animate-spin rounded-full" />
  ) : (
  newCustomer.latitude ? <CheckCircle2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />
  )}
  {newCustomer.latitude ? 'تم تحديد الموقع بنجاح' : 'تحديد الموقع الجغرافي'}
  </button>
  </div>
  <div className="flex gap-3 pt-4">
  <LoadingButton
  type="submit"
  isPending={isSubmitting}
  loadingText="جاري الحفظ..."
  variant="primary"
  size="lg"
  className="w-full"
>
  حفظ العميل
</LoadingButton>
  <button type="button" onClick={() => setCustomerModalOpen(false)} className="flex-1 bg-gray-100 text-[#44474D] py-3 rounded-xl font-bold hover:bg-gray-200">إلغاء</button>
  </div>
  </form>
 </motion.div>
 </div>
 )}

 {isSaleModalOpen && (
 <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSaleModalOpen(false)} className="absolute inset-0 bg-black/40" />
 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-3xl p-6 relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar">
 <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
 <ShoppingCart className="w-6 h-6" />
 تحرير فاتورة بيع
 </h2>
 <form onSubmit={handleCreateSale} className="space-y-4">
 <div className="space-y-2">
 <div className="flex justify-between items-center">
 <label className="text-sm font-bold text-[#44474D]">اختيار العميل</label>
 <button 
 type="button"
 onClick={() => setCustomerModalOpen(true)}
 className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline"
 >
 <Plus className="w-3 h-3" />
 أضف عميل جديد
 </button>
 </div>
 <select 
 required 
 className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none"
 value={newSale.customerId}
 onChange={e => setNewSale({...newSale, customerId: parseInt(e.target.value)})}
 >
 <option value="">اختر العميل...</option>
 {customers?.map((c: any) => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
 </select>
 </div>

 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <label className="text-sm font-bold text-[#44474D]">إضافة أصناف من العهدة</label>
 <select 
 onChange={(e) => e.target.value !=="0" && addItemToSale(parseInt(e.target.value))}
 className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold outline-none"
 >
 <option value="0">اختر من عهدتي...</option>
 {myInventory?.map((inv: any) => {
 const item = allItems?.find(i => i.id === inv.itemId);
 return <option key={inv.id} value={inv.itemId}>{item?.name} (متاح: {inv.quantity})</option>
 })}
 </select>
 </div>

 <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
 {newSale.items.map((saleItem, idx) => {
 const itemDetails = allItems?.find(i => i.id === saleItem.itemId);
 const repStock = myInventory?.find((i: any) => i.itemId === saleItem.itemId)?.quantity || 0;
 
 return (
 <div key={idx} className="bg-gray-50 p-3 rounded-xl flex items-center justify-between gap-4 border border-gray-100">
 <div className="flex-1">
 <p className="font-bold text-sm text-black">{itemDetails?.name}</p>
 <p className="text-[10px] text-[#44474D]">سعر الوحدة: {saleItem.price} ج.م</p>
 </div>
 <div className="flex items-center gap-2">
 <input 
 type="number" 
 min="1"
 max={repStock}
 value={saleItem.quantity || ''}
 onChange={(e) => {
 const val = parseInt(e.target.value) || 0;
 const items = [...newSale.items];
 items[idx].quantity = Math.min(val, repStock);
 setNewSale({...newSale, items});
 }}
 className="w-16 bg-white border border-gray-200 rounded-lg p-1 text-center text-sm font-bold"
 />
 <button 
 type="button"
 onClick={() => {
 const items = newSale.items.filter((_, i) => i !== idx);
 setNewSale({...newSale, items});
 }}
 className="text-red-500 p-1 hover:bg-red-50 rounded-lg"
 >
 <Plus className="w-4 h-4 rotate-45" />
 </button>
 </div>
 </div>
 )
 })}
 {newSale.items.length === 0 && (
 <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
 <p className="text-xs text-gray-400">لم يتم اختيار أصناف بعد</p>
 </div>
 )}
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-bold text-[#44474D]">المبلغ المدفوع حالياً (ج.م)</label>
 <input 
 type="number" 
 value={newSale.paidAmount || ''} 
 onChange={e => setNewSale({...newSale, paidAmount: parseFloat(e.target.value) || 0})} 
 className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none font-bold text-green-600" 
 placeholder="0.00" 
 />
 <p className="text-[9px] text-[#44474D] font-bold">المتبقي سيتم تسجيله كـ"آجل" على حساب العميل</p>
 </div>

 <div className="bg-black text-white p-6 rounded-2xl flex justify-between items-center">
 <div>
 <p className="text-[10px] text-white/60">إجمالي الفاتورة</p>
 <h4 className="text-2xl font-bold">
 {newSale.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()} ج.م
 </h4>
 </div>
   <LoadingButton
   type="submit"
   isPending={createSaleMutation.isPending}
   loadingText="جاري الحفظ..."
   className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-sm"
   >
   تثبيت وبيع
   </LoadingButton>
 </div>
 </form>
 </motion.div>
 </div>
 )}

 {isRequestModalOpen && (
 <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRequestModalOpen(false)} className="absolute inset-0 bg-black/40" />
 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-3xl p-6 relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar">
 <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
 <ArrowRightLeft className="w-6 h-6" />
 طلب توريد بضاعة جديدة
 </h2>
 <form onSubmit={handleCreateRequest} className="space-y-4">
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <label className="text-sm font-bold text-[#44474D]">إضافة أصناف للطلب</label>
 <select 
 onChange={(e) => {
 const itemId = parseInt(e.target.value);
 if (itemId !== 0 && !newRequest.items.find(i => i.itemId === itemId)) {
 setNewRequest({...newRequest, items: [...newRequest.items, { itemId, quantity: 10 }]});
 }
 }}
 className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold outline-none"
 >
 <option value="0">اختر صنف...</option>
 {allItems?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
 </select>
 </div>

 <div className="space-y-2">
 {newRequest.items.map((reqItem, idx) => {
 const itemDetails = allItems?.find(i => i.id === reqItem.itemId);
 return (
 <div key={idx} className="bg-gray-50 p-4 rounded-xl flex items-center justify-between gap-4 border border-gray-100">
 <div className="flex-1">
 <p className="font-bold text-sm text-black">{itemDetails?.name}</p>
 <p className="text-[10px] text-[#44474D]">{itemDetails?.sku}</p>
 </div>
 <div className="flex items-center gap-2">
 <input 
 type="number" 
 min="1"
 value={reqItem.quantity || ''}
 onChange={(e) => {
 const val = parseInt(e.target.value) || 0;
 const items = [...newRequest.items];
 items[idx].quantity = val;
 setNewRequest({...newRequest, items});
 }}
 className="w-20 bg-white border border-gray-200 rounded-lg p-2 text-center text-sm font-bold"
 />
 <button 
 type="button"
 onClick={() => {
 const items = newRequest.items.filter((_, i) => i !== idx);
 setNewRequest({...newRequest, items});
 }}
 className="text-red-500 p-2"
 >
 <Plus className="w-4 h-4 rotate-45" />
 </button>
 </div>
 </div>
 )
 })}
 </div>
 </div>

 <div className="flex gap-4 pt-4 border-t">
 <LoadingButton
  type="submit"
  isPending={isSubmitting}
  loadingText="جاري الإرسال..."
  variant="primary"
  size="lg"
  className="w-full"
>
  إرسال الطلب للمراجعة
</LoadingButton>
 <button type="button" onClick={() => setRequestModalOpen(false)} className="flex-1 bg-gray-100 text-[#44474D] py-3 rounded-xl font-bold">إلغاء</button>
 </div>
 </form>
 </motion.div>
 </div>
 )}

 {isCollectionModalOpen && (
 <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCollectionModalOpen(false)} className="absolute inset-0 bg-black/40" />
 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl p-6 relative z-10">
 <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
 <Coins className="w-6 h-6 text-green-600" />
 تسجيل تحصيل نقدية
 </h2>
 <form onSubmit={handleCreateCollection} className="space-y-4">
 <div className="space-y-2">
 <label className="text-sm font-bold text-[#44474D]">العميل</label>
 <select 
 required 
 disabled
 className="w-full bg-gray-100 border-none rounded-xl py-3 px-4 outline-none font-bold cursor-not-allowed"
 value={newCollection.customerId}
 >
 {customers?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-[#44474D]">المبلغ المحصل (ج.م)</label>
 <input 
 required 
 type="number" 
 value={newCollection.amount || ''} 
 onChange={e => setNewCollection({...newCollection, amount: parseFloat(e.target.value)})} 
 className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none text-xl font-bold" 
 placeholder="0.00" 
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-[#44474D]">طريقة التحصيل</label>
 <select 
 className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none font-bold"
 value={newCollection.method}
 onChange={e => setNewCollection({...newCollection, method: e.target.value as any})}
 >
 <option value="cash">نقداً</option>
 <option value="transfer">تحويل بنكي</option>
 <option value="check">شيك</option>
 </select>
 </div>
 <p className="text-[10px] text-orange-600 font-bold bg-orange-50 p-2 rounded-lg">
 * سيتم تسجيل التحصيل كـ"قيد الانتظار" ولن يتم خصمه من مديونية العميل إلا بعد تأكيد الإدارة عند الاستلام.
 </p>
 <div className="flex gap-3 pt-4">
 <LoadingButton
  type="submit"
  isPending={isSubmitting}
  loadingText="جاري التسجيل..."
  variant="primary"
  size="lg"
  className="w-full"
>
  تسجيل الطلب
</LoadingButton>
 <button type="button" onClick={() => setCollectionModalOpen(false)} className="flex-1 bg-gray-100 text-[#44474D] py-3 rounded-xl font-bold">إلغاء</button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </WorkspaceLayout>
 );
}
