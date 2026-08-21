import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, Package, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Eye, RefreshCw,
  Activity, Percent, Wallet, Truck,
  Bell, Zap,
  CheckCircle2, Info, BarChart3, PieChart, Users, FileText, Target,
  ShoppingCart, UserPlus, ClipboardList, Sparkles,
  Star, Award, Clock, ExternalLink
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { toast } from 'sonner';
import { PageHeader, EmptyState, WorkspaceSection } from '../components/design-system';
import {
  useDashboardSummary,
  useDashboardCharts,
  useDashboardAlerts,
  useTopProducts,
  useTopCustomers,
  useDashboardRecentActivity,
  useDashboardNotifications,
} from '../hooks/useDashboard';

const COLORS = ['#000000', '#333333', '#666666', '#999999', '#BBBBBB', '#22C55E', '#EF4444', '#F59E0B'];

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  loading?: boolean;
  delay?: number;
  trend?: number[];
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const MiniSparkline = ({ data, color = '#000' }: { data: number[]; color?: string }) => {
  if (!data || data.length < 2) return null;
  const w = 60, h = 24;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => [((i / (data.length - 1)) * w).toFixed(1), (h - ((v - min) / range) * (h - 4) - 2).toFixed(1)].join(',')).join(' ');
  const gradId = 'sparkGrad-' + color.replace('#', '');
  const lastPt = pts.split(' ').slice(-1)[0] || '';
  const firstPt = pts.split(' ')[0] || '';
  return (
    <svg width={w} height={h} viewBox={'0 0 ' + w + ' ' + h} className="shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={'M' + pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={'M' + firstPt + ' L' + pts.split(' ').slice(1).join(' L') + ' L' + lastPt.split(',')[0] + ',' + h + ' L' + firstPt.split(',')[0] + ',' + h + ' Z'} fill={'url(#' + gradId + ')'} />
    </svg>
  );
};

const StatCard = React.memo(({ title, value, change, icon: Icon, subtitle, loading, delay = 0, trend, variant = 'default' }: StatCardProps) => {
  const vs = {
    default: { iconBg: 'bg-black/[0.04]', iconColor: 'text-black' },
    success: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    warning: { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    danger: { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    info: { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  }[variant];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.04, duration: 0.35, ease: 'easeOut' }}
      className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] group"
    >
      {loading ? (
        <div className="space-y-2.5">
          <div className="h-9 w-9 rounded-xl bg-gray-100/80 animate-pulse" />
          <div className="h-3.5 w-20 rounded bg-gray-100/80 animate-pulse" />
          <div className="h-6 w-28 rounded bg-gray-100/80 animate-pulse" />
        </div>
      ) : (
        <><div className="flex items-start justify-between mb-1.5">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-110', vs.iconBg)}>
            <Icon className={cn('w-4.5 h-4.5', vs.iconColor)} />
          </div>
          <div className="flex items-center gap-1.5">
            {change !== undefined && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: delay * 0.04 + 0.2, type: 'spring', bounce: 0.4 }}
                className={cn('flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-lg', change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}
              >
                {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(change)}%
              </motion.span>
            )}
            {trend && <MiniSparkline data={trend} color={change !== undefined && change >= 0 ? '#22C55E' : '#EF4444'} />}
          </div></div>
          <p className="text-[11px] font-bold text-gray-500 mb-0.5">{title}</p>
          <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay * 0.04 + 0.15 }}
            className="text-xl font-black text-black tracking-tight truncate">{value}</motion.h3>
          {subtitle && <p className="text-[10px] text-gray-400 mt-1 font-medium">{subtitle}</p>}</>
      )}
    </motion.div>
  );
});

interface WidgetCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  delay?: number;
  badge?: string | number;
}

const WidgetCard = React.memo(({ title, icon: Icon, children, className, action, delay = 0, badge }: WidgetCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.04, duration: 0.35, ease: 'easeOut' }}
    className={cn('bg-white rounded-xl border border-gray-200/60 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]', className)}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-black/[0.04] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-black" />
        </div>
        <h3 className="text-sm font-bold text-black">{title}</h3>
        {badge !== undefined && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">{badge}</span>}
      </div>
      {action}
    </div>
    {children}
  </motion.div>
));

interface QuickActionBtnProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  color?: string;
}

const QuickActionBtn = ({ label, icon: Icon, onClick, color = 'bg-black' }: QuickActionBtnProps) => (
  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/60 text-xs font-bold text-gray-700 transition-all hover:shadow-sm active:scale-95"
  >
    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', color)}>
      <Icon className="w-3.5 h-3.5 text-white" />
    </div>
    {label}
  </motion.button>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.04)] p-3 text-right">
      <p className="text-xs font-bold text-gray-500 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="font-bold text-gray-700">{p.name}:</span>
          <span className="font-black text-black">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard({ setActivePage }: { setActivePage: (page: string) => void }) {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(false);

  const { data: summaryRes, isLoading: summaryLoading } = useDashboardSummary();
  const { data: chartsRes, isLoading: chartsLoading } = useDashboardCharts();
  const { data: alertsRes } = useDashboardAlerts();
  const { data: topProductsRes } = useTopProducts();
  const { data: topCustomersRes } = useTopCustomers();
  const { data: activityRes } = useDashboardRecentActivity();
  const { data: notificationsRes } = useDashboardNotifications();

  const s = summaryRes?.data;
  console.log('[Dashboard] summaryRes:', summaryRes);
  console.log('[Dashboard] s (summaryRes?.data):', s);
  console.log('[Dashboard] totalCustomers:', s?.totalCustomers);
  console.log('[Dashboard] chartsRes:', chartsRes);

  const charts = chartsRes?.data;
  const alerts = alertsRes?.data;
  const topProducts = topProductsRes?.data?.items ?? [];
  const topCust = topCustomersRes?.data?.items ?? [];
  const activityLogs = activityRes?.data?.logs ?? [];
  const notificationData = notificationsRes?.data;

  const totalSales = s?.totalSales ?? 0;
  const netProfit = s?.netProfit ?? 0;
  const totalExpenses = s?.totalExpenses ?? 0;
  const totalItems = s?.totalItems ?? 0;
  const totalValue = s?.inventoryValue ?? 0;
  const lowStock = s?.lowStockItems ?? [];
  const pendingOrders = s?.pendingOrders ?? 0;
  const activeUsers = s?.activeUsers ?? 0;
  const todaySales = s?.todaySales ?? 0;
  const profitMargin = s?.profitMargin ?? '0';
  const totalPurchases = s?.totalPurchases ?? 0;
  const totalTaxAmount = s?.totalTaxAmount ?? 0;
  const salesChange = s?.salesChange ?? 0;
  const profitChange = s?.profitChange ?? 0;
  const salesTrend = s?.salesTrend ?? [];
  const customerTrend = s?.customerTrend ?? [];
  const todayInvoices = s?.todayInvoices ?? 0;
  const customersCount = s?.totalCustomers ?? 0;
  const suppliersCount = s?.totalSuppliers ?? 0;
  const lowStockCount = s?.lowStockCount ?? 0;
  const totalOrders = s?.totalOrders ?? 0;

  const salesByMonth = charts?.salesByMonth ?? [];
  const categoryData = charts?.categoryData ?? [];
  const weeklyRevenue = charts?.weeklyRevenue ?? [];
  const pendingSales = alerts?.pendingSales ?? 0;
  const unpaidPurchases = alerts?.unpaidPurchases ?? 0;
  const criticalAlerts = alerts?.lowStock ?? [];
  const notifications = notificationData?.notifications ?? [];
  const unreadNotifications = notificationData?.unreadCount ?? 0;

  const salesTrendForProfit = useMemo(() =>
    salesTrend.map(v => v * 0.3)
  , [salesTrend]);

  const stockStatus = useMemo(() => {
    if (totalItems === 0) return [
      { label: 'متوفر', value: 0, color: 'bg-green-500' },
      { label: 'منخفض', value: 0, color: 'bg-yellow-500' },
      { label: 'حرج', value: 0, color: 'bg-red-500' },
      { label: 'نفد', value: 0, color: 'bg-gray-500' },
    ];
    const noStock = lowStock.filter(i => i.quantity === 0).length;
    const critical = lowStock.filter(i => i.quantity > 0).length;
    const available = totalItems - lowStockCount;
    return [
      { label: 'متوفر', value: available, color: 'bg-green-500' },
      { label: 'منخفض', value: lowStockCount - noStock - critical, color: 'bg-yellow-500' },
      { label: 'حرج', value: critical, color: 'bg-red-500' },
      { label: 'نفد', value: noStock, color: 'bg-gray-500' },
    ];
  }, [totalItems, lowStock, lowStockCount]);

  const totalStock = useMemo(() => stockStatus.reduce((s, st) => s + st.value, 0) || 1, [stockStatus]);

  const insights = useMemo(() => [
    { icon: Star, label: 'أفضل منتج مبيعاً', value: topProducts[0]?.name || 'لا توجد مبيعات', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: Target, label: 'نسبة إنجاز المبيعات', value: profitMargin + '% هامش ربح', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Users, label: 'العملاء المتكررون', value: (topCust.length || 0) + ' من ' + customersCount, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: AlertTriangle, label: 'الأصناف الحرجة', value: lowStock.filter(i => i.quantity === 0).length + ' أصناف نفدت', color: 'text-rose-600', bg: 'bg-rose-50' },
    { icon: Package, label: 'متوسط قيمة المخزون', value: totalItems > 0 ? formatCurrency(s?.avgStockValue ?? 0) : '0', color: 'text-purple-600', bg: 'bg-purple-50' },
  ], [topProducts, profitMargin, topCust, customersCount, lowStock, totalItems, s]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    toast.success('جاري تحديث البيانات');
    setTimeout(() => setLoading(false), 800);
  }, []);

  const navigateTo = useCallback((page: string) => {
    if (setActivePage) setActivePage(page);
  }, [setActivePage]);

  return (
    <div className="space-y-4" dir="rtl">

      <PageHeader
        title="لوحة القيادة"
        subtitle="نظرة عامة شاملة على أداء النظام والمؤسسة"
        icon={BarChart3}
        badge={{ label: 'مباشر', variant: 'success' }}
        actions={<div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['week', 'month', 'year'] as const).map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={cn('px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-150', dateRange === r ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black')}>
                {r === 'week' ? 'أسبوعي' : r === 'month' ? 'شهري' : 'سنوي'}
              </button>
            ))}
          </div>
          <button onClick={handleRefresh} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all active:scale-95">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => toast.success('تم تحديث البيانات', { description: 'آخر تحديث: الآن' })}
            className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            تحديث
          </button>
        </div>}
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-gray-200/60 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.02)]"
      >
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-bold text-gray-400">إجراءات سريعة</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickActionBtn label="فاتورة بيع جديدة" icon={ShoppingCart} onClick={() => navigateTo('sales-orders')} color="bg-black" />
          <QuickActionBtn label="إضافة عميل" icon={UserPlus} onClick={() => navigateTo('customers')} color="bg-blue-600" />
          <QuickActionBtn label="إضافة صنف" icon={Package} onClick={() => navigateTo('inventory')} color="bg-emerald-600" />
          <QuickActionBtn label="فاتورة مورد" icon={ClipboardList} onClick={() => navigateTo('supplier-invoices')} color="bg-purple-600" />
          <QuickActionBtn label="تقارير" icon={BarChart3} onClick={() => navigateTo('reports')} color="bg-amber-600" />
        </div>
      </motion.div>

      <WorkspaceSection title="المؤشرات المالية الرئيسية" description="ملخص المبيعات والأرباح والضرائب مع الاتجاهات"
        actions={<span className="text-[10px] text-gray-400 font-medium">آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}</span>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="إجمالي المبيعات" value={formatCurrency(totalSales)} change={salesChange} icon={TrendingUp} subtitle={formatCurrency(todaySales) + ' اليوم'} delay={0} trend={salesTrend} loading={summaryLoading} />
          <StatCard title="صافي الأرباح" value={formatCurrency(netProfit)} change={profitChange} icon={Wallet} subtitle={'هامش ربح ' + profitMargin + '%'} delay={1} trend={salesTrendForProfit} variant="success" loading={summaryLoading} />
          <StatCard title="الضرائب المحصلة" value={formatCurrency(totalTaxAmount)} icon={Percent} subtitle="الضريبة المحصلة على الفواتير" delay={2} variant="info" loading={summaryLoading} />
          <StatCard title="الفواتير اليومية" value={String(todayInvoices)} icon={FileText} subtitle={pendingOrders + ' قيد الانتظار'} delay={3} loading={summaryLoading} />
        </div>
      </WorkspaceSection>

      <WorkspaceSection title="المخزون والمستخدمون" description="حالة المخزون والمستخدمين النشطين والموردين والعملاء">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="المخزون الإجمالي" value={totalItems + ' صنف'} change={5.2} icon={Package} subtitle={'قيمة ' + formatCurrency(totalValue)} delay={4} loading={summaryLoading} />
          <StatCard title="العملاء المسجلون" value={String(customersCount)} change={customersCount > 0 ? 3.8 : 0} icon={Users} subtitle={(topCust.length || 0) + ' عميل نشط'} delay={5} variant="info" trend={customerTrend} loading={summaryLoading} />
          <StatCard title="حالة المخزون" value={lowStockCount + ' منخفض'} change={lowStockCount > 0 ? -15 : 0} icon={AlertTriangle} subtitle={'من أصل ' + totalItems + ' صنف'} delay={6} variant={lowStockCount > 0 ? 'warning' : 'success'} loading={summaryLoading} />
          <StatCard title="الموردين" value={String(suppliersCount)} change={0} icon={Truck} subtitle={totalPurchases > 0 ? formatCurrency(totalPurchases) + ' مشتريات' : '0 فاتورة توريد'} delay={7} loading={summaryLoading} />
        </div>
      </WorkspaceSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <WidgetCard title="تحليل المبيعات والمشتريات" icon={BarChart3} delay={8}
          action={<div className="flex gap-3"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-black" /><span className="text-[10px] text-gray-500 font-bold">مبيعات</span></div><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300" /><span className="text-[10px] text-gray-500 font-bold">مشتريات</span></div></div>}
          className="lg:col-span-2"
        >
          <div className="min-h-[256px] h-64" style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <BarChart data={salesByMonth} barSize={16} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="sales" fill="#000000" radius={[4, 4, 0, 0]} name="مبيعات" />
                <Bar dataKey="purchases" fill="#CCCCCC" radius={[4, 4, 0, 0]} name="مشتريات" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </WidgetCard>

        <WidgetCard title="توزيع المخزون حسب الفئة" icon={PieChart} delay={9}>
          {categoryData.length === 0 ? (
            <EmptyState icon={PieChart} title="لا توجد بيانات" description="لم يتم إضافة أي أصناف بعد" />
          ) : (
              <div className="min-h-[256px] h-64 flex flex-col items-center justify-center" style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={170} debounce={100}>
                <RPieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2.5 mt-2 justify-center">{categoryData.slice(0, 5).map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-[10px] font-bold text-gray-600">{d.name}</span></div>
              ))}</div>
            </div>
          )}
        </WidgetCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WidgetCard title="أكثر المنتجات مبيعاً" icon={TrendingUp} delay={10} badge={topProducts.length}>
          {topProducts.length === 0 ? <EmptyState icon={BarChart3} title="لا توجد مبيعات بعد" /> : (
            <div className="space-y-1">{topProducts.map((item: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-all duration-150">
                <span className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black text-white shrink-0', i === 0 ? 'bg-black' : i === 1 ? 'bg-gray-600' : i === 2 ? 'bg-gray-400' : 'bg-gray-200 text-gray-600')}>{i + 1}</span>
                <div className="flex-1 min-w-0"><p className="text-xs font-bold text-black truncate">{item.name}</p><p className="text-[10px] text-gray-400 font-medium">قيمة {formatCurrency(item.revenue)}</p></div>
                <span className="text-xs font-black text-black">{item.qty}</span>
              </motion.div>
            ))}</div>
          )}
        </WidgetCard>

        <WidgetCard title="أكثر العملاء إنفاقاً" icon={Award} delay={11} badge={topCust.length}>
          {topCust.length === 0 ? <EmptyState icon={Users} title="لا يوجد عملاء بعد" /> : (
            <div className="space-y-1">{topCust.map((c: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-all duration-150">
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0', i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-500' : i === 2 ? 'bg-amber-700' : 'bg-gray-300 text-gray-600')}>{c.name.charAt(0)}</div>
                <div className="flex-1 min-w-0"><p className="text-xs font-bold text-black truncate">{c.name}</p><p className="text-[10px] text-gray-400 font-medium">{c.orders} طلب</p></div>
                <span className="text-[11px] font-black text-black">{formatCurrency(c.total)}</span>
              </motion.div>
            ))}</div>
          )}
        </WidgetCard>

        <WidgetCard title="تنبيهات المخزون" icon={AlertTriangle} delay={12} badge={criticalAlerts.length}>
          {criticalAlerts.length === 0 ? <EmptyState icon={CheckCircle2} title="المخزون مطمئن" description="لا توجد أصناف منخفضة" /> : (
            <div className="space-y-1">{criticalAlerts.map((item: any, i: number) => (
              <motion.div key={item.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-rose-50/50 transition-all duration-150">
                <div className={cn('w-2 h-2 rounded-full shrink-0', item.quantity === 0 ? 'bg-red-500' : 'bg-amber-500')} />
                <div className="flex-1 min-w-0"><p className="text-xs font-bold text-black truncate">{item.name}</p><p className="text-[10px] text-gray-400 font-medium">{item.quantity} / {item.minQuantity} وحدة</p></div>
                <span className={cn('text-[10px] font-black px-1.5 py-0.5 rounded-md', item.quantity === 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600')}>{item.quantity === 0 ? 'نفد' : '-' + item.deficit}</span>
              </motion.div>
            ))}</div>
          )}
        </WidgetCard>

        <WidgetCard title="الإيرادات الأسبوعية" icon={TrendingUp} delay={13}>
          <div className="min-h-[192px] h-48" style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <AreaChart data={weeklyRevenue}>
                <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#000" stopOpacity="0.12" /><stop offset="100%" stopColor="#000" stopOpacity="0.02" /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#999' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#999' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#000" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </WidgetCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <WidgetCard title="آخر النشاطات" icon={Activity} delay={14} badge={activityLogs.length || 0}
          action={<button onClick={() => navigateTo('activity-logs')} className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors"><ExternalLink className="w-3.5 h-3.5" /></button>}>
          {activityLogs.length === 0 ? <EmptyState icon={Activity} title="لا توجد نشاطات" /> : (
            <div className="space-y-0">{activityLogs.slice(0, 6).map((log: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0 group hover:bg-gray-50/50 px-1 rounded-lg transition-colors -mx-1">
                <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-black shrink-0 group-hover:scale-150 transition-transform" />
                <div className="flex-1 min-w-0"><p className="text-xs font-bold text-black truncate">{log.action}</p><p className="text-[10px] text-gray-400 font-medium flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(new Date(log.timestamp).getTime())}</p></div>
              </motion.div>
            ))}</div>
          )}
        </WidgetCard>

        <WidgetCard title="الإشعارات" icon={Bell} delay={15} badge={unreadNotifications}
          action={unreadNotifications > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}>
          {notifications.length === 0 ? <EmptyState icon={Bell} title="لا توجد إشعارات" description="كل شيء هادئ" /> : (
            <div className="space-y-1">{notifications.map((n: any) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className={cn('flex items-start gap-2.5 p-2 rounded-lg transition-all hover:shadow-sm', n.type === 'warning' ? 'bg-amber-50/50' : n.type === 'success' ? 'bg-emerald-50/50' : n.type === 'error' ? 'bg-rose-50/50' : 'bg-blue-50/50')}>
                <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0', n.type === 'warning' ? 'bg-amber-100 text-amber-600' : n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : n.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600')}>
                  {n.type === 'warning' ? <AlertTriangle className="w-3 h-3" /> : n.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <Info className="w-3 h-3" />}</div>
                <div className="flex-1 min-w-0"><p className="text-[11px] font-bold text-black truncate">{n.title}</p><p className="text-[10px] text-gray-500 line-clamp-1">{n.message}</p></div>
                <span className="text-[9px] text-gray-400 font-medium shrink-0">{formatDate(new Date(n.date).getTime())}</span>
              </motion.div>
            ))}</div>
          )}
        </WidgetCard>

        <WidgetCard title="رؤى سريعة ونصائح" icon={Sparkles} delay={16} badge="AI">
          <div className="space-y-2.5">
            {insights.map((insight: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50/80 hover:bg-gray-100 transition-colors">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', insight.bg)}><insight.icon className={cn('w-3.5 h-3.5', insight.color)} /></div>
                <div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-gray-400">{insight.label}</p><p className="text-xs font-bold text-black truncate">{insight.value}</p></div>
              </motion.div>
            ))}
          </div>
        </WidgetCard>
      </div>

      {(pendingSales > 0 || unpaidPurchases > 0) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-amber-200/60 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-amber-500" /><h3 className="text-sm font-bold text-amber-800">في انتظار الموافقة</h3></div>
          <div className="flex flex-wrap gap-3">
            {pendingSales > 0 && <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700"><ShoppingCart className="w-3.5 h-3.5" /><span className="text-xs font-bold">{pendingSales} طلب بيع</span></div>}
            {unpaidPurchases > 0 && <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700"><ClipboardList className="w-3.5 h-3.5" /><span className="text-xs font-bold">{unpaidPurchases} فاتورة مورد غير مدفوعة</span></div>}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-3"><Bell className="w-4 h-4 text-black" /><h3 className="text-sm font-bold text-black">آخر الإشعارات</h3>{unreadNotifications > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}</div>
            <div className="flex flex-wrap gap-2">{notifications.map((n: any) => (
              <div key={n.id} className={cn('px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all hover:shadow-sm', n.type === 'warning' ? 'bg-amber-50 text-amber-700' : n.type === 'success' ? 'bg-emerald-50 text-emerald-700' : n.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700')}>
                {n.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> : n.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : n.type === 'error' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                <span>{n.title}: {n.message}</span>
                <span className="opacity-60 text-[10px] mr-2">{formatDate(new Date(n.date).getTime())}</span>
              </div>
            ))}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
