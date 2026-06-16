import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProtectedMutation } from '../hooks/useProtectedMutation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ArrowRightLeft, 
  UserCircle,
  MapPin,
  AlertCircle,
  Coins,
  ShoppingCart,
  CheckCircle2
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { toast } from 'sonner';
import SalesInvoiceModal from '../components/SalesInvoiceModal';
import { WorkspaceLayout, Tabs } from '../components/design-system';
import { useSalesReps, useSalesRep } from '../hooks/useSalesReps';
import { useInventory } from '../hooks/useInventory';
import { useCustomers, useCreateCustomer } from '../hooks/useCustomers';
import api from '../lib/api-client';
import { LoadingButton } from '../components/ui/LoadingButton';
import type { UserAccount } from '../types';

import { RepDashboardView } from '../components/sales-rep/RepDashboardView';
import { RepOverviewView } from '../components/sales-rep/RepOverviewView';
import { RepInventoryView } from '../components/sales-rep/RepInventoryView';
import { RepCustomersView } from '../components/sales-rep/RepCustomersView';
import { RepSalesView } from '../components/sales-rep/RepSalesView';
import { RepRequestsView } from '../components/sales-rep/RepRequestsView';

interface SalesRepPortalProps {
  currentUser?: UserAccount | null;
  activeTab?: 'dashboard' | 'inventory' | 'customers' | 'sales' | 'requests' | 'overview';
}

const PORTAL_TABS = [
  { id: 'dashboard', label: 'لوحة القيادة', icon: RepDashboardView.name ? UserCircle : UserCircle }, // dummy representation, icons are rendered dynamically inside Tabs
  { id: 'overview', label: 'نظرة عامة', icon: UserCircle },
  { id: 'inventory', label: 'عهدتي', icon: UserCircle },
  { id: 'customers', label: 'العملاء', icon: UserCircle },
  { id: 'sales', label: 'المبيعات', icon: UserCircle },
  { id: 'requests', label: 'الطلبات', icon: UserCircle },
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

  const [newRequest, setNewRequest] = useState({
    items: [] as { itemId: number; quantity: number }[]
  });

  const qc = useQueryClient();

  const { data: repsData } = useSalesReps();
  const reps = repsData?.items;

  const { data: singleRepData } = useSalesRep(
    currentUser?.role === 'rep' ? currentUser.repId : undefined
  );

  const selectedRep = currentUser?.role === 'rep'
    ? (singleRepData as any)?.data
    : reps?.find(r => r.id === selectedRepId);
  
  // Auto-resolve selectedRepId for rep users
  React.useEffect(() => {
    if (currentUser?.role === 'rep') {
      if (currentUser.repId) {
        setSelectedRepId(currentUser.repId);
      }
      return;
    }

    if (!reps || reps.length === 0) return;

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
  const unsettledAmount = (unsettledOrders as any)?.data as number | undefined;

  const { data: pendingSettlement } = useQuery({
    queryKey: ['pendingSettlement', selectedRepId],
    queryFn: () => api(`/payment-collections/pending-settlement?repId=${selectedRepId}`),
    enabled: !!selectedRepId,
    retry: false,
  });

  const { data: settledCommission } = useQuery<number>({
    queryKey: ['settledCommission', selectedRepId],
    queryFn: () => api<number>(`/sales-orders/settled-commission?repId=${selectedRepId}&commissionRate=${selectedRep?.commissionRate || 0}`),
    enabled: !!selectedRepId && !!selectedRep,
    retry: false,
  });

  const handleDaySettlement = async () => {
    if (!selectedRepId || (unsettledAmount ?? 0) <= 0) return;

    if ((pendingSettlement as any)?.data) {
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
  });

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

      await createSaleMutation.mutateAsync({
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
                type="button"
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
            type="button"
            onClick={() => setSelectedRepId(null)}
            className="bg-black text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-95"
          >
            العودة لاختيار مندوب
          </button>
        </div>
      );
    }
  }

  // Map icons for Tabs component dynamically
  const tabsWithIcons = PORTAL_TABS.map(tab => {
    let icon = UserCircle;
    if (tab.id === 'dashboard') icon = require('lucide-react').LayoutDashboard || UserCircle;
    else if (tab.id === 'overview') icon = require('lucide-react').ClipboardList || UserCircle;
    else if (tab.id === 'inventory') icon = require('lucide-react').Package || UserCircle;
    else if (tab.id === 'customers') icon = require('lucide-react').Users || UserCircle;
    else if (tab.id === 'sales') icon = require('lucide-react').ShoppingCart || UserCircle;
    else if (tab.id === 'requests') icon = require('lucide-react').ArrowRightLeft || UserCircle;
    return { ...tab, icon };
  });

  return (
    <WorkspaceLayout maxWidth="xl">
      {!propTab && (
        <>
          <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold">
                {selectedRep?.name?.[0] || 'R'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">{selectedRep?.name}</h2>
                <p className="text-sm text-[#44474D] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {selectedRep?.zone}
                </p>
              </div>
            </div>
            {currentUser?.role === 'admin' && (
              <button 
                type="button"
                onClick={() => setSelectedRepId(null)}
                className="text-[#44474D] hover:text-black flex items-center gap-2 text-sm font-bold transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                تغيير المندوب (أدمن)
              </button>
            )}
          </div>

          <Tabs
            tabs={tabsWithIcons}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab as any)}
          />
        </>
      )}

      {propTab && (
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-black font-tajawal">
            {propTab === 'dashboard' && 'سجل العمليات والنشاط'}
            {propTab === 'overview' && 'لوحة التحكم والمؤشرات'}
            {propTab === 'inventory' && 'عهدتي (المخزون)'}
            {propTab === 'customers' && 'إدارة العملاء'}
            {propTab === 'sales' && 'سجل عمليات البيع'}
            {propTab === 'requests' && 'طلبات توريد المخزون'}
          </h1>
          <p className="text-sm text-[#44474D] mt-0.5">مرحباً بك {selectedRep?.name} • {selectedRep?.zone}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mt-6"
        >
          {activeTab === 'dashboard' && (
            <RepDashboardView
              myInventory={myInventory}
              allItems={allItems}
              newCustomersToday={(newCustomersToday as any)?.data}
              salesCount={salesCount}
              myRequests={myRequests}
              activityLog={activityLog}
              customers={customers}
              onRenewRequest={(itemId) => {
                setNewRequest({ items: [{ itemId, quantity: 10 }] });
                setRequestModalOpen(true);
              }}
            />
          )}

          {activeTab === 'overview' && (
            <RepOverviewView
              monthSales={monthSales}
              selectedRep={selectedRep}
              myInventory={myInventory}
              settledCommission={(settledCommission as any)?.data}
              unsettledAmount={unsettledAmount}
              pendingSettlement={(pendingSettlement as any)?.data}
              onDaySettlement={handleDaySettlement}
            />
          )}

          {activeTab === 'inventory' && (
            <RepInventoryView
              myInventory={myInventory}
              allItems={allItems}
            />
          )}

          {activeTab === 'customers' && (
            <RepCustomersView
              customers={customers}
              mySales={mySales}
              onAddCustomer={() => setCustomerModalOpen(true)}
              onCollection={(customer) => {
                setNewCollection({ ...newCollection, customerId: customer.id! });
                setCollectionModalOpen(true);
              }}
            />
          )}

          {activeTab === 'sales' && (
            <RepSalesView
              mySales={mySales}
              customers={customers}
              onNewSale={() => {
                setRequestId(crypto.randomUUID());
                setSaleModalOpen(true);
              }}
              onViewInvoice={(order) => {
                setSelectedInvoice(order);
                setInvoiceOpen(true);
              }}
            />
          )}

          {activeTab === 'requests' && (
            <RepRequestsView
              myRequests={myRequests}
              allItems={allItems}
              currentUser={currentUser}
              onRequestNewStock={() => setRequestModalOpen(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
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
                        type="button"
                        key={order.id}
                        onClick={async () => {
                          const unpaidAmount = order.totalAmount - (order.paidAmount || 0);
                          const amountToApply = Math.min(excessAmount, unpaidAmount);
                          
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
                  type="button"
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
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-black">
                <UserCircle className="w-6 h-6 text-black" />
                إضافة عميل جديد
              </h2>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="space-y-2 text-right">
                  <label className="text-sm font-bold text-[#44474D]">اسم العميل</label>
                  <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none text-black text-sm" placeholder="الاسم الرباعي" />
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-sm font-bold text-[#44474D]">رقم الهاتف</label>
                  <input required type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none text-black text-sm" placeholder="01xxxxxxxxx" />
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-sm font-bold text-[#44474D]">الموقع الجغرافي</label>
                  <button 
                    type="button" 
                    onClick={captureLocation}
                    disabled={isLocating}
                    className={cn("w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-bold",
                      newCustomer.latitude 
                        ? "bg-green-100 text-green-600 border border-green-200" 
                        : "bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
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
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-black">
                <ShoppingCart className="w-6 h-6 text-black" />
                تحرير فاتورة بيع
              </h2>
              <form onSubmit={handleCreateSale} className="space-y-4">
                <div className="space-y-2 text-right">
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
                    className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none text-black text-sm font-bold"
                    value={newSale.customerId}
                    onChange={e => setNewSale({...newSale, customerId: parseInt(e.target.value)})}
                  >
                    <option value="">اختر العميل...</option>
                    {customers?.map((c: any) => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                  </select>
                </div>

                <div className="space-y-4 text-right">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-[#44474D]">إضافة أصناف من العهدة</label>
                    <select 
                      onChange={(e) => e.target.value !== "0" && addItemToSale(parseInt(e.target.value))}
                      className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold outline-none cursor-pointer"
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
                          <div className="flex-1 text-right">
                            <p className="font-bold text-sm text-black">{itemDetails?.name}</p>
                            <p className="text-[10px] text-[#44474D] mt-0.5">سعر الوحدة: {saleItem.price} ج.م</p>
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
                                const currentItem = items[idx];
                                if (currentItem) {
                                  currentItem.quantity = Math.min(val, repStock);
                                  setNewSale({...newSale, items});
                                }
                              }}
                              className="w-16 bg-white border border-gray-200 rounded-lg p-1 text-center text-sm font-bold text-black"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const items = newSale.items.filter((_, i) => i !== idx);
                                setNewSale({...newSale, items});
                              }}
                              className="text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Plus className="w-4 h-4 rotate-45" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {newSale.items.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-xs text-gray-400 font-bold italic">لم يتم اختيار أصناف بعد</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-right">
                  <label className="text-sm font-bold text-[#44474D]">المبلغ المدفوع حالياً (ج.م)</label>
                  <input 
                    type="number" 
                    value={newSale.paidAmount || ''} 
                    onChange={e => setNewSale({...newSale, paidAmount: parseFloat(e.target.value) || 0})} 
                    className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none font-bold text-green-600 text-lg" 
                    placeholder="0.00" 
                  />
                  <p className="text-[9px] text-[#44474D] font-bold mt-1">المتبقي سيتم تسجيله كـ"آجل" على حساب العميل</p>
                </div>

                <div className="bg-black text-white p-6 rounded-2xl flex justify-between items-center shadow-sm">
                  <div className="text-right">
                    <p className="text-[10px] text-white/60 font-bold">إجمالي الفاتورة</p>
                    <h4 className="text-2xl font-bold">
                      {newSale.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()} ج.م
                    </h4>
                  </div>
                  <LoadingButton
                    type="submit"
                    isPending={createSaleMutation.isPending}
                    loadingText="جاري الحفظ..."
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-sm transition-colors"
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
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-black">
                <ArrowRightLeft className="w-6 h-6 text-black" />
                طلب توريد بضاعة جديدة
              </h2>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div className="space-y-4 text-right">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-[#44474D]">إضافة أصناف للطلب</label>
                    <select 
                      onChange={(e) => {
                        const itemId = parseInt(e.target.value);
                        if (itemId !== 0 && !newRequest.items.find(i => i.itemId === itemId)) {
                          setNewRequest({...newRequest, items: [...newRequest.items, { itemId, quantity: 10 }]});
                        }
                      }}
                      className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="0">اختر صنف...</option>
                      {allItems?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                    {newRequest.items.map((reqItem, idx) => {
                      const itemDetails = allItems?.find(i => i.id === reqItem.itemId);
                      return (
                        <div key={idx} className="bg-gray-50 p-4 rounded-xl flex items-center justify-between gap-4 border border-gray-100">
                          <div className="flex-1 text-right">
                            <p className="font-bold text-sm text-black">{itemDetails?.name}</p>
                            <p className="text-[10px] text-[#44474D] mt-0.5">{itemDetails?.sku}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              min="1"
                              value={reqItem.quantity || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                const items = [...newRequest.items];
                                const currentItem = items[idx];
                                if (currentItem) {
                                  currentItem.quantity = val;
                                  setNewRequest({...newRequest, items});
                                }
                              }}
                              className="w-20 bg-white border border-gray-200 rounded-lg p-2 text-center text-sm font-bold text-black"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const items = newRequest.items.filter((_, i) => i !== idx);
                                setNewRequest({...newRequest, items});
                              }}
                              className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Plus className="w-4 h-4 rotate-45" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100">
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
                  <button type="button" onClick={() => setRequestModalOpen(false)} className="flex-1 bg-gray-100 text-[#44474D] py-3 rounded-xl font-bold hover:bg-gray-200">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isCollectionModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCollectionModalOpen(false)} className="absolute inset-0 bg-black/40" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl p-6 relative z-10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-black">
                <Coins className="w-6 h-6 text-green-600" />
                تسجيل تحصيل نقدية
              </h2>
              <form onSubmit={handleCreateCollection} className="space-y-4">
                <div className="space-y-2 text-right">
                  <label className="text-sm font-bold text-[#44474D]">العميل</label>
                  <select 
                    required 
                    disabled
                    className="w-full bg-gray-100 border-none rounded-xl py-3 px-4 outline-none font-bold cursor-not-allowed text-black text-sm"
                    value={newCollection.customerId}
                  >
                    {customers?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-sm font-bold text-[#44474D]">المبلغ المحصل (ج.م)</label>
                  <input 
                    required 
                    type="number" 
                    value={newCollection.amount || ''} 
                    onChange={e => setNewCollection({...newCollection, amount: parseFloat(e.target.value)})} 
                    className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none text-xl font-bold text-black" 
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-sm font-bold text-[#44474D]">طريقة التحصيل</label>
                  <select 
                    className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none font-bold text-black text-sm"
                    value={newCollection.method}
                    onChange={e => setNewCollection({...newCollection, method: e.target.value as any})}
                  >
                    <option value="cash">نقداً</option>
                    <option value="transfer">تحويل بنكي</option>
                    <option value="check">شيك</option>
                  </select>
                </div>
                <p className="text-[10px] text-orange-600 font-bold bg-orange-50 p-2 rounded-lg text-right">
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
                    تسجيل التحصيل
                  </LoadingButton>
                  <button type="button" onClick={() => setCollectionModalOpen(false)} className="flex-1 bg-gray-100 text-[#44474D] py-3 rounded-xl font-bold hover:bg-gray-200">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </WorkspaceLayout>
  );
}
