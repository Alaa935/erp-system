import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { cn, formatDate, formatCurrency } from '../lib/utils';
import { ArrowRight, ShoppingCart, Wallet, CreditCard, History, Phone, MapPin, Calendar, Target, Activity, BarChart3 } from 'lucide-react';
import { useSalesReps } from '../hooks/useSalesReps';

export default function CustomerDetailsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [customerId, setCustomerId] = useState<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('wms_selected_customer_id');
    if (stored) setCustomerId(Number(stored));
  }, []);

  const { data: customerData } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => api(`/customers/${customerId}`),
    enabled: !!customerId,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['customer-orders', customerId],
    queryFn: () => api(`/sales-orders?customerId=${customerId}&pageSize=1000`),
    enabled: !!customerId,
  });

  const { data: collectionsData } = useQuery({
    queryKey: ['customer-collections', customerId],
    queryFn: () => api(`/payment-collections?customerId=${customerId}`),
    enabled: !!customerId,
  });

  const { data: activityData } = useQuery({
    queryKey: ['customer-activity', customerId],
    queryFn: () => api(`/activity-logs/entity/Customer/${customerId}?pageSize=50`),
    enabled: !!customerId,
  });

  const { data: repsData } = useSalesReps({ noPagination: 'true' } as any);
  const reps = (repsData as any)?.items || [];

  const customer = customerData as any;
  const orders = (ordersData as any)?.orders || [];
  const collections = (collectionsData as any)?.items || [];
  const activities = (activityData as any)?.logs || [];

  const totalSales = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const totalPaid = collections.filter((c: any) => c.status === 'confirmed').reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
  const remaining = totalSales - totalPaid;

  const getRepName = (repId: number | null) => {
    if (!repId) return 'غير معروف';
    const rep = reps.find((r: any) => r.id === repId);
    return rep?.name || 'غير معروف';
  };

  const handleBack = () => {
    sessionStorage.removeItem('wms_selected_customer_id');
    onNavigate?.('customers');
  };

  if (!customerId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 text-lg font-bold">لم يتم تحديد عميل</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black">{customer.name}</h1>
          <p className="text-sm text-gray-500">{customer.address || 'بلا عنوان'}</p>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-gray-500">رقم الهاتف</span>
          </div>
          <p className="text-sm font-black">{customer.phone || 'غير مسجل'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-bold text-gray-500">المنطقة</span>
          </div>
          <p className="text-sm font-black">{customer.address || 'غير مسجل'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs font-bold text-gray-500">تاريخ التسجيل</span>
          </div>
          <p className="text-sm font-black">{customer.createdAt ? formatDate(customer.createdAt) : 'غير مسجل'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Target className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-gray-500">نقاط الولاء</span>
          </div>
          <p className="text-sm font-black">{customer.loyaltyPoints || 0} نقطة</p>
        </div>
      </div>

      {/* Location Section */}
      {(customer.latitude || customer.longitude) && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-500">الموقع على الخريطة</span>
          </div>
          <a
            href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline"
          >
            {customer.latitude}, {customer.longitude}
          </a>
        </div>
      )}

      {/* Statistics Cards */}
      <h2 className="text-lg font-black mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-gray-400" />
        إحصائيات العميل
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-2">
            <ShoppingCart className="w-3.5 h-3.5" />
            إجمالي المبيعات
          </p>
          <h4 className="text-xl font-black">{formatCurrency(totalSales)}</h4>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <p className="text-xs font-bold text-green-600 mb-1 flex items-center gap-2">
            <ShoppingCart className="w-3.5 h-3.5" />
            عدد الفواتير
          </p>
          <h4 className="text-xl font-black">{orders.length}</h4>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <p className="text-xs font-bold text-green-600 mb-1 flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5" />
            المبلغ المحصل
          </p>
          <h4 className="text-xl font-black text-green-700">{formatCurrency(totalPaid)}</h4>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
          <p className="text-xs font-bold text-red-600 mb-1 flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" />
            المبلغ المتبقي
          </p>
          <h4 className="text-xl font-black text-red-700">{formatCurrency(Math.max(0, remaining))}</h4>
        </div>
      </div>

      {/* Invoice History */}
      <h2 className="text-lg font-black mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-gray-400" />
        سجل فواتير العميل
        <span className="text-xs text-gray-400 font-normal">(جميع الفواتير بغض النظر عن المندوب)</span>
      </h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-3 text-xs font-black text-right">رقم الفاتورة</th>
                <th className="p-3 text-xs font-black text-right">التاريخ</th>
                <th className="p-3 text-xs font-black text-right">المبلغ</th>
                <th className="p-3 text-xs font-black text-right">حالة الدفع</th>
                <th className="p-3 text-xs font-black text-right">المندوب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="p-3 text-sm font-black">{order.orderNumber}</td>
                  <td className="p-3 text-xs text-gray-500">{formatDate(order.date)}</td>
                  <td className="p-3 text-sm font-black">{formatCurrency(order.totalAmount)}</td>
                  <td className="p-3">
                    <span className={cn(
                      "text-[10px] px-2 py-1 rounded-lg font-black",
                      order.paymentStatus === 'paid' ? "bg-green-100 text-green-700" :
                      order.paymentStatus === 'partial' ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {order.paymentStatus === 'paid' ? 'مدفوع' :
                       order.paymentStatus === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-500">{getRepName(order.repId)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 text-xs font-bold">
                    لا توجد فواتير لهذا العميل
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity History */}
      <h2 className="text-lg font-black mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-gray-400" />
        سجل النشاطات
      </h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-3 text-xs font-black text-right">التاريخ</th>
                <th className="p-3 text-xs font-black text-right">الإجراء</th>
                <th className="p-3 text-xs font-black text-right">التفاصيل</th>
                <th className="p-3 text-xs font-black text-right">المستخدم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activities.map((act: any) => (
                <tr key={act.id} className="hover:bg-gray-50">
                  <td className="p-3 text-xs text-gray-500">{formatDate(act.timestamp)}</td>
                  <td className="p-3 text-sm font-black">{act.action}</td>
                  <td className="p-3 text-xs text-gray-500">{act.details}</td>
                  <td className="p-3 text-xs text-gray-500">{act.username}</td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 text-xs font-bold">
                    لا توجد نشاطات مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
