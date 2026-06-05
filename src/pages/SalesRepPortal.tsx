import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import type { UserAccount } from '../types';

interface SalesRepPortalProps {
 currentUser?: UserAccount | null;
 activeTab?: 'dashboard' | 'inventory' | 'customers' | 'sales' | 'requests' | 'overview';
}

const PORTAL_TABS = [
 { id: 'dashboard', label: '┘ä┘ê╪¡╪⌐ ╪º┘ä┘é┘è╪º╪»╪⌐', icon: LayoutDashboard },
 { id: 'overview', label: '┘å╪╕╪▒╪⌐ ╪╣╪º┘à╪⌐', icon: ClipboardList },
 { id: 'inventory', label: '╪╣┘ç╪»╪¬┘è', icon: Package },
 { id: 'customers', label: '╪º┘ä╪╣┘à┘ä╪º╪í', icon: Users },
 { id: 'sales', label: '╪º┘ä┘à╪¿┘è╪╣╪º╪¬', icon: ShoppingCart },
 { id: 'requests', label: '╪º┘ä╪╖┘ä╪¿╪º╪¬', icon: ArrowRightLeft },
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
 const [isCollectionModalOpen, setCollectionModalOpen] = useState(false);

 const [isInvoiceOpen, setInvoiceOpen] = useState(false);
 const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

 const [excessPaymentModal, setExcessPaymentModal] = useState(false);
 const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
 const [excessAmount, setExcessAmount] = useState(0);

 const [newCustomer, setNewCustomer] = useState({
 name: '',
 phone: '',
 email: '',
 address: '',
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
 
 React.useEffect(() => {
 if (reps && reps.length > 0) {
 if (!selectedRepId) {
 if (currentUser?.username === '1') {
 const mohamed = reps.find(r => r.name === '┘à╪¡┘à╪» ┘à╪¡┘à┘ê╪»');
 if (mohamed) {
 setSelectedRepId(mohamed.id!);
 return;
 }
 }
 
 const matchingRep = reps.find(r => 
 r.name.toLowerCase().includes(currentUser?.username.toLowerCase() || '') ||
 r.email?.toLowerCase().includes(currentUser?.username.toLowerCase() || '')
 );
 if (matchingRep) {
 setSelectedRepId(matchingRep.id!);
 return;
 }
 }

 if (selectedRepId !== null && !selectedRep) {
 const matchingRep = reps.find(r => 
 r.name.toLowerCase().includes(currentUser?.username.toLowerCase() || '') ||
 (currentUser?.username === '1' && r.name === '┘à╪¡┘à╪» ┘à╪¡┘à┘ê╪»')
 );
 if (matchingRep) {
 setSelectedRepId(matchingRep.id!);
 } else {
 setSelectedRepId(null);
 }
 }
 } else if (reps && reps.length === 0 && selectedRepId !== null) {
 setSelectedRepId(null);
 }
 }, [reps, selectedRep, selectedRepId, currentUser]);

 const { data: repInvData } = useQuery({
 queryKey: ['repInventory', selectedRepId],
 queryFn: () => api(`/rep-inventory?repId=${selectedRepId}`),
 enabled: !!selectedRepId,
 });
 const myInventory = repInvData as any[] | undefined;

 const { data: inventoryData } = useInventory();
 const allItems = inventoryData?.items;

 const { data: customersData } = useCustomers();
 const customers = customersData?.items;

 const { data: requestsData } = useQuery({
 queryKey: ['stockRequests', 'rep', selectedRepId],
 queryFn: () => api(`/stock-requests?repId=${selectedRepId}`),
 enabled: !!selectedRepId,
 });
 const myRequests = (requestsData as any)?.items;

 const { data: salesData } = useQuery({
 queryKey: ['salesOrders', 'rep', selectedRepId],
 queryFn: () => api(`/sales-orders?repId=${selectedRepId}`),
 enabled: !!selectedRepId,
 });
 const mySales = (salesData as any)?.orders;

  const { data: unsettledOrders } = useQuery({
  queryKey: ['unsettledOrders', selectedRepId],
  queryFn: () => api(`/sales-orders/unsettled?repId=${selectedRepId}`),
  enabled: !!selectedRepId,
  });
  const unsettledAmount = unsettledOrders as number | undefined;

  const { data: pendingSettlement } = useQuery({
  queryKey: ['pendingSettlement', selectedRepId],
  queryFn: () => api(`/payment-collections/pending-settlement?repId=${selectedRepId}`),
  enabled: !!selectedRepId,
  });

  const { data: settledCommission } = useQuery({
  queryKey: ['settledCommission', selectedRepId],
  queryFn: () => api(`/sales-orders/settled-commission?repId=${selectedRepId}&commissionRate=${selectedRep?.commissionRate || 0}`),
  enabled: !!selectedRepId && !!selectedRep,
  });

  const handleDaySettlement = async () => {
  if (!selectedRepId || (unsettledAmount ?? 0) <= 0) return;

  if (pendingSettlement) {
  toast.error('┘è┘ê╪¼╪» ╪╖┘ä╪¿ ╪¬╪│┘ê┘è╪⌐ ┘à╪╣┘ä┘é ╪¿╪º┘ä┘ü╪╣┘ä╪î ┘è╪▒╪¼┘ë ╪º┘å╪¬╪╕╪º╪▒ ╪º┘ä┘à╪▒╪º╪¼╪╣╪⌐');
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
  title: '╪╖┘ä╪¿ ╪¬╪│┘ê┘è╪⌐ ╪╣┘ç╪»╪⌐ ┘å┘é╪»┘è╪⌐',
  message: `╪º┘ä┘à┘å╪»┘ê╪¿ ${selectedRep?.name} ┘è╪╖┘ä╪¿ ╪¬╪│┘ê┘è╪⌐ ┘à╪¿┘ä╪║ ${unsettledAmount} ╪¼.┘à ╪¡╪╡┘è┘ä╪⌐ ╪º┘ä┘è┘ê┘à.`,
  type: 'warning',
  }),
  });

  await api('/activity-logs', {
  method: 'POST',
  body: JSON.stringify({
  userId: selectedRepId, username: selectedRep?.name || '',
  action: '╪╖┘ä╪¿ ╪¬╪│┘ê┘è╪⌐ ╪╣┘ç╪»╪⌐', entity: 'PaymentCollection',
  details: `╪╖┘ä╪¿ ╪¬╪│┘ê┘è╪⌐ ${unsettledAmount} ╪¼.┘à ┘ä┘ä╪«╪▓┘è┘å╪⌐`,
  timestamp: Date.now()
  }),
  });

  qc.invalidateQueries({ queryKey: ['pendingSettlement'] });
  qc.invalidateQueries({ queryKey: ['unsettledOrders'] });

  toast.success('╪¬┘à ╪Ñ╪▒╪│╪º┘ä ╪╖┘ä╪¿ ╪º┘ä╪¬┘ê╪▒┘è╪» ╪¿┘å╪¼╪º╪¡');
  } catch (error) {
  console.error(error);
  toast.error('┘ü╪┤┘ä ╪Ñ╪▒╪│╪º┘ä ╪º┘ä╪╖┘ä╪¿');
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
 queryKey: ['newCustomersToday'],
 queryFn: () => api<number>('/customers/count-today'),
 staleTime: 30_000,
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
 });
 const activityLog = activityLogsData;

 const createCustomer = useCreateCustomer();


 const createSaleMutation = useMutation({
 mutationFn: async (data: {
   customerId: number;
   items: { itemId: number; quantity: number; price: number }[];
   paidAmount: number;
   repId: number;
 }) => {
   const total = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

   const repOrderNumber = `REP-${Math.floor(10000 + Math.random() * 90000)}`;

   const orderRes = await api('/sales-orders', {
     method: 'POST',
     body: JSON.stringify({
       orderNumber: repOrderNumber,
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

   if (data.paidAmount > 0) {
     await api(`/sales-orders/${orderId}/payments`, {
       method: 'POST',
       body: JSON.stringify({ amount: Math.min(data.paidAmount, total), method: 'cash' }),
     });
   }

   await api('/notifications', {
     method: 'POST',
     body: JSON.stringify({
       title: '╪╣┘à┘ä┘è╪⌐ ╪¿┘è╪╣ ╪¼╪»┘è╪»╪⌐',
       message: `┘é╪º┘à ╪º┘ä┘à┘å╪»┘ê╪¿ ${selectedRep?.name} ╪¿╪¿┘è╪╣ ┘à╪¿┘ä╪║ ${total} ╪¼.┘à (┘à╪¡╪╡┘ä: ${Math.min(data.paidAmount, total)}).`,
       type: 'info',
     }),
   });

   for (const saleItem of data.items) {
     const repInvItem = myInventory?.find((i: any) => i.itemId === saleItem.itemId);
     if (!repInvItem || repInvItem.quantity < saleItem.quantity) {
       throw new Error(`╪▒╪╡┘è╪» ╪║┘è╪▒ ┘â╪º┘ü┘ì ┘ä┘ä╪╡┘å┘ü ID: ${saleItem.itemId}`);
     }
     
     await api(`/rep-inventory/${repInvItem.id}`, {
       method: 'PUT',
       body: JSON.stringify({ quantity: repInvItem.quantity - saleItem.quantity }),
     });
   }

   if (selectedRep && selectedRep.id) {
     await api(`/sales-reps/${selectedRep.id}`, {
       method: 'PUT',
       body: JSON.stringify({
         currentSales: (selectedRep.currentSales || 0) + total,
         balance: (selectedRep.balance || 0) + Math.min(data.paidAmount, total),
       }),
     });
   }

   await api('/activity-logs', {
     method: 'POST',
     body: JSON.stringify({
       userId: selectedRepId, username: selectedRep?.name || '',
       action: '╪¬╪│╪¼┘è┘ä ╪╣┘à┘ä┘è╪⌐ ╪¿┘è╪╣', entity: 'SalesOrder',
       entityId: orderId,
       details: `┘ü╪º╪¬┘ê╪▒╪⌐ ${repOrderNumber} ╪¿┘é┘è┘à╪⌐ ${total} ╪¼.┘à (┘à╪¡╪╡┘ä: ${Math.min(data.paidAmount, total)}) ┘ä┘ä╪╣┘à┘è┘ä ${customers?.find(c => c.id === data.customerId)?.name}`,
       timestamp: Date.now()
     }),
   });

   return { orderId, total, repOrderNumber };
 },
 onSuccess: () => {
   qc.invalidateQueries({ queryKey: ['sales-orders'] });
   qc.invalidateQueries({ queryKey: ['repInventory'] });
   qc.invalidateQueries({ queryKey: ['salesReps'] });
 },
 });
  const handleCreateRequest = async (e: React.FormEvent) => {
  e.preventDefault();
  if (newRequest.items.length === 0) return;

  const existingPending = myRequests?.find((r: { repId: number; status: string }) => r.repId === selectedRepId && r.status === 'pending');
  if (existingPending) {
   toast.error('┘ä╪»┘è┘â ╪╖┘ä╪¿ ╪¬┘ê╪▒┘è╪» ┘à╪╣┘ä┘é ╪¿╪º┘ä┘ü╪╣┘ä╪î ┘è╪▒╪¼┘ë ╪º┘å╪¬╪╕╪º╪▒ ╪º┘ä┘à╪▒╪º╪¼╪╣╪⌐');
   return;
  }

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
  title: '╪╖┘ä╪¿ ╪¬┘ê╪▒┘è╪» ╪¿╪╢╪º╪╣╪⌐ ╪¼╪»┘è╪»',
  message: `╪º┘ä┘à┘å╪»┘ê╪¿ ${currentUser?.username} ╪ú╪▒╪│┘ä ╪╖┘ä╪¿ ╪¬┘ê╪▒┘è╪» ╪¿╪╢╪º╪╣╪⌐ ╪¼╪»┘è╪».`,
  type: 'info',
  }),
  });

  await api('/activity-logs', {
  method: 'POST',
  body: JSON.stringify({
  userId: selectedRepId!, username: selectedRep?.name || '',
  action: '╪╖┘ä╪¿ ╪¬┘ê╪▒┘è╪» ╪¿╪╢╪º╪╣╪⌐', entity: 'StockRequest',
  entityId: (requestRes as any)?.data?.id || (requestRes as any)?.id,
  details: `╪╖┘ä╪¿ ╪¬┘ê╪▒┘è╪» ${newRequest.items.length} ╪ú╪╡┘å╪º┘ü`,
  timestamp: Date.now()
  }),
  });

  qc.invalidateQueries({ queryKey: ['stockRequests'] });

  setRequestModalOpen(false);
  setNewRequest({ items: [] });
  toast.success('╪¬┘à ╪Ñ╪▒╪│╪º┘ä ╪╖┘ä╪¿ ╪º┘ä╪¬┘ê╪▒┘è╪» ┘ä┘ä┘à╪«╪▓┘å ╪¿┘å╪¼╪º╪¡');
  } catch (error) {
  console.error(error);
  toast.error('┘ü╪┤┘ä ╪Ñ╪▒╪│╪º┘ä ╪º┘ä╪╖┘ä╪¿');
  }
  };

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
 <h1 className="text-3xl font-bold text-black">╪¿┘ê╪º╪¿╪⌐ ╪º┘ä┘à┘å╪»┘ê╪¿┘è┘å</h1>
 <p className="text-[#44474D]">┘è╪▒╪¼┘ë ╪º╪«╪¬┘è╪º╪▒ ┘à┘ä┘ü┘â ╪º┘ä╪┤╪«╪╡┘è ┘ä┘ä╪»╪«┘ê┘ä ╪Ñ┘ä┘ë ┘ä┘ê╪¡╪⌐ ╪º┘ä╪¬╪¡┘â┘à ╪º┘ä╪«╪º╪╡╪⌐ ╪¿┘â</p>
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
 <span className="text-sm font-bold text-[#44474D]">┘è╪¬┘à ╪Ñ╪╢╪º┘ü╪⌐ ┘à┘å╪º╪»┘è╪¿ ╪¼╪»╪» ┘à┘å ┘ä┘ê╪¡╪⌐ ╪¬╪¡┘â┘à ╪º┘ä┘à╪»┘è╪▒</span>
 </div>
 </div>
 </div>
 );
 }

 if (selectedRepId && !selectedRep) {
 return (
 <div className="p-12 text-center space-y-4">
 <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
 <h2 className="text-xl font-bold">╪╣┘ü┘ê╪º┘ï╪î ┘ä┘à ┘è╪¬┘à ╪º┘ä╪╣╪½┘ê╪▒ ╪╣┘ä┘ë ┘à┘ä┘ü ╪º┘ä┘à┘å╪»┘ê╪¿</h2>
 <p className="text-[#44474D]">┘è╪¿╪»┘ê ╪ú┘å ╪│╪¼┘ä ╪º┘ä┘à┘å╪»┘ê╪¿ ╪º┘ä╪«╪º╪╡ ╪¿┘â ┘é╪» ╪¬┘à ╪¡╪░┘ü┘ç ╪ú┘ê ┘ä┘à ┘è╪¬┘à ╪Ñ┘å╪┤╪º╪ñ┘ç ╪¿╪╣╪».</p>
 {currentUser?.role === 'admin' ? (
 <button 
 onClick={() => setSelectedRepId(null)}
 className="bg-black text-white px-6 py-2 rounded-xl font-bold"
 >
 ╪º┘ä╪╣┘ê╪»╪⌐ ┘ä╪º╪«╪¬┘è╪º╪▒ ┘à┘å╪»┘ê╪¿
 </button>
 ) : (
 <p className="text-sm font-bold text-black font-tajawal">┘è╪▒╪¼┘ë ╪º┘ä╪¬┘ê╪º╪╡┘ä ┘à╪╣ ╪º┘ä╪Ñ╪»╪º╪▒╪⌐ ┘ä╪¬┘ü╪╣┘è┘ä ╪¡╪│╪º╪¿┘â ┘â┘à┘å╪»┘ê╪¿.</p>
 )}
 </div>
 );
 }

 const handleAddCustomer = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newCustomer.name) {
 toast.error('┘è╪▒╪¼┘ë ╪Ñ╪»╪«╪º┘ä ╪º╪│┘à ╪º┘ä╪╣┘à┘è┘ä');
 return;
 }

 try {
 setIsSubmitting(true);
 await createCustomer.mutateAsync({
 ...newCustomer,
 createdAt: Date.now()
 } as any);
 
 toast.success('╪¬┘à╪¬ ╪Ñ╪╢╪º┘ü╪⌐ ╪º┘ä╪╣┘à┘è┘ä ╪¿┘å╪¼╪º╪¡');
 setCustomerModalOpen(false);
 setNewCustomer({ 
 name: '', 
 phone: '', 
 email: '', 
 address: '', 
 latitude: undefined, 
 longitude: undefined 
 });
 } catch (error) {
 console.error(error);
 toast.error('┘ü╪┤┘ä ╪Ñ╪╢╪º┘ü╪⌐ ╪º┘ä╪╣┘à┘è┘ä');
 } finally {
 setIsSubmitting(false);
 }
 };

 const captureLocation = () => {
 if (!navigator.geolocation) {
 toast.error('┘à╪¬╪╡┘ü╪¡┘â ┘ä╪º ┘è╪»╪╣┘à ╪¬╪¡╪»┘è╪» ╪º┘ä┘à┘ê┘é╪╣');
 return;
 }

 setIsLocating(true);
 navigator.geolocation.getCurrentPosition(
 (position) => {
 setNewCustomer({
 ...newCustomer,
 latitude: position.coords.latitude,
 longitude: position.coords.longitude
 });
 toast.success('╪¬┘à ╪¬╪¡╪»┘è╪» ╪º┘ä┘à┘ê┘é╪╣ ╪¿┘å╪¼╪º╪¡');
 setIsLocating(false);
 },
 (error) => {
 console.error('Geolocation error:', error);
 toast.error('┘ü╪┤┘ä ╪¬╪¡╪»┘è╪» ╪º┘ä┘à┘ê┘é╪╣. ╪¬╪ú┘â╪» ┘à┘å ╪¬┘ü╪╣┘è┘ä ╪º┘ä┘Ç GPS ┘ê╪Ñ╪╣╪╖╪º╪í ╪º┘ä╪Ñ╪░┘å ┘ä┘ä┘à╪¬╪╡┘ü╪¡.');
 setIsLocating(false);
 },
 { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
 );
 };

 const handleCreateSale = async (e: React.FormEvent) => {
 e.preventDefault();
 if (newSale.items.length === 0 || !newSale.customerId) {
 toast.error('┘è╪▒╪¼┘ë ╪Ñ╪╢╪º┘ü╪⌐ ╪ú╪╡┘å╪º┘ü ┘ê╪º╪«╪¬┘è╪º╪▒ ╪╣┘à┘è┘ä');
 return;
 }

 if (newSale.items.some(i => i.quantity <= 0)) {
 toast.error('╪º┘ä┘â┘à┘è╪º╪¬ ┘è╪¼╪¿ ╪ú┘å ╪¬┘â┘ê┘å ╪ú┘â╪¿╪▒ ┘à┘å ╪╡┘ü╪▒');
 return;
 }

 try {
 const total = newSale.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
 
 if (newSale.paidAmount > total) {
 setExcessAmount(newSale.paidAmount - total);
 await fetchUnpaidInvoices(newSale.customerId);
 setExcessPaymentModal(true);
 }

 const result = await createSaleMutation.mutateAsync({
   customerId: newSale.customerId,
   items: newSale.items,
   paidAmount: newSale.paidAmount,
   repId: selectedRepId!,
 });

 toast.success('╪¬┘à ╪¬╪│╪¼┘è┘ä ╪╣┘à┘ä┘è╪⌐ ╪º┘ä╪¿┘è╪╣ ╪¿┘å╪¼╪º╪¡');
 setSaleModalOpen(false);
 setNewSale({ customerId: 0, items: [], paidAmount: 0 });
 
 if (newSale.paidAmount <= total) {
 const lastOrderRes = await api(`/sales-orders?repId=${selectedRepId}&pageSize=1`);
 const lastOrders = (lastOrderRes as any)?.orders || [];
 setSelectedInvoice(lastOrders[0]);
 setInvoiceOpen(true);
 }
 } catch (error: any) {
 console.error(error);
 toast.error(error.message || '┘ü╪┤┘ä ╪¬╪│╪¼┘è┘ä ╪╣┘à┘ä┘è╪⌐ ╪º┘ä╪¿┘è╪╣');
 }
 };

 const handleCreateCollection = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newCollection.customerId || newCollection.amount <= 0) return;

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
 title: '╪¬╪¡╪╡┘è┘ä ╪¼╪»┘è╪»',
 message: `┘é╪º┘à ╪º┘ä┘à┘å╪»┘ê╪¿ ${selectedRep?.name} ╪¿╪¬╪│╪¼┘è┘ä ╪¬╪¡╪╡┘è┘ä ╪¿┘é┘è┘à╪⌐ ${newCollection.amount} ╪¼.┘à ┘à┘å ${customers?.find(c => c.id === newCollection.customerId)?.name}. ┘è╪▒╪¼┘ë ╪º┘ä┘à╪▒╪º╪¼╪╣╪⌐ ┘ê╪º┘ä╪¬╪ú┘â┘è╪».`,
 type: 'info',
 }),
 });

 setCollectionModalOpen(false);
 setNewCollection({ customerId: 0, amount: 0, method: 'cash' });
 toast.success('╪¬┘à ╪¬╪│╪¼┘è┘ä ╪º┘ä╪¬╪¡╪╡┘è┘ä ╪¿┘å╪¼╪º╪¡');
 } catch (error) {
 console.error(error);
 toast.error('┘ü╪┤┘ä ╪¬╪│╪¼┘è┘ä ╪º┘ä╪¬╪¡╪╡┘è┘ä');
 }
 };

 const addItemToSale = (itemId: number) => {
 const item = allItems?.find(i => i.id === itemId);
 if (!item) return;

 const repStock = myInventory?.find((i: any) => i.itemId === itemId)?.quantity || 0;
 if (repStock <= 0) {
 toast.error('┘ä╪º ┘è┘ê╪¼╪» ╪▒╪╡┘è╪» ┘â╪º┘ü┘ì ┘ü┘è ╪╣┘ç╪»╪¬┘â ┘ä┘ç╪░╪º ╪º┘ä╪╡┘å┘ü');
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
 ╪¬╪║┘è┘è╪▒ ╪º┘ä┘à┘å╪»┘ê╪¿ (╪ú╪»┘à┘å)
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
 {propTab === 'dashboard' && '╪│╪¼┘ä ╪º┘ä╪╣┘à┘ä┘è╪º╪¬ ┘ê╪º┘ä┘å╪┤╪º╪╖'}
 {propTab === 'overview' && '┘ä┘ê╪¡╪⌐ ╪º┘ä╪¬╪¡┘â┘à ┘ê╪º┘ä┘à╪ñ╪┤╪▒╪º╪¬'}
 {propTab === 'inventory' && '╪╣┘ç╪»╪¬┘è (╪º┘ä┘à╪«╪▓┘ê┘å)'}
 {propTab === 'customers' && '╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä╪╣┘à┘ä╪º╪í'}
 {propTab === 'sales' && '╪│╪¼┘ä ╪╣┘à┘ä┘è╪º╪¬ ╪º┘ä╪¿┘è╪╣'}
 {propTab === 'requests' && '╪╖┘ä╪¿╪º╪¬ ╪¬┘ê╪▒┘è╪» ╪º┘ä┘à╪«╪▓┘ê┘å'}
 </h1>
 <p className="text-sm text-[#44474D]">┘à╪▒╪¡╪¿╪º┘ï ╪¿┘â {selectedRep?.name} ΓÇó {selectedRep?.zone}</p>
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
 ╪ú╪╡┘å╪º┘ü ╪ú┘ê╪┤┘â╪¬ ╪╣┘ä┘ë ╪º┘ä╪º┘å╪¬┘ç╪º╪í ┘ü┘è ╪╣┘ç╪»╪¬┘â
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
 <p className="font-bold text-sm text-black">{item?.name || '╪╡┘å┘ü ╪║┘è╪▒ ┘à╪╣╪▒┘ê┘ü'}</p>
 <p className="text-[10px] text-[#44474D]">╪º┘ä┘â┘à┘è╪⌐ ╪º┘ä╪¡╪º┘ä┘è╪⌐: <span className="text-red-600 font-bold">{inv.quantity}</span></p>
 </div>
 </div>
 <button 
 onClick={() => {
 setNewRequest({ items: [{ itemId: inv.itemId, quantity: 10 }] });
 setRequestModalOpen(true);
 }}
 className="bg-black text-white px-4 py-1.5 rounded-lg text-[10px] font-bold hover:opacity-80 transition-opacity"
 >
 ╪¬╪¼╪»┘è╪» ╪º┘ä╪╖┘ä╪¿
 </button>
 </div>
 )
 })}
 {myInventory?.filter((inv: any) => inv.quantity < 5).length === 0 && (
 <div className="p-10 text-center text-[#44474D] text-xs">┘ä╪º ╪¬┘ê╪¼╪» ╪ú╪╡┘å╪º┘ü ┘à┘å╪«┘ü╪╢╪⌐ ╪º┘ä┘à╪«╪▓┘ê┘å ╪¡╪º┘ä┘è╪º┘ï</div>
 )}
 </div>
 </div>

 <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-4">
 <h3 className="font-bold text-black">┘à┘ä╪«╪╡ ╪º┘ä╪ú╪»╪º╪í ╪º┘ä╪│╪▒┘è╪╣</h3>
 <div className="space-y-4">
 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
 <span className="text-xs font-bold text-[#44474D]">╪╣╪»╪» ╪º┘ä╪╣┘à┘ä╪º╪í ╪º┘ä╪¼╪»╪» ╪º┘ä┘è┘ê┘à</span>
 <span className="font-bold">{newCustomersToday ?? 0}</span>
 </div>
 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
 <span className="text-xs font-bold text-[#44474D]">╪º┘ä┘à╪¿┘è╪╣╪º╪¬ ╪º┘ä┘à┘â╪¬┘à┘ä╪⌐</span>
 <span className="font-bold text-green-600">{salesCount ?? 0}</span>
 </div>
 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
 <span className="text-xs font-bold text-[#44474D]">╪╖┘ä╪¿╪º╪¬ ╪º┘ä╪¬┘ê╪▒┘è╪»</span>
 <span className="font-bold text-blue-600">{myRequests?.length || 0}</span>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden">
 <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
 <h3 className="font-bold text-black flex items-center gap-2">
 <ClipboardList className="w-5 h-5 text-blue-600" />
 ╪│╪¼┘ä ╪º┘ä╪╣┘à┘ä┘è╪º╪¬ ┘ê╪ó╪«╪▒ ╪º┘ä╪¬╪¡╪▒┘â╪º╪¬
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
 {activity.type === 'sale' ? `╪╣┘à┘ä┘è╪⌐ ╪¿┘è╪╣ ╪▒┘é┘à ${activity.orderNumber}` : `╪º╪│╪¬┘ä╪º┘à ╪¿╪╢╪º╪╣╪⌐ ╪▒┘é┘à ${activity.transferNumber}`}
 </p>
 <p className="text-[10px] text-[#44474D]">
 {activity.type === 'sale' ? `╪º┘ä╪╣┘à┘è┘ä: ${customers?.find(c => c.id === activity.customerId)?.name || '╪║┘è╪▒ ┘à╪╣╪▒┘ê┘ü'}` : `╪╣╪»╪» ╪º┘ä╪ú╪╡┘å╪º┘ü: ${activity.items?.length || 0}`}
 </p>
 </div>
 </div>
 <div className="text-left">
 <p className="text-[10px] text-[#44474D]">{formatDate(activity.date)}</p>
 <p className={cn("text-xs font-bold",
 activity.type === 'sale' ?"text-green-600" :"text-blue-600"
 )}>
 {activity.type === 'sale' ? `+ ${activity.totalAmount} ╪¼.┘à` : '╪º╪│╪¬┘ä╪º┘à ┘à╪«╪▓┘å┘è'}
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
 <p className="text-sm font-bold text-[#44474D]">┘à╪¿┘è╪╣╪º╪¬┘â ┘ç╪░╪º ╪º┘ä╪┤┘ç╪▒</p>
 <h3 className="text-3xl font-bold text-black">{(monthSales || 0).toLocaleString()} <span className="text-sm">╪¼.┘à</span></h3>
 <div className="w-full bg-gray-100 h-2 rounded-full mt-4">
 <div 
 className="bg-black h-full rounded-full" 
 style={{ width: `${Math.min(100, ((monthSales || 0) / (selectedRep?.target ?? 1))) * 100}%` }}
 />
 </div>
 <p className="text-[10px] text-[#44474D] text-left">
 ╪º┘ä┘à╪│╪¬┘ç╪»┘ü ╪º┘ä╪┤┘ç╪▒┘è: {(selectedRep?.target || 0).toLocaleString()} ╪¼.┘à
 </p>
 </div>

 <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-2">
 <p className="text-sm font-bold text-[#44474D]">╪╣╪»╪» ╪º┘ä╪ú╪╡┘å╪º┘ü ┘ü┘è ╪º┘ä╪╣┘ç╪»╪⌐</p>
 <h3 className="text-3xl font-bold text-black">{myInventory?.length || 0}</h3>
 <p className="text-xs text-green-600 flex items-center gap-1">
 <CheckCircle2 className="w-3 h-3" />
 ╪¼┘à┘è╪╣ ╪º┘ä╪ú╪╡┘å╪º┘ü ┘à╪¬┘ê┘ü╪▒╪⌐
 </p>
 </div>

  <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-2">
  <p className="text-sm font-bold text-[#44474D]">╪º┘ä╪╣┘à┘ê┘ä╪⌐ ╪º┘ä┘à╪¡┘é┘é╪⌐ (┘à┘å ╪º┘ä┘à╪¿┘è╪╣╪º╪¬ ╪º┘ä┘à╪│┘ê┘æ╪º╪⌐)</p>
  <h3 className="text-3xl font-bold text-black">
  {((settledCommission as number) || 0).toLocaleString()} <span className="text-sm">╪¼.┘à</span>
  </h3>
  <p className="text-xs text-[#44474D]">╪¿┘à╪╣╪»┘ä ╪╣┘à┘ê┘ä╪⌐ {selectedRep?.commissionRate || 0}% ╪╣┘ä┘ë ╪º┘ä┘à╪¿┘è╪╣╪º╪¬ ╪º┘ä┘à╪│┘ê┘æ╪º╪⌐ ┘ü┘é╪╖</p>
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
 <span className="text-sm font-bold text-white/80">┘à┘ä╪«╪╡ ╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘è┘ê┘à┘è╪⌐</span>
 </div>
 <h3 className="text-4xl font-bold mb-1">{(unsettledAmount || 0).toLocaleString()} <span className="text-lg">╪¼.┘à</span></h3>
 <p className="text-sm text-white/60 font-bold">╪Ñ╪¼┘à╪º┘ä┘è ┘à╪¿╪º┘ä╪║ ┘ü┘è ╪¡┘ê╪▓╪¬┘â ┘ä┘à ┘è╪¬┘à ╪¬┘ê╪▒┘è╪»┘ç╪º ┘ä┘ä╪«╪▓┘è┘å╪⌐</p>
 </div>
 
 <div className="flex flex-col gap-3 w-full md:w-auto">
 {pendingSettlement ? (
 <div className="bg-orange-500/20 border border-orange-500/30 px-6 py-4 rounded-2xl flex items-center gap-4">
 <Clock className="w-6 h-6 text-orange-500 animate-pulse" />
 <div>
 <p className="text-sm font-bold text-orange-500">╪╖┘ä╪¿ ╪º┘ä╪¬┘ê╪▒┘è╪» ┘é┘è╪» ╪º┘ä┘à╪▒╪º╪¼╪╣╪⌐</p>
 <p className="text-[10px] text-white/50">╪¿╪º┘å╪¬╪╕╪º╪▒ ╪¬╪ú┘â┘è╪» ╪º┘ä╪º╪│╪¬┘ä╪º┘à ┘à┘å ╪º┘ä╪Ñ╪»╪º╪▒╪⌐</p>
 </div>
 </div>
 ) : (
 <button 
 onClick={handleDaySettlement}
 disabled={(unsettledAmount ?? 0) <= 0}
 className="bg-white text-black px-10 py-4 rounded-2xl font-bold text-sm hover:bg-green-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
 >
 {(unsettledAmount ?? 0) > 0 ? '╪¬┘ê╪▒┘è╪» ╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘è┘ê┘à ┘ä┘ä╪«╪▓┘è┘å╪⌐' : '┘ä╪º ╪¬┘ê╪¼╪» ╪¬╪¡╪╡┘è┘ä╪º╪¬ ┘ä┘ä╪¬┘ê╪▒┘è╪»'}
 </button>
 )}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <div className="bg-white p-6 rounded-2xl border border-[#E0E3E5] space-y-4">
 <h4 className="font-bold text-black flex items-center gap-2">
 <ClipboardList className="w-5 h-5" />
 ╪¬┘å╪¿┘è┘ç╪º╪¬ ┘ç╪º┘à╪⌐
 </h4>
 <div className="space-y-3">
 {myInventory?.some((i: any) => i.quantity < 5) ? (
 <div className="flex gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100 text-orange-800">
 <AlertCircle className="w-5 h-5 shrink-0" />
 <div>
 <p className="text-sm font-bold">┘à╪«╪▓┘ê┘å ┘à┘å╪«┘ü╪╢</p>
 <p className="text-xs">╪¬┘ê╪¼╪» ╪ú╪╡┘å╪º┘ü ┘ü┘è ╪╣┘ç╪»╪¬┘â ┘ê╪╡┘ä╪¬ ┘ä┘ä╪¡╪» ╪º┘ä╪ú╪»┘å┘ë╪î ┘è╪▒╪¼┘ë ╪╖┘ä╪¿ ╪¬┘ê╪▒┘è╪».</p>
 </div>
 </div>
 ) : (
 <div className="flex gap-4 p-4 bg-green-50 rounded-xl border border-green-100 text-green-800">
 <CheckCircle2 className="w-5 h-5 shrink-0" />
 <div>
 <p className="text-sm font-bold">╪¡╪º┘ä╪⌐ ╪º┘ä┘à╪«╪▓┘ê┘å ┘à┘à╪¬╪º╪▓╪⌐</p>
 <p className="text-xs">╪▒╪╡┘è╪» ╪╣┘ç╪»╪¬┘â ┘â╪º┘ü┘ì ┘ä╪╣┘à┘ä┘è╪º╪¬ ╪º┘ä╪¿┘è╪╣ ╪º┘ä┘è┘ê┘à.</p>
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
 placeholder="╪¿╪¡╪½ ┘ü┘è ╪º┘ä╪╣┘ç╪»╪⌐..."
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
 <th className="p-4 text-sm font-bold text-[#44474D]">╪º╪│┘à ╪º┘ä╪╡┘å┘ü</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">╪º┘ä┘â┘à┘è╪⌐ ╪º┘ä┘à╪¬┘ê┘ü╪▒╪⌐</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">╪º┘ä╪│╪╣╪▒ ╪º┘ä┘à┘é╪¬╪▒╪¡</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">╪º┘ä╪¡╪º┘ä╪⌐</th>
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
 <td className="p-4">{item.sellingPrice} ╪¼.┘à</td>
 <td className="p-4">
 {inv.quantity < 5 ? (
 <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-1 rounded-full font-bold">┘à┘å╪«┘ü╪╢</span>
 ) : (
 <span className="bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-full font-bold">┘à╪¬┘ê┘ü╪▒</span>
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
 placeholder="╪¿╪¡╪½ ┘ü┘è ╪º┘ä╪╣┘à┘ä╪º╪í..."
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
 ╪Ñ╪╢╪º┘ü╪⌐ ╪╣┘à┘è┘ä ╪¼╪»┘è╪»
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
 <div className="flex items-center gap-2 text-xs text-[#44474D]">
 <MapPin className="w-3 h-3" />
 {customer.address}
 </div>
 {customer.latitude && customer.longitude && (
 <a 
 href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`}
 target="_blank"
 rel="noreferrer"
 className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
 title="╪╣╪▒╪╢ ╪º┘ä┘à┘ê┘é╪╣ ╪╣┘ä┘ë ╪º┘ä╪«╪▒┘è╪╖╪⌐"
 >
 <MapPin className="w-4 h-4 text-red-500" />
 </a>
 )}
 </div>
 <button 
 onClick={() => {
 setNewCollection({...newCollection, customerId: customer.id!});
 setCollectionModalOpen(true);
 }}
 className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
 title="╪¬╪│╪¼┘è┘ä ╪¬╪¡╪╡┘è┘ä"
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
 ╪ó╪«╪▒ ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä╪╣┘à┘ä╪º╪í (╪º┘ä┘à╪¿┘è╪╣╪º╪¬)
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
 {order.paymentStatus === 'paid' ? '╪«╪º┘ä╪╡' : (order.paymentStatus === 'partial' ? '╪¼╪▓╪ª┘è' : '╪ó╪¼┘ä')}
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
 title="╪╣╪▒╪╢ ╪º┘ä┘ü╪º╪¬┘ê╪▒╪⌐"
 >
 <Eye className="w-3 h-3" />
 </button>
 <span className="font-bold">{order.totalAmount.toLocaleString()} ╪¼.┘à</span>
 </div>
 </div>
 {remaining > 0 && (
 <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-100 italic">
 <p className="text-[9px] text-[#44474D]">╪º┘ä┘à╪¬╪¿┘é┘è:</p>
 <p className="text-[9px] text-red-600 font-bold">{remaining.toLocaleString()} ╪¼.┘à</p>
 </div>
 )}
 </div>
 )
 })}
 {mySales?.length === 0 && (
 <div className="p-10 text-center text-gray-400 text-xs italic">┘ä╪º ╪¬┘ê╪¼╪» ╪│╪¼┘ä╪º╪¬ ┘à╪¿┘è╪╣╪º╪¬ ╪¿╪╣╪»</div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'sales' && (
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <h3 className="text-lg font-bold text-black">╪│╪¼┘ä ┘à╪¿┘è╪╣╪º╪¬ ╪º┘ä┘à┘å╪»┘ê╪¿</h3>
 <button 
 onClick={() => setSaleModalOpen(true)}
 className="bg-green-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold -100 hover:bg-green-700 transition-all"
 >
 <Plus className="w-5 h-5" />
 ╪¬╪¡╪▒┘è╪▒ ┘ü╪º╪¬┘ê╪▒╪⌐ ╪¿┘è╪╣ ╪¼╪»┘è╪»╪⌐
 </button>
 </div>

 <div className="bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden">
 <table className="w-full text-right">
 <thead>
 <tr className="bg-[#F9FAFB] border-b">
 <th className="p-4 text-sm font-bold text-[#44474D]">╪▒┘é┘à ╪º┘ä┘ü╪º╪¬┘ê╪▒╪⌐</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">╪º┘ä╪╣┘à┘è┘ä</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">╪º┘ä┘é┘è┘à╪⌐</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">╪º┘ä╪¬╪º╪▒┘è╪«</th>
 <th className="p-4 text-sm font-bold text-[#44474D] text-left">╪º┘ä╪Ñ╪¼╪▒╪º╪í╪º╪¬</th>
 </tr>
 </thead>
 <tbody className="divide-y">
  {mySales?.map((order: { id: number; orderNumber: string; customerId: number; totalAmount: number; date: number }) => (
  <tr key={order.id} className="hover:bg-gray-50">
  <td className="p-4 font-bold">{order.orderNumber}</td>
  <td className="p-4">{customers?.find((c: any) => c.id === order.customerId)?.name}</td>
  <td className="p-4 font-bold">{order.totalAmount.toLocaleString()} ╪¼.┘à</td>
  <td className="p-4 text-xs text-[#44474D]">{formatDate(order.date)}</td>
 <td className="p-4 text-left">
 <button 
 onClick={() => {
 setSelectedInvoice(order);
 setInvoiceOpen(true);
 }}
 className="p-2 text-black hover:bg-gray-100 rounded-lg transition-colors"
 title="╪╣╪▒╪╢ ╪º┘ä┘ü╪º╪¬┘ê╪▒╪⌐"
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
 <h3 className="text-lg font-bold text-black">╪╖┘ä╪¿╪º╪¬ ╪¬┘ê╪▒┘è╪» ┘à╪«╪▓┘ê┘å ╪¼╪»┘è╪»</h3>
 <button 
 onClick={() => setRequestModalOpen(true)}
 className="bg-black text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all"
 >
 <Plus className="w-5 h-5" />
 ╪Ñ┘å╪┤╪º╪í ╪╖┘ä╪¿ ╪¬┘ê╪▒┘è╪» ╪¼╪»┘è╪»
 </button>
 </div>

 <div className="bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden">
 <table className="w-full text-right border-collapse">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#E0E3E5]">
 <th className="p-4 text-sm font-bold text-[#44474D]">╪▒┘é┘à ╪º┘ä╪╖┘ä╪¿</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">╪╣╪»╪» ╪º┘ä╪ú╪╡┘å╪º┘ü</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">╪º┘ä╪¡╪º┘ä╪⌐</th>
 <th className="p-4 text-sm font-bold text-[#44474D]">╪º┘ä╪¬╪º╪▒┘è╪«</th>
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
 <p className="font-bold">{req.items.length} ╪ú╪╡┘å╪º┘ü</p>
 <p className="text-[9px] text-blue-600 font-bold">
 {isExpanded ? '╪Ñ╪«┘ü╪º╪í ╪º┘ä╪¬┘ü╪º╪╡┘è┘ä' : '╪╣╪▒╪╢ ╪º┘ä╪¬┘ü╪º╪╡┘è┘ä'}
 </p>
 </td>
 <td className="p-4">
 {req.status === 'pending' && <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-1 rounded-full font-bold">┘é┘è╪» ╪º┘ä┘à╪▒╪º╪¼╪╣╪⌐</span>}
 {req.status === 'approved' && <span className="bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-full font-bold">╪¬┘à╪¬ ╪º┘ä┘à┘ê╪º┘ü┘é╪⌐</span>}
 {req.status === 'rejected' && <span className="bg-red-100 text-red-800 text-[10px] px-2 py-1 rounded-full font-bold">┘à╪▒┘ü┘ê╪╢</span>}
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
 <p className="text-xs font-bold text-black">{item?.name || '╪╡┘å┘ü ╪║┘è╪▒ ┘à╪╣╪▒┘ê┘ü'}</p>
 <p className="text-[10px] text-gray-500">╪º┘ä┘â┘à┘è╪⌐ ╪º┘ä┘à╪╖┘ä┘ê╪¿╪⌐: <span className="font-bold text-black">{reqItem.quantity}</span></p>
 </div>
 </div>
 );
 })}
 </div>
 <div className="flex justify-end">
 <button 
 onClick={(e) => {
 e.stopPropagation();
 const text = `*╪╖┘ä╪¿ ╪¬┘ê╪▒┘è╪» ┘à╪«╪▓┘ê┘å ╪¼╪»┘è╪»*
╪▒┘é┘à ╪º┘ä╪╖┘ä╪¿: REQ-${req.id}
╪º┘ä┘à┘å╪»┘ê╪¿: ${currentUser?.username}
╪º┘ä╪¬╪º╪▒┘è╪«: ${formatDate(req.date)}
╪╣╪»╪» ╪º┘ä╪ú╪╡┘å╪º┘ü: ${req.items.length}`;
 window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
 }}
 className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition-all flex items-center gap-2"
 >
 <Send className="w-3.5 h-3.5" />
 ╪Ñ╪▒╪│╪º┘ä ┘ä┘ä┘à╪»┘è╪▒ ┘ä┘ä┘à┘ê╪º┘ü┘é╪⌐
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
 <td colSpan={4} className="p-10 text-center text-gray-400">┘ä╪º ╪¬┘ê╪¼╪» ╪╖┘ä╪¿╪º╪¬ ╪¬┘ê╪▒┘è╪» ╪¡╪º┘ä┘è╪⌐</td>
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
 
 <h3 className="text-2xl font-bold text-black mb-1">┘à╪¿┘ä╪║ ╪Ñ╪╢╪º┘ü┘è ┘à┘â╪¬╪┤┘ü!</h3>
 <p className="text-sm text-gray-500 font-bold mb-6">┘ä┘é╪» ╪»┘ü╪╣ ╪º┘ä╪╣┘à┘è┘ä <span className="text-green-600">({excessAmount.toLocaleString()} ╪¼.┘à)</span> ╪▓┘è╪º╪»╪⌐ ╪╣┘å ┘é┘è┘à╪⌐ ╪º┘ä┘ü╪º╪¬┘ê╪▒╪⌐ ╪º┘ä╪¡╪º┘ä┘è╪⌐.</p>
 
 <div className="space-y-4">
 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">╪¬┘ê╪¼┘è┘ç ╪º┘ä┘à╪¿┘ä╪║ ╪º┘ä╪▓╪º╪ª╪» ╪Ñ┘ä┘ë:</p>
 
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
 toast.error('┘ü╪┤┘ä ╪¬╪╖╪¿┘è┘é ╪º┘ä╪»┘ü╪╣╪⌐');
 }
 }}
 className="w-full text-right p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:border-green-500 hover:bg-green-50 group transition-all"
 >
 <div className="flex justify-between items-center mb-1">
 <span className="text-xs font-bold text-black">┘ü╪º╪¬┘ê╪▒╪⌐: {order.orderNumber}</span>
 <span className="text-[10px] text-gray-400">{formatDate(order.date)}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] text-red-500 font-bold">╪¿╪º┘é┘è ╪╣┘ä┘è┘ç╪º: {(order.totalAmount - (order.paidAmount || 0)).toLocaleString()} ╪¼.┘à</span>
 <span className="text-xs font-bold text-green-600 group-hover:underline">╪│╪»╪» ╪º┘ä╪ó┘å</span>
 </div>
 </button>
 ))}
 </div>
 ) : (
 <div className="p-10 border-2 border-dashed border-gray-100 rounded-3xl text-center">
 <p className="text-xs text-gray-400 font-bold italic">┘ä╪º ╪¬┘ê╪¼╪» ┘à╪»┘è┘ê┘å┘è╪º╪¬ ╪│╪º╪¿┘é╪⌐ ┘ä┘ç╪░╪º ╪º┘ä╪╣┘à┘è┘ä</p>
 </div>
 )}

 <button 
 onClick={() => {
 setExcessPaymentModal(false);
 setInvoiceOpen(true);
 }}
 className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm mt-4 hover:opacity-90 transition-opacity"
 >
 ╪¬╪¼╪º┘ç┘ä ┘ê╪Ñ╪╕┘ç╪º╪▒ ┘ü╪º╪¬┘ê╪▒╪⌐ ╪º┘ä┘è┘ê┘à ┘ü┘é╪╖
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
 ╪Ñ╪╢╪º┘ü╪⌐ ╪╣┘à┘è┘ä ╪¼╪»┘è╪»
 </h2>
 <form onSubmit={handleAddCustomer} className="space-y-4">
 <div className="space-y-2">
 <label className="text-sm font-bold text-[#44474D]">╪º╪│┘à ╪º┘ä╪╣┘à┘è┘ä</label>
 <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none" placeholder="╪º┘ä╪º╪│┘à ╪º┘ä╪▒╪¿╪º╪╣┘è" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-bold text-[#44474D]">╪▒┘é┘à ╪º┘ä┘ç╪º╪¬┘ü</label>
 <input required type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none" placeholder="01xxxxxxxxx" />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-[#44474D]">╪º┘ä╪¿╪▒┘è╪» ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è</label>
 <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none" placeholder="example@mail.com" />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-[#44474D]">╪º┘ä╪╣┘å┘ê╪º┘å / ╪º┘ä┘à┘ê┘é╪╣</label>
 <div className="flex gap-2">
 <input required type="text" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="flex-1 bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none" placeholder="╪º┘ä┘à╪¡╪º┘ü╪╕╪⌐ - ╪º┘ä┘à╪»┘è┘å╪⌐ - ╪º┘ä┘à╪▒╪¿╪╣ ╪º┘ä╪│┘â┘å┘è" />
 <button 
 type="button" 
 onClick={captureLocation}
 disabled={isLocating}
 className={cn("px-4 rounded-xl flex items-center justify-center transition-all",
 newCustomer.latitude 
 ?"bg-green-100 text-green-600 border border-green-200" 
 :"bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
 )}
 title="╪¬╪¡╪»┘è╪» ╪º┘ä┘à┘ê┘é╪╣ ╪º┘ä╪¼╪║╪▒╪º┘ü┘è"
 >
 {isLocating ? (
 <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent animate-spin rounded-full" />
 ) : (
 newCustomer.latitude ? <CheckCircle2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />
 )}
 </button>
 </div>
 {newCustomer.latitude && (
 <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
 <CheckCircle2 className="w-3 h-3" />
 ╪¬┘à ╪º┘ä╪¬┘é╪º╪╖ ╪Ñ╪¡╪»╪º╪½┘è╪º╪¬ ╪º┘ä┘à┘ê┘é╪╣ ╪¿┘å╪¼╪º╪¡
 </p>
 )}
 </div>
 <div className="flex gap-3 pt-4">
 <button type="submit" className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:opacity-90">╪¡┘ü╪╕ ╪º┘ä╪╣┘à┘è┘ä</button>
 <button type="button" onClick={() => setCustomerModalOpen(false)} className="flex-1 bg-gray-100 text-[#44474D] py-3 rounded-xl font-bold hover:bg-gray-200">╪Ñ┘ä╪║╪º╪í</button>
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
 ╪¬╪¡╪▒┘è╪▒ ┘ü╪º╪¬┘ê╪▒╪⌐ ╪¿┘è╪╣
 </h2>
 <form onSubmit={handleCreateSale} className="space-y-4">
 <div className="space-y-2">
 <div className="flex justify-between items-center">
 <label className="text-sm font-bold text-[#44474D]">╪º╪«╪¬┘è╪º╪▒ ╪º┘ä╪╣┘à┘è┘ä</label>
 <button 
 type="button"
 onClick={() => setCustomerModalOpen(true)}
 className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline"
 >
 <Plus className="w-3 h-3" />
 ╪ú╪╢┘ü ╪╣┘à┘è┘ä ╪¼╪»┘è╪»
 </button>
 </div>
 <select 
 required 
 className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none"
 value={newSale.customerId}
 onChange={e => setNewSale({...newSale, customerId: parseInt(e.target.value)})}
 >
 <option value="">╪º╪«╪¬╪▒ ╪º┘ä╪╣┘à┘è┘ä...</option>
 {customers?.map((c: any) => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
 </select>
 </div>

 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <label className="text-sm font-bold text-[#44474D]">╪Ñ╪╢╪º┘ü╪⌐ ╪ú╪╡┘å╪º┘ü ┘à┘å ╪º┘ä╪╣┘ç╪»╪⌐</label>
 <select 
 onChange={(e) => e.target.value !=="0" && addItemToSale(parseInt(e.target.value))}
 className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold outline-none"
 >
 <option value="0">╪º╪«╪¬╪▒ ┘à┘å ╪╣┘ç╪»╪¬┘è...</option>
 {myInventory?.map((inv: any) => {
 const item = allItems?.find(i => i.id === inv.itemId);
 return <option key={inv.id} value={inv.itemId}>{item?.name} (┘à╪¬╪º╪¡: {inv.quantity})</option>
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
 <p className="text-[10px] text-[#44474D]">╪│╪╣╪▒ ╪º┘ä┘ê╪¡╪»╪⌐: {saleItem.price} ╪¼.┘à</p>
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
 <p className="text-xs text-gray-400">┘ä┘à ┘è╪¬┘à ╪º╪«╪¬┘è╪º╪▒ ╪ú╪╡┘å╪º┘ü ╪¿╪╣╪»</p>
 </div>
 )}
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-bold text-[#44474D]">╪º┘ä┘à╪¿┘ä╪║ ╪º┘ä┘à╪»┘ü┘ê╪╣ ╪¡╪º┘ä┘è╪º┘ï (╪¼.┘à)</label>
 <input 
 type="number" 
 value={newSale.paidAmount || ''} 
 onChange={e => setNewSale({...newSale, paidAmount: parseFloat(e.target.value) || 0})} 
 className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none font-bold text-green-600" 
 placeholder="0.00" 
 />
 <p className="text-[9px] text-[#44474D] font-bold">╪º┘ä┘à╪¬╪¿┘é┘è ╪│┘è╪¬┘à ╪¬╪│╪¼┘è┘ä┘ç ┘â┘Ç"╪ó╪¼┘ä" ╪╣┘ä┘ë ╪¡╪│╪º╪¿ ╪º┘ä╪╣┘à┘è┘ä</p>
 </div>

 <div className="bg-black text-white p-6 rounded-2xl flex justify-between items-center">
 <div>
 <p className="text-[10px] text-white/60">╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘ü╪º╪¬┘ê╪▒╪⌐</p>
 <h4 className="text-2xl font-bold">
 {newSale.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()} ╪¼.┘à
 </h4>
 </div>
 <button 
 type="submit"
 className="bg-green-500 hover:bg-green-600 px-8 py-3 rounded-xl font-bold text-sm transition-all"
 >
 ╪¬╪½╪¿┘è╪¬ ┘ê╪¿┘è╪╣
 </button>
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
 ╪╖┘ä╪¿ ╪¬┘ê╪▒┘è╪» ╪¿╪╢╪º╪╣╪⌐ ╪¼╪»┘è╪»╪⌐
 </h2>
 <form onSubmit={handleCreateRequest} className="space-y-4">
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <label className="text-sm font-bold text-[#44474D]">╪Ñ╪╢╪º┘ü╪⌐ ╪ú╪╡┘å╪º┘ü ┘ä┘ä╪╖┘ä╪¿</label>
 <select 
 onChange={(e) => {
 const itemId = parseInt(e.target.value);
 if (itemId !== 0 && !newRequest.items.find(i => i.itemId === itemId)) {
 setNewRequest({...newRequest, items: [...newRequest.items, { itemId, quantity: 10 }]});
 }
 }}
 className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold outline-none"
 >
 <option value="0">╪º╪«╪¬╪▒ ╪╡┘å┘ü...</option>
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
 <button type="submit" disabled={newRequest.items.length === 0} className="flex-1 bg-black text-white py-3 rounded-xl font-bold disabled:opacity-50">╪Ñ╪▒╪│╪º┘ä ╪º┘ä╪╖┘ä╪¿ ┘ä┘ä┘à╪▒╪º╪¼╪╣╪⌐</button>
 <button type="button" onClick={() => setRequestModalOpen(false)} className="flex-1 bg-gray-100 text-[#44474D] py-3 rounded-xl font-bold">╪Ñ┘ä╪║╪º╪í</button>
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
 ╪¬╪│╪¼┘è┘ä ╪¬╪¡╪╡┘è┘ä ┘å┘é╪»┘è╪⌐
 </h2>
 <form onSubmit={handleCreateCollection} className="space-y-4">
 <div className="space-y-2">
 <label className="text-sm font-bold text-[#44474D]">╪º┘ä╪╣┘à┘è┘ä</label>
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
 <label className="text-sm font-bold text-[#44474D]">╪º┘ä┘à╪¿┘ä╪║ ╪º┘ä┘à╪¡╪╡┘ä (╪¼.┘à)</label>
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
 <label className="text-sm font-bold text-[#44474D]">╪╖╪▒┘è┘é╪⌐ ╪º┘ä╪¬╪¡╪╡┘è┘ä</label>
 <select 
 className="w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black outline-none font-bold"
 value={newCollection.method}
 onChange={e => setNewCollection({...newCollection, method: e.target.value as any})}
 >
 <option value="cash">┘å┘é╪»╪º┘ï</option>
 <option value="transfer">╪¬╪¡┘ê┘è┘ä ╪¿┘å┘â┘è</option>
 <option value="check">╪┤┘è┘â</option>
 </select>
 </div>
 <p className="text-[10px] text-orange-600 font-bold bg-orange-50 p-2 rounded-lg">
 * ╪│┘è╪¬┘à ╪¬╪│╪¼┘è┘ä ╪º┘ä╪¬╪¡╪╡┘è┘ä ┘â┘Ç"┘é┘è╪» ╪º┘ä╪º┘å╪¬╪╕╪º╪▒" ┘ê┘ä┘å ┘è╪¬┘à ╪«╪╡┘à┘ç ┘à┘å ┘à╪»┘è┘ê┘å┘è╪⌐ ╪º┘ä╪╣┘à┘è┘ä ╪Ñ┘ä╪º ╪¿╪╣╪» ╪¬╪ú┘â┘è╪» ╪º┘ä╪Ñ╪»╪º╪▒╪⌐ ╪╣┘å╪» ╪º┘ä╪º╪│╪¬┘ä╪º┘à.
 </p>
 <div className="flex gap-3 pt-4">
 <button type="submit" className="flex-1 bg-black text-white py-3 rounded-xl font-bold">╪¬╪│╪¼┘è┘ä ╪º┘ä╪╖┘ä╪¿</button>
 <button type="button" onClick={() => setCollectionModalOpen(false)} className="flex-1 bg-gray-100 text-[#44474D] py-3 rounded-xl font-bold">╪Ñ┘ä╪║╪º╪í</button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </WorkspaceLayout>
 );
}
