import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, Package, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Eye, RefreshCw,
  Activity, Percent, Wallet, Truck,
  Bell, Zap,
  CheckCircle2, Info, BarChart3, PieChart, Users, FileText, Target,
  ShoppingCart, UserPlus, ClipboardList, Sparkles,
  Star, Award, Clock, ExternalLink, ShieldCheck, AlertCircle
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

const COLORS = ['#0f172a', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0891b2', '#475569'];

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  hasPrevData?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  loading?: boolean;
  delay?: number;
  trend?: number[];
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const MiniSparkline = ({ data, color = '#000' }: { data: number[]; color?: string }) => {
  if (!data || data.length < 2) return null;
  const w = 64, h = 26;
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
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={'M' + pts} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d={'M' + firstPt + ' L' + pts.split(' ').slice(1).join(' L') + ' L' + lastPt.split(',')[0] + ',' + h + ' L' + firstPt.split(',')[0] + ',' + h + ' Z'} fill={'url(#' + gradId + ')'} />
    </svg>
  );
};

const StatCard = React.memo(({ title, value, change, hasPrevData = true, icon: Icon, subtitle, loading, delay = 0, trend, variant = 'default' }: StatCardProps) => {
  const vs = {
    default: { iconBg: 'bg-slate-100 text-slate-800', border: 'border-slate-200/80' },
    success: { iconBg: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200/60' },
    warning: { iconBg: 'bg-amber-50 text-amber-700', border: 'border-amber-200/60' },
    danger: { iconBg: 'bg-rose-50 text-rose-700', border: 'border-rose-200/60' },
    info: { iconBg: 'bg-blue-50 text-blue-700', border: 'border-blue-200/60' },
  }[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.04, duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'bg-white rounded-2xl border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] group relative overflow-hidden',
        vs.border
      )}
    >
      {loading ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-gray-100 animate-pulse" />
            <div className="h-4 w-16 rounded-lg bg-gray-100 animate-pulse" />
          </div>
          <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
          <div className="h-7 w-32 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-2">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-transform group-hover:scale-105', vs.iconBg)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              {change !== undefined && (
                hasPrevData ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: delay * 0.04 + 0.15, type: 'spring', bounce: 0.3 }}
                    className={cn(
                      'flex items-center gap-0.5 text-[11px] font-extrabold px-2 py-0.5 rounded-lg border',
                      change >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-rose-50 text-rose-700 border-rose-200/60'
                    )}
                  >
                    {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(change)}%
                  </motion.span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200/60">
                    لا توجد مقارنة
                  </span>
                )
              )}
              {trend && <MiniSparkline data={trend} color={change !== undefined && change >= 0 ? '#16a34a' : '#dc2626'} />}
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 mb-0.5">{title}</p>
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay * 0.04 + 0.1 }}
            className="text-2xl font-black text-slate-900 tracking-tight truncate"
          >
            {value}
          </motion.h3>
          {subtitle && <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-tight">{subtitle}</p>}
        </>
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
    className={cn(
      'bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]',
      className
    )}
  >
    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-black text-slate-900 tracking-tight">{title}</h3>
        {badge !== undefined && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
            {badge}
          </span>
        )}
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

const QuickActionBtn = ({ label, icon: Icon, onClick, color = 'bg-slate-900' }: QuickActionBtnProps) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-black text-slate-800 transition-all shadow-sm active:scale-95"
  >
    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm', color)}>
      <Icon className="w-3.5 h-3.5" />
    </div>
    {label}
  </motion.button>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl border border-slate-800 shadow-xl p-3 text-right">
      <p className="text-xs font-bold text-slate-300 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs font-medium">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-black text-white">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard({ setActivePage }: { setActivePage: (page: string) => void }) {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  const { data: summaryRes, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useDashboardSummary();
  const { data: chartsRes, isLoading: chartsLoading, refetch: refetchCharts } = useDashboardCharts();
  const { data: alertsRes } = useDashboardAlerts();
  const { data: topProductsRes } = useTopProducts();
  const { data: topCustomersRes } = useTopCustomers();
  const { data: activityRes } = useDashboardRecentActivity();
  const { data: notificationsRes } = useDashboardNotifications();

  const s = summaryRes?.data;
  const charts = chartsRes?.data;
  const alerts = alertsRes?.data;
  const topProducts = topProductsRes?.data?.items ?? [];
  const topCust = topCustomersRes?.data?.items ?? [];
  const activityLogs = activityRes?.data?.logs ?? [];
  const notificationData = notificationsRes?.data;

  const totalSales = s?.totalSales ?? 0;
  const netProfit = s?.netProfit ?? 0;
  const totalItems = s?.totalItems ?? 0;
  const inventoryCostValue = s?.inventoryCostValue ?? s?.inventoryValue ?? 0;
  const inventorySellingValue = s?.inventorySellingValue ?? 0;
  const lowStock = s?.lowStockItems ?? [];
  const pendingOrders = s?.pendingOrders ?? 0;
  const todaySales = s?.todaySales ?? 0;
  const profitMargin = s?.profitMargin ?? '0';
  const totalPurchases = s?.totalPurchases ?? 0;
  const totalTaxAmount = s?.totalTaxAmount ?? 0;
  const hasPrevMonthSales = s?.hasPrevMonthSales ?? true;
  const hasPrevMonthProfit = s?.hasPrevMonthProfit ?? true;
  const salesChange = s?.salesChange ?? 0;
  const profitChange = s?.profitChange ?? 0;
  const salesTrend = s?.salesTrend ?? [];
  const profitTrend = s?.profitTrend ?? [];
  const customerTrend = s?.customerTrend ?? [];
  const todayInvoices = s?.todayInvoices ?? 0;
  const customersCount = s?.totalCustomers ?? 0;
  const suppliersCount = s?.totalSuppliers ?? 0;
  const lowStockCount = s?.lowStockCount ?? 0;

  const stockBreakdown = useMemo(() => {
    if (s?.stockBreakdown) return s.stockBreakdown;
    const out = lowStock.filter(i => i.quantity === 0).length;
    const crit = lowStock.filter(i => i.quantity > 0 && i.quantity <= i.minQuantity * 0.5).length;
    const low = lowStockCount - out - crit;
    const avail = Math.max(0, totalItems - lowStockCount);
    return { available: avail, lowStock: low > 0 ? low : 0, critical: crit, outOfStock: out };
  }, [s, lowStock, lowStockCount, totalItems]);

  const salesByMonth = charts?.salesByMonth ?? [];
  const categoryData = charts?.categoryData ?? [];
  const weeklyRevenue = charts?.weeklyRevenue ?? [];
  const pendingSales = alerts?.pendingSales ?? 0;
  const unpaidPurchases = alerts?.unpaidPurchases ?? 0;
  const criticalAlerts = alerts?.lowStock ?? [];
  const notifications = notificationData?.notifications ?? [];
  const unreadNotifications = notificationData?.unreadCount ?? 0;

  const insights = useMemo(() => [
    { icon: Star, label: 'أفضل منتج مبيعاً', value: topProducts[0]?.name || 'لا توجد مبيعات', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: Target, label: 'هامش الربح التشغيلي', value: profitMargin + '% صافي هامش', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Users, label: 'العملاء النشطون', value: (topCust.length || 0) + ' كبار العملاء من ' + customersCount, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: AlertTriangle, label: 'الأصناف الحرجة', value: stockBreakdown.outOfStock + ' أصناف نفدت بالكامل', color: 'text-rose-600', bg: 'bg-rose-50' },
    { icon: Package, label: 'قيمة المخزون البيعية', value: formatCurrency(inventorySellingValue || inventoryCostValue), color: 'text-purple-600', bg: 'bg-purple-50' },
  ], [topProducts, profitMargin, topCust, customersCount, stockBreakdown, inventorySellingValue, inventoryCostValue]);

  const handleRefresh = useCallback(() => {
    refetchSummary();
    refetchCharts();
    toast.success('تم تحديث بيانات اللوحة بنجاح');
  }, [refetchSummary, refetchCharts]);

  const navigateTo = useCallback((page: string) => {
    if (setActivePage) setActivePage(page);
  }, [setActivePage]);

  if (summaryError) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 space-y-4" dir="rtl">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-black text-slate-900">تعذر تحميل بيانات لوحة القيادة</h2>
        <p className="text-xs text-slate-500">حدث خطأ أثناء الاتصال بالخادم. يرجى التحقق من اتصال الشبكة وإعادة المحاولة.</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <PageHeader
        title="لوحة القيادة التنفيذية"
        subtitle="مؤشرات الأداء المالي، المخزون، والعمليات التجارية المباشرة"
        icon={BarChart3}
        badge={{ label: 'مباشر', variant: 'success' }}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/60">
              {(['week', 'month', 'year'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-extrabold transition-all duration-150',
                    dateRange === r ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {r === 'week' ? 'أسبوعي' : r === 'month' ? 'شهري' : 'سنوي'}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all active:scale-95 border border-slate-200/60"
              title="تحديث البيانات"
            >
              <RefreshCw className={cn('w-4 h-4', summaryLoading && 'animate-spin')} />
            </button>
          </div>
        }
      />

      {/* Quick Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
      >
        <div className="flex items-center gap-1.5 mb-2.5 px-1">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-black text-slate-600">إجراءات سريعة</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <QuickActionBtn label="فاتورة بيع جديدة" icon={ShoppingCart} onClick={() => navigateTo('sales-orders')} color="bg-slate-900" />
          <QuickActionBtn label="إضافة عميل" icon={UserPlus} onClick={() => navigateTo('customers')} color="bg-blue-600" />
          <QuickActionBtn label="إضافة صنف" icon={Package} onClick={() => navigateTo('inventory')} color="bg-emerald-600" />
          <QuickActionBtn label="فاتورة مورد" icon={ClipboardList} onClick={() => navigateTo('supplier-invoices')} color="bg-purple-600" />
          <QuickActionBtn label="التقارير المالية" icon={BarChart3} onClick={() => navigateTo('reports')} color="bg-amber-600" />
        </div>
      </motion.div>

      {/* Financial KPIs */}
      <WorkspaceSection
        title="المؤشرات المالية الرئيسية"
        description="صافي المبيعات، الأرباح، الضرائب، والمستحقات اليومية"
        actions={<span className="text-[11px] text-slate-400 font-bold">آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}</span>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي المبيعات"
            value={formatCurrency(totalSales)}
            change={salesChange}
            hasPrevData={hasPrevMonthSales}
            icon={TrendingUp}
            subtitle={formatCurrency(todaySales) + ' مبيعات اليوم'}
            delay={0}
            trend={salesTrend}
            loading={summaryLoading}
          />
          <StatCard
            title="صافي الأرباح التشغيلية"
            value={formatCurrency(netProfit)}
            change={profitChange}
            hasPrevData={hasPrevMonthProfit}
            icon={Wallet}
            subtitle={'صافي هامش الربح ' + profitMargin + '%'}
            delay={1}
            trend={profitTrend}
            variant="success"
            loading={summaryLoading}
          />
          <StatCard
            title="إجمالي الضرائب المحصلة"
            value={formatCurrency(totalTaxAmount)}
            icon={Percent}
            subtitle="الضريبة المحصلة على الفواتير المعتمدة"
            delay={2}
            variant="info"
            loading={summaryLoading}
          />
          <StatCard
            title="فواتير اليوم"
            value={String(todayInvoices)}
            icon={FileText}
            subtitle={pendingOrders + ' طلبات بيع قيد الانتظار'}
            delay={3}
            loading={summaryLoading}
          />
        </div>
      </WorkspaceSection>

      {/* Inventory & Operational KPIs */}
      <WorkspaceSection title="إحصائيات المخزون والشركاء" description="تقييم المخزون، الأصناف المنخفضة، وشبكة العملاء والموردين">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="تكلفة المخزون الإجمالية"
            value={formatCurrency(inventoryCostValue)}
            icon={Package}
            subtitle={'إجمالي ' + totalItems + ' صنف مسجل'}
            delay={4}
            loading={summaryLoading}
          />
          <StatCard
            title="العملاء المسجلون"
            value={String(customersCount)}
            icon={Users}
            subtitle={topCust.length + ' كبار العملاء النشطين'}
            delay={5}
            variant="info"
            trend={customerTrend}
            loading={summaryLoading}
          />
          <StatCard
            title="الأصناف المنخفضة"
            value={lowStockCount + ' صنف بحاجة للتزويد'}
            icon={AlertTriangle}
            subtitle={stockBreakdown.outOfStock + ' أصناف نفدت بالكامل'}
            delay={6}
            variant={lowStockCount > 0 ? 'warning' : 'success'}
            loading={summaryLoading}
          />
          <StatCard
            title="الموردون المعتمدون"
            value={String(suppliersCount)}
            icon={Truck}
            subtitle={totalPurchases > 0 ? formatCurrency(totalPurchases) + ' إجمالي المشتريات' : 'لا توجد فواتير توريد'}
            delay={7}
            loading={summaryLoading}
          />
        </div>
      </WorkspaceSection>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <WidgetCard
          title="مقارنة المبيعات والمشتريات الشهرية"
          icon={BarChart3}
          delay={8}
          action={
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-900" /><span className="text-xs text-slate-600 font-bold">المبيعات</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /><span className="text-xs text-slate-600 font-bold">المشتريات</span></div>
            </div>
          }
          className="lg:col-span-2"
        >
          {chartsLoading ? (
            <div className="h-64 w-full bg-slate-50 animate-pulse rounded-xl" />
          ) : (
            <div className="min-h-[256px] h-64" style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <BarChart data={salesByMonth} barSize={16} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15,23,42,0.03)' }} />
                  <Bar dataKey="sales" fill="#0f172a" radius={[4, 4, 0, 0]} name="المبيعات" />
                  <Bar dataKey="purchases" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="المشتريات" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </WidgetCard>

        <WidgetCard title="توزيع المخزون حسب الفئة" icon={PieChart} delay={9}>
          {categoryData.length === 0 ? (
            <EmptyState icon={PieChart} title="لا توجد بيانات" description="لم يتم تصنيف الأصناف بعد" />
          ) : (
            <div className="min-h-[256px] h-64 flex flex-col items-center justify-center" style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={170} debounce={100}>
                <RPieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={48} outerRadius={75} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2.5 mt-2 justify-center">
                {categoryData.slice(0, 5).map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs font-bold text-slate-700">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </WidgetCard>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <WidgetCard title="المنتجات الأعلى مبيعاً" icon={TrendingUp} delay={10} badge={topProducts.length}>
          {topProducts.length === 0 ? (
            <EmptyState icon={BarChart3} title="لا توجد مبيعات" />
          ) : (
            <div className="space-y-1.5">
              {topProducts.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0', i === 0 ? 'bg-slate-900' : i === 1 ? 'bg-slate-700' : i === 2 ? 'bg-slate-500' : 'bg-slate-300 text-slate-700')}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{formatCurrency(item.revenue)}</p>
                  </div>
                  <span className="text-xs font-black text-slate-900">{item.qty} وحدة</span>
                </div>
              ))}
            </div>
          )}
        </WidgetCard>

        <WidgetCard title="أهم العملاء إنفاقاً" icon={Award} delay={11} badge={topCust.length}>
          {topCust.length === 0 ? (
            <EmptyState icon={Users} title="لا يوجد عملاء" />
          ) : (
            <div className="space-y-1.5">
              {topCust.map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0', i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-600' : i === 2 ? 'bg-amber-700' : 'bg-slate-300 text-slate-700')}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{c.orders} طلبيات</p>
                  </div>
                  <span className="text-xs font-black text-slate-900">{formatCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </WidgetCard>

        <WidgetCard title="تنبيهات المخزون الحرج" icon={AlertTriangle} delay={12} badge={criticalAlerts.length}>
          {criticalAlerts.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="المخزون آمن" description="جميع الأصناف المستويات آمنة" />
          ) : (
            <div className="space-y-1.5">
              {criticalAlerts.map((item: any, i: number) => (
                <div key={item.id || i} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-rose-50/50 transition-colors">
                  <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', item.quantity === 0 ? 'bg-rose-600' : 'bg-amber-500')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{item.quantity} / {item.minQuantity} أدنى حد</p>
                  </div>
                  <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-md border', item.quantity === 0 ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60')}>
                    {item.quantity === 0 ? 'نفد' : '-' + item.deficit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </WidgetCard>

        <WidgetCard title="الإيرادات الأسبوعية" icon={TrendingUp} delay={13}>
          <div className="min-h-[192px] h-48" style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <AreaChart data={weeklyRevenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </WidgetCard>
      </div>

      {/* Activity & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <WidgetCard
          title="سجل النشاطات الحديثة"
          icon={Activity}
          delay={14}
          badge={activityLogs.length}
          action={
            <button onClick={() => navigateTo('activity-logs')} className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1">
              <span>عرض الكل</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          }
        >
          {activityLogs.length === 0 ? (
            <EmptyState icon={Activity} title="لا توجد نشاطات" />
          ) : (
            <div className="space-y-1">
              {activityLogs.slice(0, 5).map((log: any, i: number) => (
                <div key={i} className="flex items-start gap-2.5 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-900 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{log.action}</p>
                    <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {log.username} • {formatDate(new Date(log.timestamp).getTime())}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </WidgetCard>

        <WidgetCard
          title="التنبيهات والإشعارات"
          icon={Bell}
          delay={15}
          badge={unreadNotifications}
          action={unreadNotifications > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
        >
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="لا توجد إشعارات" description="جميع البيانات محدثة" />
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 4).map((n: any) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-2.5 p-2.5 rounded-xl border transition-all',
                    n.type === 'warning' ? 'bg-amber-50/50 border-amber-200/50' : n.type === 'success' ? 'bg-emerald-50/50 border-emerald-200/50' : n.type === 'error' ? 'bg-rose-50/50 border-rose-200/50' : 'bg-blue-50/50 border-blue-200/50'
                  )}
                >
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border', n.type === 'warning' ? 'bg-amber-100 text-amber-700 border-amber-200' : n.type === 'success' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : n.type === 'error' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-blue-100 text-blue-700 border-blue-200')}>
                    {n.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> : n.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                    <p className="text-[10px] text-slate-600 line-clamp-1">{n.message}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold shrink-0">{formatDate(new Date(n.date).getTime())}</span>
                </div>
              ))}
            </div>
          )}
        </WidgetCard>

        <WidgetCard title="رؤى ذكية وتوصيات الأداء" icon={Sparkles} delay={16} badge="ERP AI">
          <div className="space-y-2.5">
            {insights.map((insight: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', insight.bg)}>
                  <insight.icon className={cn('w-4 h-4', insight.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400">{insight.label}</p>
                  <p className="text-xs font-black text-slate-900 truncate">{insight.value}</p>
                </div>
              </div>
            ))}
          </div>
        </WidgetCard>
      </div>

      {/* Pending Approvals Bar */}
      {(pendingSales > 0 || unpaidPurchases > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-black text-amber-900">عمليات في انتظار الإجراء أو الاعتماد</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {pendingSales > 0 && (
              <button
                onClick={() => navigateTo('sales-orders')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-amber-200 text-amber-800 text-xs font-black hover:bg-amber-100/50 transition-all"
              >
                <ShoppingCart className="w-4 h-4 text-amber-600" />
                <span>{pendingSales} طلبيات بيع قيد الانتظار</span>
              </button>
            )}
            {unpaidPurchases > 0 && (
              <button
                onClick={() => navigateTo('supplier-invoices')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-blue-200 text-blue-800 text-xs font-black hover:bg-blue-100/50 transition-all"
              >
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <span>{unpaidPurchases} فواتير موردين غير مدفوعة</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
