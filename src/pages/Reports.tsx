import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAnalyticsSummary, useSalesDetails, useInventoryAnalytics, useProfitDetails, useExpensesDetails } from '../hooks/useAnalytics';
import { useInventoryReports, useCustomerBalances } from '../hooks/useReports';
import {
  BarChart3, TrendingUp, TrendingDown, Package, FileText, Download,
  History, ArrowRight, CheckCircle2, DollarSign, Users, Search, X,
  Loader2, Percent, PieChart, Activity, Calendar, Filter, Printer,
  FileSpreadsheet, ArrowUpRight, ArrowDownRight, Minus, RefreshCw,
  Clock, Wallet, Receipt, ShoppingCart, Target, Layers, Zap,
  ChevronDown, ChevronUp, Info, Eye, ExternalLink, ChartLine,
  AlertTriangle, Truck, BadgePercent, Landmark, ArrowLeft,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie as RePie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';

import { cn, formatCurrency, formatDate } from '../lib/utils';
import { Tabs, WorkspaceLayout } from '../components/design-system';

// ��� Types �����������������������������������������������
type MetricType = 'sales' | 'gross_profit' | 'net_profit' | 'inventory' | 'expenses' | 'customers' | 'delivered_orders' | 'top_selling' | 'tax' | null;

interface KPICardData {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
  trend: { direction: 'up' | 'down' | 'neutral'; value: string; color: string };
  type: MetricType;
  rawValue: number;
}

interface StatRow { id: number | string; [key: string]: unknown; raw_search?: string; }

interface ModalContent { title: string; subtitle: string; headers: string[]; rows: StatRow[]; }

// ��� Color palette ���������������������������������������

const GRADIENT_CHART = { offset: '0%', color: '#0A0A0B', opacity: 0.2 };
const GRADIENT_CHART_END = { offset: '100%', color: '#0A0A0B', opacity: 0.02 };

// ��� Error Boundary ��������������������������������������
class ReportErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-black text-gray-900 mb-2">حدث خطأ في تحميل التقرير</h3>
          <p className="text-sm text-gray-500 mb-4">يرجى تحديث الصفحة أو المحاولة مرة أخرى</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2 bg-black text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all">
            تحديث الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ��� Skeleton loader �������������������������������������
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton-pulse', className)} />;
}

// ��� Animated counter ������������������������������������
function AnimatedValue({ value, prefix = '', suffix = '' }: { value: string; prefix?: string; suffix?: string }) {
  return (
    
    <motion.h3
      className="text-2xl font-black tracking-tight text-[var(--text-primary)]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {prefix}{value}{suffix}
    </motion.h3>
  );
}

// ��� Premium KPI Card ������������������������������������
function KPICard({
  stat, index, onClick,
}: {
  stat: KPICardData; index: number; onClick: () => void;
}) {
  const Icon = stat.icon;
  const trendIcon = stat.trend.direction === 'up' ? ArrowUpRight
    : stat.trend.direction === 'down' ? ArrowDownRight : Minus;

  return (
    
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative group text-right w-full overflow-hidden rounded-2xl border border-[var(--border-light)] bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-hover)] hover:border-gray-200/80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
    >
      {/* Gradient accent bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-80', stat.gradient)} />

      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-sm', stat.iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
          stat.trend.direction === 'up' ? 'bg-green-50 text-green-700' :
          stat.trend.direction === 'down' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500',
        )}>
          {React.createElement(trendIcon, { className: 'w-3 h-3' })}
          <span>{stat.trend.value}</span>
        </div>
      </div>

      <p className="text-[11px] font-bold text-[var(--text-tertiary)] mb-1">{stat.label}</p>
      <AnimatedValue value={stat.value} />

      {/* Micro hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-black/[0.02] to-transparent" />
    </motion.button>
  );
}

// ��� KPI Mini Sparkline ����������������������������������
function MiniSparkline({ data, color }: { data: { value: number }[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const h = 32; const w = 80;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - (d.value / max) * h}`).join(' ');
  return (
    
    <svg width={w} height={h} className="opacity-40" viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

// ��� Custom Chart Tooltip ��������������������������������
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    
    <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-xl px-4 py-3 shadow-[var(--shadow-elevated)] text-right">
      <p className="text-[11px] font-bold text-[var(--text-tertiary)] mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="font-bold text-gray-700">{p.name}</span>
          </div>
          <span className="font-black">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ��� Custom Pie Tooltip ����������������������������������
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    
    <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-xl px-4 py-3 shadow-[var(--shadow-elevated)] text-right">
      <div className="flex items-center gap-2 text-xs font-bold">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
        <span>{d.name}</span>
      </div>
      <p className="text-sm font-black mt-1">{formatCurrency(d.value)}</p>
    </div>
  );
}

// ��� Metric-specific overview helpers �������������������
function metricSectionTitle(metric: MetricType): string {
  const titles: Record<string, string> = {
    sales: 'تحليل المبيعات (آخر 6 أشهر)', gross_profit: 'تحليل مجمل الربح (آخر 6 أشهر)',
    net_profit: 'تحليل صافي الربح (آخر 6 أشهر)', tax: 'تحليل الضرائب (آخر 6 أشهر)',
    inventory: 'تحليل المخزون (آخر 6 أشهر)', expenses: 'تحليل المصروفات (آخر 6 أشهر)',
    customers: 'تحليل العملاء (آخر 6 أشهر)', delivered_orders: 'تحليل الفواتير المسلمة (آخر 6 أشهر)',
  };
  return titles[metric ?? ''] || 'تحليل الأداء (آخر 6 أشهر)';
}
function metricPieTitle(metric: MetricType): string {
  const titles: Record<string, string> = {
    sales: 'توزيع المبيعات', gross_profit: 'توزيع الإيرادات',
    net_profit: 'توزيع الإيرادات', tax: 'توزيع الضرائب',
    inventory: 'توزيع المخزون', expenses: 'توزيع المصروفات',
    customers: 'توزيع العملاء', delivered_orders: 'توزيع التوصيلات',
  };
  return titles[metric ?? ''] || 'توزيع المخزون';
}
function metricPieData(metric: MetricType, distributionData: { name: string; value: number }[], monthlyData: any[]): { name: string; value: number }[] {
  if (metric === 'expenses' && monthlyData.length > 0) {
    return monthlyData.map(d => ({ name: d.month, value: d.مصاريف || 0 }));
  }
  if (metric === 'sales' && monthlyData.length > 0) {
    return monthlyData.map(d => ({ name: d.month, value: d.مبيعات || 0 }));
  }
  return distributionData;
}

interface OverviewCard { label: string; value: string; icon: React.ComponentType<{ className?: string }>; gradient: string; }

const metricOverviewCards: Record<string, (ctx: any) => OverviewCard[]> = {
  sales: (ctx) => [
    { label: 'إجمالي الإيرادات', value: formatCurrency(ctx.totalRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
    { label: 'عدد الفواتير', value: String(ctx.deliveredOrdersCount), icon: FileText, gradient: 'from-blue-500/10 to-transparent' },
    { label: 'صافي الربح', value: formatCurrency(ctx.netProfit), icon: CheckCircle2, gradient: 'from-green-500/10 to-transparent' },
    { label: 'المصاريف', value: formatCurrency(ctx.totalExpenses), icon: Wallet, gradient: 'from-red-500/10 to-transparent' },
  ],
  gross_profit: (ctx) => [
    { label: 'الإيرادات', value: formatCurrency(ctx.totalRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
    { label: 'COGS', value: formatCurrency(ctx.totalCostOfGoodsSold), icon: TrendingDown, gradient: 'from-orange-500/10 to-transparent' },
    { label: 'مجمل الربح', value: formatCurrency(ctx.grossProfit), icon: TrendingUp, gradient: 'from-blue-500/10 to-transparent' },
    { label: 'الهامش', value: ctx.totalRevenue ? ((ctx.grossProfit / ctx.totalRevenue) * 100).toFixed(1) + '%' : '0%', icon: Percent, gradient: 'from-green-500/10 to-transparent' },
  ],
  net_profit: (ctx) => [
    { label: 'الإيرادات', value: formatCurrency(ctx.totalRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
    { label: 'مجمل الربح', value: formatCurrency(ctx.grossProfit), icon: TrendingUp, gradient: 'from-blue-500/10 to-transparent' },
    { label: 'المصاريف', value: formatCurrency(ctx.totalExpenses), icon: Wallet, gradient: 'from-red-500/10 to-transparent' },
    { label: 'صافي الربح', value: formatCurrency(ctx.netProfit), icon: CheckCircle2, gradient: ctx.netProfit >= 0 ? 'from-green-500/10 to-transparent' : 'from-red-500/10 to-transparent' },
  ],
  tax: (ctx) => [
    { label: 'الضريبة المحصلة', value: formatCurrency(ctx.totalTaxCollected), icon: Percent, gradient: 'from-purple-500/10 to-transparent' },
    { label: 'عدد الفواتير', value: String(ctx.deliveredOrdersCount), icon: FileText, gradient: 'from-blue-500/10 to-transparent' },
    { label: 'الإيرادات', value: formatCurrency(ctx.totalRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
    { label: 'نسبة الضريبة', value: '14%', icon: BadgePercent, gradient: 'from-indigo-500/10 to-transparent' },
  ],
  inventory: (ctx) => [
    { label: 'قيمة المخزون', value: formatCurrency(ctx.inventoryTotalValue), icon: Package, gradient: 'from-orange-500/10 to-transparent' },
    { label: 'إجمالي الأصناف', value: String(ctx.totalItemsCount), icon: Layers, gradient: 'from-blue-500/10 to-transparent' },
    { label: 'العملاء', value: String(ctx.totalCustomersCount), icon: Users, gradient: 'from-purple-500/10 to-transparent' },
    { label: 'فواتير مسلمة', value: String(ctx.deliveredOrdersCount), icon: Receipt, gradient: 'from-emerald-500/10 to-transparent' },
  ],
  expenses: (ctx) => [
    { label: 'إجمالي المصروفات', value: formatCurrency(ctx.totalExpenses), icon: Wallet, gradient: 'from-red-500/10 to-transparent' },
    { label: 'عدد المعاملات', value: String(ctx.expensesQuery?.data?.summary?.totalTransactions ?? 0), icon: FileText, gradient: 'from-orange-500/10 to-transparent' },
    { label: 'الإيرادات', value: formatCurrency(ctx.totalRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
    { label: 'نسبة المصروفات', value: ctx.totalRevenue ? ((ctx.totalExpenses / ctx.totalRevenue) * 100).toFixed(1) + '%' : '0%', icon: Percent, gradient: 'from-amber-500/10 to-transparent' },
  ],
  customers: (ctx) => [
    { label: 'إجمالي العملاء', value: String(ctx.totalCustomersCount), icon: Users, gradient: 'from-purple-500/10 to-transparent' },
    { label: 'الإيرادات', value: formatCurrency(ctx.totalRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
    { label: 'فواتير مسلمة', value: String(ctx.deliveredOrdersCount), icon: Receipt, gradient: 'from-emerald-500/10 to-transparent' },
    { label: 'متوسط لكل عميل', value: ctx.totalCustomersCount ? formatCurrency(ctx.totalRevenue / ctx.totalCustomersCount) : '0', icon: Target, gradient: 'from-blue-500/10 to-transparent' },
  ],
  delivered_orders: (ctx) => [
    { label: 'فواتير مسلمة', value: String(ctx.deliveredOrdersCount), icon: Receipt, gradient: 'from-emerald-500/10 to-transparent' },
    { label: 'الإيرادات', value: formatCurrency(ctx.totalRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
    { label: 'صافي الربح', value: formatCurrency(ctx.netProfit), icon: CheckCircle2, gradient: 'from-green-500/10 to-transparent' },
    { label: 'المصاريف', value: formatCurrency(ctx.totalExpenses), icon: Wallet, gradient: 'from-red-500/10 to-transparent' },
  ],
};

const CHART_COLORS = ['#0A0A0B', '#2563EB', '#EF4444', '#F59E0B', '#22C55E', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'];

// ��� Modal Section Wrapper �������������������������������
function ModalSection({ title, icon: Icon, children, className }: {
  title: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode; className?: string;
}) {
  return (
    
    <div className={cn('bg-white rounded-xl border border-[var(--border-light)] p-5', className)}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {Icon && <Icon className="w-4 h-4 text-[var(--text-tertiary)]" />}
          <h4 className="text-sm font-bold text-[var(--text-primary)]">{title}</h4>
        </div>
      )}
      {children}
    </div>
  );
}

// ��� Premium Analytics Modal �����������������������������
function AnalyticsModal({
  metric, content, onClose, searchTerm, onSearchChange, monthlyData, distributionData,
  topSellingProducts, validSales, items, totalRevenue, grossProfit, netProfit, totalExpenses,
  totalCostOfGoodsSold, totalTaxCollected, inventoryTotalValue, totalCustomersCount,
  deliveredOrdersCount, totalItemsCount, customers, warehouses,   expensesQuery, salesQuery,
}: {
  metric: MetricType; content: ModalContent; onClose: () => void;
  searchTerm: string; onSearchChange: (v: string) => void;
  monthlyData: any[]; distributionData: { name: string; value: number }[];
  topSellingProducts: { name: string; quantity: number; revenue: number }[] | undefined;
  validSales: any[]; items: any[] | undefined;
  totalRevenue: number; grossProfit: number; netProfit: number; totalExpenses: number;
  totalCostOfGoodsSold: number; totalTaxCollected: number; inventoryTotalValue: number;
  totalCustomersCount: number; deliveredOrdersCount: number;
  totalItemsCount: number;
  customers: any[] | undefined; warehouses: any[] | undefined;
  expensesQuery: any;
}) {
  // ── Computed analytics values ──
  const prevMonth = monthlyData.length >= 2 ? monthlyData[monthlyData.length - 2] : null;
  const currMonth = monthlyData.length >= 1 ? monthlyData[monthlyData.length - 1] : null;
  const prevSales = prevMonth?.مبيعات ?? 0;
  const currSales = currMonth?.مبيعات ?? 0;
  const prevProfit = prevMonth?.صافي_الربح ?? 0;
  const currProfit = currMonth?.صافي_الربح ?? 0;
  const prevExpenses = prevMonth?.مصاريف ?? 0;
  const currExpenses = currMonth?.مصاريف ?? 0;

  const avgOrderValue = deliveredOrdersCount > 0 ? totalRevenue / deliveredOrdersCount : 0;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

  const orders = salesQuery?.data?.tables?.orders ?? [];
  const sortedOrders = [...orders].sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
  const largestInvoices = sortedOrders.slice(0, 5);

  const customerSalesMap: Record<string, number> = {};
  orders.forEach(o => { customerSalesMap[o.customer] = (customerSalesMap[o.customer] || 0) + (o.totalAmount || 0); });
  const topCustomersBySales = Object.entries(customerSalesMap)
    .sort(([, a], [, b]) => b - a).slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  const customersWithBalance = (customers || []).filter(c => (c.balance || 0) > 0).sort((a, b) => b.balance - a.balance);
  const lowStockItems = (items || []).filter((i: any) => (i.quantity || 0) <= (i.minQuantity || 0));
  const expenseTransactions = expensesQuery?.data?.tables?.transactions ?? [];
  const expenseCategoryBreakdown = expensesQuery?.data?.charts?.categoryBreakdown ?? [];

  const handleExport = useCallback((type: 'pdf' | 'excel') => {
    const txt = `${content.title}\nالتاريخ: ${new Date().toLocaleString('ar-EG')}\n` +
      `إجمالي المبيعات: ${totalRevenue} ج.م\nقيمة المخزون: ${inventoryTotalValue} ج.م\n`;
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report_${Date.now()}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
    a.click(); URL.revokeObjectURL(url);
  }, [content.title, totalRevenue, inventoryTotalValue]);

  function pct(curr: number, prev: number): string {
    if (prev === 0) return '—';
    return `${((curr - prev) / prev * 100).toFixed(1)}%`;
  }

  function StatCard({ label, value, change, icon: Icon, trend }: {
    label: string; value: string; change?: string; icon: React.ComponentType<any>; trend?: 'up' | 'down' | 'neutral';
  }) {
    return (
      <div className="relative rounded-xl border border-[var(--border-light)] bg-gradient-to-br from-white to-gray-50/50 p-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-gray-600" />
          </div>
          <p className="text-[10px] font-bold text-[var(--text-tertiary)]">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-lg font-black">{value}</p>
          {change && (
            <span className={cn('text-[10px] font-bold', trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400')}>
              {change}
            </span>
          )}
        </div>
      </div>
    );
  }

  function Section({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<any>; children: React.ReactNode }) {
    return (
      <div className="bg-white rounded-xl border border-[var(--border-light)] p-5">
        {title && (
          <div className="flex items-center gap-2 mb-4">
            {Icon && <Icon className="w-4 h-4 text-[var(--text-tertiary)]" />}
            <h4 className="text-sm font-bold text-[var(--text-primary)]">{title}</h4>
          </div>
        )}
        {children}
      </div>
    );
  }

  function InsightCard({ icon: Icon, label, value, note, color, bg }: {
    icon: React.ComponentType<any>; label: string; value: string; note: string; color: string; bg: string;
  }) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-light)] bg-white">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-bold text-[var(--text-tertiary)]">{label}</p>
          <p className="text-base font-black text-[var(--text-primary)]">{value}</p>
        </div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)]">{note}</span>
      </div>
    );
  }

  function ExportBar() {
    return (
      <div className="flex items-center gap-2">
        <button onClick={() => handleExport('pdf')} className="btn-premium px-3 py-2 text-[11px] bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> PDF
        </button>
        <button onClick={() => handleExport('excel')} className="btn-premium px-3 py-2 text-[11px] bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
        </button>
        <button onClick={() => window.print()} className="btn-premium px-3 py-2 text-[11px] bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-1.5">
          <Printer className="w-3.5 h-3.5" /> طباعة
        </button>
      </div>
    );
  }

  function renderPanel() {
    switch (metric) {
      case 'sales':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="إجمالي المبيعات" value={formatCurrency(totalRevenue)} change={pct(currSales, prevSales)} icon={DollarSign} trend={currSales >= prevSales ? 'up' : 'down'} />
              <StatCard label="عدد الفواتير" value={deliveredOrdersCount.toLocaleString()} icon={FileText} />
              <StatCard label="متوسط الفاتورة" value={formatCurrency(avgOrderValue)} icon={BarChart3} />
              <StatCard label="الضرائب المحصلة" value={formatCurrency(totalTaxCollected)} icon={Percent} />
            </div>
            <Section title="اتجاه المبيعات الشهري" icon={ChartLine}>
              <div className="min-h-[256px] h-64" style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <AreaChart data={monthlyData}>
                    <defs><linearGradient id="saleGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0A0A0B" stopOpacity={0.15} /><stop offset="95%" stopColor="#0A0A0B" stopOpacity={0.01} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="مبيعات" stroke="#0A0A0B" strokeWidth={2} fill="url(#saleGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section title="أكبر الفواتير" icon={Receipt}>
                <div className="space-y-2">
                  {largestInvoices.length > 0 ? largestInvoices.map((o, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div><p className="text-xs font-bold">{o.orderNumber || `#${o.id}`}</p><p className="text-[10px] text-gray-400">{o.customer}</p></div>
                      <span className="text-xs font-black">{formatCurrency(o.totalAmount)}</span>
                    </div>
                  )) : <p className="text-xs text-gray-400 text-center py-4">لا توجد فواتير</p>}
                </div>
              </Section>
              {topCustomersBySales.length > 0 && (
                <Section title="أفضل العملاء" icon={Users}>
                  <div className="space-y-2">
                    {topCustomersBySales.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2"><span className="w-5 h-5 bg-black text-white rounded-md flex items-center justify-center text-[10px] font-bold">{i + 1}</span><span className="text-xs font-bold">{c.name}</span></div>
                        <span className="text-xs font-black">{formatCurrency(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
            {topSellingProducts && topSellingProducts.length > 0 && (
              <Section title="المنتجات الأكثر مبيعاً" icon={ShoppingCart}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {topSellingProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2"><span className="w-5 h-5 bg-black text-white rounded-md flex items-center justify-center text-[10px] font-bold">{i + 1}</span><div><p className="text-xs font-bold">{p.name}</p><p className="text-[10px] text-gray-400">{p.quantity} وحدة</p></div></div>
                      <span className="text-xs font-black">{formatCurrency(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
            <Section title="رؤى وتحليلات" icon={Zap}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InsightCard icon={TrendingUp} label="نمو المبيعات" value={pct(currSales, prevSales)} note={currSales >= prevSales ? 'إيجابي' : 'سلبي'} color={currSales >= prevSales ? 'text-green-600' : 'text-red-500'} bg={currSales >= prevSales ? 'bg-green-50' : 'bg-red-50'} />
                <InsightCard icon={BarChart3} label="متوسط الفاتورة" value={formatCurrency(avgOrderValue)} note={`${deliveredOrdersCount} فاتورة`} color="text-blue-600" bg="bg-blue-50" />
                <InsightCard icon={Percent} label="نسبة الضريبة" value={totalRevenue > 0 ? `${((totalTaxCollected / totalRevenue) * 100).toFixed(1)}%` : '0%'} note="من المبيعات" color="text-purple-600" bg="bg-purple-50" />
                <InsightCard icon={Receipt} label="أكبر فاتورة" value={largestInvoices[0] ? formatCurrency(largestInvoices[0].totalAmount) : '—'} note={largestInvoices[0]?.customer || ''} color="text-emerald-600" bg="bg-emerald-50" />
              </div>
            </Section>
            <Section title="تصدير التقرير"><ExportBar /></Section>
          </motion.div>
        );

      case 'gross_profit':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="الإيرادات" value={formatCurrency(totalRevenue)} change={pct(currSales, prevSales)} icon={DollarSign} trend={currSales >= prevSales ? 'up' : 'down'} />
              <StatCard label="تكلفة البضاعة (COGS)" value={formatCurrency(totalCostOfGoodsSold || 0)} icon={Wallet} />
              <StatCard label="مجمل الربح" value={formatCurrency(grossProfit)} change={pct(currProfit, prevProfit)} icon={TrendingUp} trend={currProfit >= prevProfit ? 'up' : 'down'} />
              <StatCard label="هامش الربح" value={`${grossMargin.toFixed(1)}%`} icon={Percent} />
            </div>
            <Section title="مقارنة الإيرادات والتكلفة" icon={BarChart3}>
              <div className="min-h-[256px] h-64" style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="مبيعات" fill="#0A0A0B" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="صافي_الربح" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="تحليل مجمل الربح" icon={FileText}>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><span className="text-xs font-bold">الإيرادات</span><span className="text-xs font-black">{formatCurrency(totalRevenue)}</span></div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl"><span className="text-xs font-bold">تكلفة البضاعة المباعة</span><span className="text-xs font-black">{formatCurrency(totalCostOfGoodsSold || 0)}</span></div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl"><span className="text-xs font-bold">مجمل الربح</span><span className="text-xs font-black">{formatCurrency(grossProfit)}</span></div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl"><span className="text-xs font-bold">هامش الربح الإجمالي</span><span className="text-xs font-black">{grossMargin.toFixed(1)}%</span></div>
              </div>
            </Section>
            <Section title="رؤى وتحليلات" icon={Zap}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InsightCard icon={TrendingUp} label="نمو الإيرادات" value={pct(currSales, prevSales)} note={currSales >= prevSales ? 'تصاعدي' : 'تنازلي'} color={currSales >= prevSales ? 'text-green-600' : 'text-red-500'} bg={currSales >= prevSales ? 'bg-green-50' : 'bg-red-50'} />
                <InsightCard icon={Percent} label="نسبة COGS" value={totalRevenue > 0 ? `${((totalCostOfGoodsSold / totalRevenue) * 100).toFixed(1)}%` : '0%'} note="من الإيرادات" color="text-orange-600" bg="bg-orange-50" />
              </div>
            </Section>
            <Section title="تصدير التقرير"><ExportBar /></Section>
          </motion.div>
        );

      case 'net_profit':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="الإيرادات" value={formatCurrency(totalRevenue)} change={pct(currSales, prevSales)} icon={DollarSign} trend={currSales >= prevSales ? 'up' : 'down'} />
              <StatCard label="مجمل الربح" value={formatCurrency(grossProfit)} icon={TrendingUp} />
              <StatCard label="المصاريف" value={formatCurrency(totalExpenses)} change={pct(currExpenses, prevExpenses)} icon={Wallet} trend={currExpenses <= prevExpenses ? 'up' : 'down'} />
              <StatCard label="صافي الربح" value={formatCurrency(netProfit)} change={pct(currProfit, prevProfit)} icon={CheckCircle2} trend={currProfit >= prevProfit ? 'up' : 'down'} />
            </div>
            <Section title="اتجاه الربحية الشهري" icon={ChartLine}>
              <div className="min-h-[256px] h-64" style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <AreaChart data={monthlyData}>
                    <defs><linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0A0A0B" stopOpacity={0.15} /><stop offset="95%" stopColor="#0A0A0B" stopOpacity={0.01} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="صافي_الربح" stroke="#0A0A0B" strokeWidth={2} fill="url(#netGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="قائمة الدخل" icon={FileText}>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><span className="text-xs font-bold">الإيرادات</span><span className="text-xs font-black">{formatCurrency(totalRevenue)}</span></div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl"><span className="text-xs font-bold">مجمل الربح</span><span className="text-xs font-black">{formatCurrency(grossProfit)}</span></div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl"><span className="text-xs font-bold">إجمالي المصاريف</span><span className="text-xs font-black">({formatCurrency(totalExpenses)})</span></div>
                <div className="border-t border-gray-200 pt-2 flex items-center justify-between p-3 bg-green-50 rounded-xl"><span className="text-xs font-bold">صافي الربح</span><span className="text-xs font-black">{formatCurrency(netProfit)}</span></div>
              </div>
            </Section>
            <Section title="تحليل المصاريف" icon={Wallet}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[10px] font-bold text-gray-500">نسبة المصاريف</p><p className="text-lg font-black">{expenseRatio.toFixed(1)}%</p></div>
                <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[10px] font-bold text-gray-500">هامش الربح الصافي</p><p className="text-lg font-black">{netMargin.toFixed(1)}%</p></div>
              </div>
            </Section>
            <Section title="رؤى وتحليلات" icon={Zap}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InsightCard icon={TrendingUp} label="نمو الأرباح" value={pct(currProfit, prevProfit)} note={currProfit >= prevProfit ? 'إيجابي' : 'سلبي'} color={currProfit >= prevProfit ? 'text-green-600' : 'text-red-500'} bg={currProfit >= prevProfit ? 'bg-green-50' : 'bg-red-50'} />
                <InsightCard icon={Percent} label="نسبة المصاريف" value={`${expenseRatio.toFixed(1)}%`} note={`${totalExpenses > 0 ? 'مقابل كل 1 ج.م إيرادات' : ''}`} color="text-red-500" bg="bg-red-50" />
              </div>
            </Section>
            <Section title="تصدير التقرير"><ExportBar /></Section>
          </motion.div>
        );

      case 'tax':
        const avgTaxPerInvoice = deliveredOrdersCount > 0 ? totalTaxCollected / deliveredOrdersCount : 0;
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="الضرائب المحصلة" value={formatCurrency(totalTaxCollected)} icon={Percent} />
              <StatCard label="عدد الفواتير" value={deliveredOrdersCount.toLocaleString()} icon={Receipt} />
              <StatCard label="متوسط الضريبة لكل فاتورة" value={formatCurrency(avgTaxPerInvoice)} icon={BarChart3} />
              <StatCard label="نسبة الضريبة" value={totalRevenue > 0 ? `${((totalTaxCollected / totalRevenue) * 100).toFixed(2)}%` : '0%'} icon={BadgePercent} />
            </div>
            <Section title="تحصيل الضرائب الشهري" icon={ChartLine}>
              <div className="min-h-[256px] h-64" style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <AreaChart data={monthlyData.map(m => ({ ...m, ضريبة: (m.مبيعات || 0) * 0.14 }))}>
                    <defs><linearGradient id="taxGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15} /><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.01} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="ضريبة" stroke="#8B5CF6" strokeWidth={2} fill="url(#taxGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="ملخص الضرائب" icon={Landmark}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[10px] font-bold text-gray-500">إجمالي المبيعات الخاضعة للضريبة</p><p className="text-lg font-black">{formatCurrency(totalRevenue)}</p></div>
                <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[10px] font-bold text-gray-500">متوسط الضريبة</p><p className="text-lg font-black">{formatCurrency(avgTaxPerInvoice)}</p></div>
                <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[10px] font-bold text-gray-500">عدد الفواتير</p><p className="text-lg font-black">{deliveredOrdersCount.toLocaleString()}</p></div>
              </div>
            </Section>
            <Section title="تصدير التقرير"><ExportBar /></Section>
          </motion.div>
        );

      case 'inventory':
        const uniqueCategories = new Set((items || []).map((i: any) => i.category || i.name).filter(Boolean)).size;
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="قيمة المخزون" value={formatCurrency(inventoryTotalValue)} icon={Package} />
              <StatCard label="إجمالي الأصناف" value={String(items?.length || 0)} icon={Layers} />
              <StatCard label="عدد الفئات" value={String(uniqueCategories)} icon={BarChart3} />
              <StatCard label="منتجات منخفضة" value={String(lowStockItems.length)} icon={AlertTriangle} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section title="توزيع المخزون حسب الفئة" icon={PieChart}>
                <div className="min-h-[256px] h-64 flex items-center justify-center" style={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <RePieChart>
                      <RePie data={distributionData.length > 0 ? distributionData : [{ name: 'لا توجد بيانات', value: 1 }]} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                        {distributionData.map((_e, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                      </RePie>
                      <Tooltip content={<PieTooltip />} />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 flex-wrap justify-center">
                    {distributionData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />{d.name}
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
              {lowStockItems.length > 0 && (
                <Section title="تنبيهات المخزون المنخفض" icon={AlertTriangle}>
                  <div className="space-y-2">
                    {lowStockItems.slice(0, 5).map((i: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                        <div><p className="text-xs font-bold">{i.name}</p><p className="text-[10px] text-gray-400">SKU: {i.sku || '—'}</p></div>
                        <span className="text-xs font-black text-red-600">{i.quantity} / {i.minQuantity || 0}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
            <Section title="رؤى وتحليلات" icon={Zap}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InsightCard icon={Package} label="إجمالي الأصناف" value={String(items?.length || 0)} note="صنف" color="text-blue-600" bg="bg-blue-50" />
                <InsightCard icon={AlertTriangle} label="منتجات منخفضة" value={String(lowStockItems.length)} note={lowStockItems.length === 0 ? 'لا يوجد' : 'تحتاج إعادة طلب'} color={lowStockItems.length > 0 ? 'text-red-500' : 'text-green-600'} bg={lowStockItems.length > 0 ? 'bg-red-50' : 'bg-green-50'} />
              </div>
            </Section>
            <Section title="تصدير التقرير"><ExportBar /></Section>
          </motion.div>
        );

      case 'expenses':
        const monthlyAvgExpense = monthlyData.length > 0 ? monthlyData.reduce((s: number, m: any) => s + (m.مصاريف || 0), 0) / monthlyData.length : 0;
        const expenseCategories = expenseCategoryBreakdown || [];
        const sortedExpenseTransactions = [...(expenseTransactions || [])].sort((a: any, b: any) => (b.amount || 0) - (a.amount || 0)).slice(0, 5);
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="إجمالي المصاريف" value={formatCurrency(totalExpenses)} change={pct(currExpenses, prevExpenses)} icon={Wallet} trend={currExpenses <= prevExpenses ? 'up' : 'down'} />
              <StatCard label="نسبة المصاريف" value={`${expenseRatio.toFixed(1)}%`} icon={Percent} />
              <StatCard label="متوسط شهري" value={formatCurrency(monthlyAvgExpense)} icon={Calendar} />
              <StatCard label="عدد المعاملات" value={String(expenseTransactions?.length || 0)} icon={FileText} />
            </div>
            <Section title="اتجاه المصاريف الشهري" icon={ChartLine}>
              <div className="min-h-[256px] h-64" style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <AreaChart data={monthlyData}>
                    <defs><linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} /><stop offset="95%" stopColor="#EF4444" stopOpacity={0.01} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="مصاريف" stroke="#EF4444" strokeWidth={2} fill="url(#expGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {expenseCategories.length > 0 && (
                <Section title="المصاريف حسب الفئة" icon={PieChart}>
                  <div className="space-y-2">
                    {expenseCategories.map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-xs font-bold">{c.category}</span>
                        </div>
                        <span className="text-xs font-black">{formatCurrency(c.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
              {sortedExpenseTransactions.length > 0 && (
                <Section title="أكبر معاملات المصاريف" icon={Wallet}>
                  <div className="space-y-2">
                    {sortedExpenseTransactions.map((t: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div><p className="text-xs font-bold">{t.category || t.description || '—'}</p><p className="text-[10px] text-gray-400">{t.description || ''}</p></div>
                        <span className="text-xs font-black">{formatCurrency(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
            <Section title="رؤى وتحليلات" icon={Zap}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InsightCard icon={Wallet} label="نسبة المصاريف" value={`${expenseRatio.toFixed(1)}%`} note="من الإيرادات" color="text-red-500" bg="bg-red-50" />
                <InsightCard icon={CheckCircle2} label="صافي الربح بعد المصاريف" value={formatCurrency(netProfit)} note={netProfit >= 0 ? 'إيجابي' : 'سلبي'} color={netProfit >= 0 ? 'text-green-600' : 'text-red-500'} bg={netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'} />
              </div>
            </Section>
            <Section title="تصدير التقرير"><ExportBar /></Section>
          </motion.div>
        );

      case 'customers':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="إجمالي العملاء" value={totalCustomersCount.toLocaleString()} icon={Users} />
              <StatCard label="إجمالي المبيعات" value={formatCurrency(totalRevenue)} icon={DollarSign} />
              <StatCard label="متوسط الشراء" value={formatCurrency(avgOrderValue)} icon={BarChart3} />
              <StatCard label="فواتير مسلمة" value={deliveredOrdersCount.toLocaleString()} icon={Receipt} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {topCustomersBySales.length > 0 && (
                <Section title="أفضل العملاء حسب المبيعات" icon={Users}>
                  <div className="space-y-2">
                    {topCustomersBySales.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2"><span className="w-5 h-5 bg-black text-white rounded-md flex items-center justify-center text-[10px] font-bold">{i + 1}</span><span className="text-xs font-bold">{c.name}</span></div>
                        <span className="text-xs font-black">{formatCurrency(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
              {customersWithBalance.length > 0 && (
                <Section title="العملاء ذوو الأرصدة المستحقة" icon={DollarSign}>
                  <div className="space-y-2">
                    {customersWithBalance.slice(0, 5).map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                        <div><p className="text-xs font-bold">{c.name}</p><p className="text-[10px] text-gray-400">{c.phone || ''}</p></div>
                        <span className="text-xs font-black text-amber-700">{formatCurrency(c.balance)}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
            <Section title="قائمة العملاء" icon={FileText}>
              <div className="space-y-2">
                {(customers || []).slice(0, 8).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div><p className="text-xs font-bold">{c.name}</p><p className="text-[10px] text-gray-400">{c.phone || '—'}</p></div>
                    <span className="text-xs font-black">{formatCurrency(c.balance || 0)}</span>
                  </div>
                ))}
                {(!customers || customers.length === 0) && <p className="text-xs text-gray-400 text-center py-4">لا يوجد عملاء</p>}
              </div>
            </Section>
            <Section title="رؤى وتحليلات" icon={Zap}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InsightCard icon={Users} label="إجمالي العملاء" value={totalCustomersCount.toLocaleString()} note="عميل مسجل" color="text-purple-600" bg="bg-purple-50" />
                <InsightCard icon={DollarSign} label="متوسط المبيعات لكل عميل" value={totalCustomersCount > 0 ? formatCurrency(totalRevenue / totalCustomersCount) : '0'} note="للعميل" color="text-blue-600" bg="bg-blue-50" />
              </div>
            </Section>
            <Section title="تصدير التقرير"><ExportBar /></Section>
          </motion.div>
        );

      case 'delivered_orders':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="فواتير مسلمة" value={deliveredOrdersCount.toLocaleString()} icon={Receipt} />
              <StatCard label="إجمالي الإيرادات" value={formatCurrency(totalRevenue)} icon={DollarSign} />
              <StatCard label="متوسط الفاتورة" value={formatCurrency(avgOrderValue)} icon={BarChart3} />
              <StatCard label="الضرائب المحصلة" value={formatCurrency(totalTaxCollected)} icon={Percent} />
            </div>
            <Section title="اتجاه التوصيل" icon={TrendingUp}>
              <div className="min-h-[256px] h-64" style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="مبيعات" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="أفضل العملاء" icon={Users}>
              <div className="space-y-2">
                {topCustomersBySales.length > 0 ? topCustomersBySales.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2"><span className="w-5 h-5 bg-black text-white rounded-md flex items-center justify-center text-[10px] font-bold">{i + 1}</span><span className="text-xs font-bold">{c.name}</span></div>
                    <span className="text-xs font-black">{formatCurrency(c.amount)}</span>
                  </div>
                )) : <p className="text-xs text-gray-400 text-center py-4">لا تبيانات</p>}
              </div>
            </Section>
            <Section title="تصدير التقرير"><ExportBar /></Section>
          </motion.div>
        );

      case 'top_selling':
        const totalTopRevenue = topSellingProducts?.reduce((s, p) => s + p.revenue, 0) || 0;
        const totalTopQty = topSellingProducts?.reduce((s, p) => s + p.quantity, 0) || 0;
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="المنتجات الأكثر مبيعاً" value={String(topSellingProducts?.length || 0)} icon={ShoppingCart} />
              <StatCard label="إجمالي الإيرادات" value={formatCurrency(totalTopRevenue)} icon={DollarSign} />
              <StatCard label="إجمالي الكميات" value={String(totalTopQty)} icon={Package} />
              <StatCard label="نسبة من المبيعات" value={totalRevenue > 0 ? `${((totalTopRevenue / totalRevenue) * 100).toFixed(1)}%` : '0%'} icon={Percent} />
            </div>
            {topSellingProducts && topSellingProducts.length > 0 && (
              <Section title="تصنيف المنتجات" icon={Target}>
                <div className="space-y-2">
                  {topSellingProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-xs">{i + 1}</div>
                        <div><p className="text-xs font-bold">{p.name}</p><p className="text-[10px] text-gray-400">باع {p.quantity} وحدة</p></div>
                      </div>
                      <span className="text-xs font-black">{formatCurrency(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
            <Section title="تحليل المبيعات" icon={BarChart3}>
              <div className="min-h-[256px] h-64" style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="مبيعات" fill="#0A0A0B" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="تصدير التقرير"><ExportBar /></Section>
          </motion.div>
        );

      default:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Section title={content.title} icon={BarChart3}>
              <p className="text-[11px] font-bold text-[var(--text-tertiary)]">{content.subtitle}</p>
            </Section>
            <div className="bg-white rounded-xl border border-[var(--border-light)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[var(--border-light)]">
                      {content.headers.map((h, i) => (<th key={i} className="px-5 py-3.5 text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{h}</th>))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {content.rows.length > 0 ? content.rows.map((row, ri) => (
                      <motion.tr key={row.id ?? ri} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ri * 0.015 }} className="hover:bg-gray-50/50 transition-colors">
                        {Object.entries(row).filter(([k]) => k !== 'id' && k !== 'raw_search').map(([_k, val], ci) => (
                          <td key={ci} className="px-5 py-3.5 text-xs font-medium text-[var(--text-primary)]">{String(val ?? '')}</td>
                        ))}
                      </motion.tr>
                    )) : (
                      <tr><td colSpan={content.headers.length} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400"><Search className="w-8 h-8 opacity-30" /><span className="text-xs font-bold">لا توجد بيانات مطابقة</span></div>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <Section title="تصدير التقرير"><ExportBar /></Section>
          </motion.div>
        );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }} transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-[var(--shadow-modal)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[var(--border-light)] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-sm"><BarChart3 className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)]">{content.title}</h2>
              <p className="text-[11px] text-[var(--text-tertiary)] font-bold">{content.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-premium w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {renderPanel()}
        </div>
      </motion.div>
    </motion.div>
  );
}

// �����������������������������������������������������������
//  MAIN REPORTS PAGE
// �����������������������������������������������������������
export default function Reports({ setActivePage }: { setActivePage: (page: string) => void }) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'audit'>('analytics');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // �� Backend Analytics (React Query) ��
  const summaryQuery = useAnalyticsSummary();
  const profitQuery = useProfitDetails();
  const salesQuery = useSalesDetails();
  const inventoryQuery = useInventoryAnalytics();
  const expensesQuery = useExpensesDetails();

  // �� Backend Data — replaces Dexie ��
  const inventoryReportsQuery = useInventoryReports();
  const customerBalancesQuery = useCustomerBalances();
  const items = inventoryReportsQuery.data?.tables?.items ?? [];
  const inventoryTransactions = inventoryReportsQuery.data?.tables?.transactions ?? [];
  const customers = customerBalancesQuery.data?.data ?? [];

  // �� Computed from API ��
  const s = summaryQuery.data?.summary;
  const totalRevenue = s?.totalSales ?? 0;
  const totalExpenses = s?.totalExpenses ?? 0;
  const netProfit = s?.netProfit ?? 0;
  const profitVal = s?.profit ?? 0;
  const lossVal = s?.loss ?? 0;
  const inventoryTotalValue = s?.inventoryValue ?? 0;
  const totalCustomersCount = s?.totalCustomers ?? 0;
  const deliveredOrdersCount = s?.totalOrders ?? 0;
  const totalItemsCount = inventoryQuery.data?.summary?.totalItems ?? 0;

  const profitSummary = profitQuery.data?.summary;
  const totalCostOfGoodsSold = profitSummary?.totalCost ?? 0;
  const grossProfit = totalRevenue - totalCostOfGoodsSold;

  const totalTaxCollected = profitQuery.data?.summary?.totalTaxCollected ?? 0;

  // �� Monthly Chart Data from API ��
  const monthlyData = useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const trends = profitQuery.data?.charts?.trends ?? [];
    const cMonth = new Date().getMonth();
    return Array.from({ length: 6 }, (_, i) => {
      const mIdx = (cMonth - 5 + i + 12) % 12;
      const t = trends[i] ?? { revenue: 0, cost: 0, profit: 0 };
      return { month: months[mIdx], مبيعات: t.revenue, صافي_الربح: t.profit, مصاريف: t.cost };
    });
  }, [profitQuery.data]);

  // �� Distribution Data (category-based) from API ��
  const distributionData = useMemo(() => {
    const catDist = inventoryQuery.data?.charts?.categoryDistribution ?? [];
    return catDist.slice(0, 4).map(d => ({ name: d.category, value: d.value }));
  }, [inventoryQuery.data]);

  // �� Top Selling from API ��
  const topSellingProducts = useMemo(() => {
    const topItems = salesQuery.data?.charts?.topItems ?? [];
    return topItems.slice(0, 5).map(i => ({ name: i.name, quantity: i.totalQuantity, revenue: i.totalRevenue }));
  }, [salesQuery.data]);

  // �� Modal Content ��
  const modalContent = useMemo((): ModalContent | null => {
    if (!selectedMetric) return null;
    let title = '', subtitle = '', headers: string[] = [], rows: StatRow[] = [];
    console.log('SELECTED METRIC', selectedMetric);
    switch (selectedMetric) {
      case 'sales':
        title = 'تفاصيل إجمالي المبيعات'; subtitle = 'جميع المبيعات المكتملة والنشطة';
        headers = ['رقم الفاتورة', 'العميل', 'التاريخ', 'الحالة', 'المبلغ'];
        rows = (salesQuery.data?.tables?.orders ?? []).map((o: any) => ({
          id: o.id, number: o.orderNumber, customer: o.customer,
          date: formatDate(o.date), status: o.status === 'delivered' ? 'مستلم' : 'مشحون', amount: formatCurrency(o.totalAmount),
          raw_search: `${o.orderNumber} ${o.customer}`,
        }));
        break;
      case 'delivered_orders':
        title = 'تفاصيل الفواتير المسلمة'; subtitle = 'الفواتير التي تم تسليمها بالكامل';
        headers = ['رقم الفاتورة', 'العميل', 'التاريخ', 'الحالة', 'المبلغ'];
        rows = (salesQuery.data?.tables?.orders ?? [])
          .filter((o: any) => o.status === 'delivered')
          .map((o: any) => ({
            id: o.id, number: o.orderNumber, customer: o.customer,
            date: formatDate(o.date), status: 'مستلم', amount: formatCurrency(o.totalAmount),
            raw_search: `${o.orderNumber} ${o.customer}`,
          }));
        break;
      case 'tax':
        title = 'تفاصيل الضرائب المحصلة'; subtitle = 'ضريبة القيمة المضافة على الفواتير';
        headers = ['رقم الفاتورة', 'العميل', 'التاريخ', 'قبل الضريبة', 'الضريبة', 'الإجمالي'];
        rows = (salesQuery.data?.tables?.orders ?? []).map((o: any) => ({
          id: o.id, number: o.orderNumber, customer: o.customer,
          date: formatDate(o.date), subtotal: formatCurrency((o.totalAmount || 0) / 1.14),
          tax: formatCurrency((o.totalAmount || 0) * 0.14 / 1.14), total: formatCurrency(o.totalAmount || 0),
          raw_search: `${o.orderNumber} ${o.customer}`,
        }));
        break;
      case 'expenses':
        title = 'بيان المصروفات التشغيلية'; subtitle = 'جميع المصاريف باستثناء المشتريات وتكلفة البضاعة';
        headers = ['التاريخ', 'البند', 'المبلغ', 'الوصف'];
        rows = (expensesQuery.data?.tables?.transactions ?? []).map((t: any) => ({
          id: t.id, date: formatDate(t.date), name: t.category || t.description,
          amount: formatCurrency(t.amount || 0), description: t.description || '-',
          raw_search: `${t.category} ${t.description}`,
        }));
        break;
      case 'inventory':
        title = 'قيمة المخزون الحالي'; subtitle = 'محسوب بسعر الشراء الأصلي';
        headers = ['الصنف', 'الكمية', 'سعر الشراء', 'القيمة', 'الموقع'];
        rows = items?.map((i: any) => ({
          id: i.id, name: i.name, quantity: i.quantity, price: formatCurrency(i.purchasePrice || 0),
          total: formatCurrency((i.purchasePrice || 0) * (i.quantity || 0)), location: i.location,
          raw_search: `${i.name} ${i.sku} ${i.location}`,
        })) || [];
        break;
      case 'customers':
        title = 'قائمة العملاء'; subtitle = 'جميع العملاء المسجلين في النظام';
        headers = ['الاسم', 'الهاتف', 'العنوان', 'الرصيد'];
        rows = customers?.map((c: any) => ({
          id: c.id, name: c.name, phone: c.phone, address: c.address, date: formatCurrency(c.balance || 0),
          raw_search: `${c.name} ${c.phone} ${c.address}`,
        })) || [];
        break;
      case 'top_selling':
        title = 'المنتجات الأكثر مبيعاً'; subtitle = 'تحليل أداء المنتجات حسب الكمية المباعة';
        headers = ['الترتيب', 'الصنف', 'الكمية المباعة', 'الإيرادات'];
        break;
      case 'gross_profit': case 'net_profit':
        title = selectedMetric === 'gross_profit' ? 'تحليل مجمل الربح' : 'تحليل صافي الربح';
        subtitle = selectedMetric === 'gross_profit' ? 'الإيرادات ناقص تكلفة البضاعة المباعة' : 'الربح النهائي بعد المصروفات التشغيلية';
        headers = ['البند', 'القيمة', 'ملاحظة'];
        rows = [
          { id: 1, label: 'إجمالي الإيرادات', value: formatCurrency(totalRevenue), note: 'من الفواتير المسلمة', raw_search: 'revenue' },
          { id: 2, label: 'تكلفة البضاعة المباعة (COGS)', value: `(${formatCurrency(totalCostOfGoodsSold || 0)})`, note: 'تكلفة شراء الأصناف المباعة', raw_search: 'cogs' },
          { id: 3, label: 'مجمل الربح', value: formatCurrency(grossProfit), note: 'المبيعات - التكلفة', raw_search: 'gross' },
        ];
        if (selectedMetric === 'net_profit') rows.push(
          { id: 4, label: 'إجمالي المصروفات', value: `(${formatCurrency(totalExpenses)})`, note: 'مصاريف تشغيلية', raw_search: 'expenses' },
          { id: 5, label: netProfit >= 0 ? 'صافي الربح' : 'صافي الخسارة', value: formatCurrency(netProfit), note: 'الرقم النهائي', raw_search: 'net' },
        );
        break;
    }
    if (selectedMetric === 'top_selling' && topSellingProducts) {
      rows = topSellingProducts.map((p, idx) => ({
        id: p.name, rank: idx + 1, name: p.name, qty: p.quantity, rev: formatCurrency(p.revenue), raw_search: p.name,
      }));
    }
    const filteredRows = rows.filter(r => !searchTerm || Object.values(r).some(v => String(v ?? '').toLowerCase().includes(searchTerm.toLowerCase())));
    console.log('🔵 modalContent RESULT:', { title, subtitle, headers: headers.join('|'), rowsLen: filteredRows.length });
    return { title, subtitle, headers, rows: filteredRows };
  }, [selectedMetric, salesQuery.data, expensesQuery.data, customers, items, searchTerm, totalRevenue, totalCostOfGoodsSold, totalExpenses, grossProfit, netProfit, topSellingProducts, profitQuery.data, inventoryQuery.data]);

  // �� KPI Card Definitions ��
  const netLabel = profitVal > 0 ? 'صافي الأرباح' : lossVal > 0 ? 'إجمالي الخسائر' : 'صافي الربح/الخسارة';
  const netValue = profitVal > 0 ? profitVal : lossVal > 0 ? lossVal : 0;
  const netIcon = profitVal > 0 ? CheckCircle2 : lossVal > 0 ? TrendingDown : Minus;
  const netGradient = profitVal > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : lossVal > 0 ? 'bg-gradient-to-r from-red-500 to-rose-400' : 'bg-gradient-to-r from-gray-500 to-gray-400';
  const netIconBg = profitVal > 0 ? 'bg-green-500' : lossVal > 0 ? 'bg-red-500' : 'bg-gray-500';
  const netTrendDir = profitVal > 0 ? 'up' : lossVal > 0 ? 'down' : 'neutral';
  const netTrendLabel = profitVal > 0 ? 'ربح' : lossVal > 0 ? 'خسارة' : '�';

  const kpiCards: KPICardData[] = [
    {
      label: 'إجمالي المبيعات', value: formatCurrency(totalRevenue || 0), icon: TrendingUp,
      gradient: 'bg-gradient-to-r from-black to-gray-700', iconBg: 'bg-black',
      trend: { direction: 'up', value: 'إيرادات', color: 'text-green-600' },
      type: 'sales', rawValue: totalRevenue,
    },
    {
      label: 'مجمل الربح', value: formatCurrency(grossProfit || 0), icon: BarChart3,
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-400', iconBg: 'bg-blue-500',
      trend: { direction: grossProfit >= 0 ? 'up' : 'down', value: grossProfit >= 0 ? 'إيجابي' : 'سلبي', color: grossProfit >= 0 ? 'text-green-600' : 'text-red-500' },
      type: 'gross_profit', rawValue: grossProfit,
    },
    {
      label: netLabel, value: formatCurrency(netValue), icon: netIcon,
      gradient: netGradient, iconBg: netIconBg,
      trend: { direction: netTrendDir, value: netTrendLabel, color: profitVal > 0 ? 'text-green-600' : lossVal > 0 ? 'text-red-500' : 'text-gray-500' },
      type: 'net_profit', rawValue: netProfit,
    },
    {
      label: 'الضرائب المحصلة', value: formatCurrency(totalTaxCollected), icon: Percent,
      gradient: 'bg-gradient-to-r from-purple-500 to-violet-400', iconBg: 'bg-purple-500',
      trend: { direction: 'neutral', value: 'VAT', color: 'text-gray-500' },
      type: 'tax', rawValue: totalTaxCollected,
    },
    {
      label: 'رأس مال المخزون', value: formatCurrency(inventoryTotalValue || 0), icon: Package,
      gradient: 'bg-gradient-to-r from-orange-500 to-amber-400', iconBg: 'bg-orange-500',
      trend: { direction: 'neutral', value: `${totalItemsCount} صنف`, color: 'text-gray-500' },
      type: 'inventory', rawValue: inventoryTotalValue,
    },
    {
      label: 'إجمالي المصاريف', value: formatCurrency(totalExpenses || 0), icon: Wallet,
      gradient: 'bg-gradient-to-r from-red-500 to-rose-400', iconBg: 'bg-red-500',
      trend: { direction: totalExpenses > 0 ? 'down' : 'neutral', value: 'مصاريف', color: 'text-red-500' },
      type: 'expenses', rawValue: totalExpenses,
    },
    {
      label: 'فواتير مسلمة', value: deliveredOrdersCount.toLocaleString(), icon: Receipt,
      gradient: 'bg-gradient-to-r from-emerald-500 to-green-400', iconBg: 'bg-emerald-500',
      trend: { direction: 'up', value: 'فاتورة', color: 'text-green-600' },
      type: 'delivered_orders', rawValue: deliveredOrdersCount,
    },
    {
      label: 'العملاء', value: totalCustomersCount.toLocaleString(), icon: Users,
      gradient: 'bg-gradient-to-r from-indigo-500 to-purple-400', iconBg: 'bg-indigo-500',
      trend: { direction: 'neutral', value: 'عميل مسجل', color: 'text-gray-500' },
      type: 'customers', rawValue: totalCustomersCount,
    },
  ];

  // �� Loading State ��
  const isLoading = summaryQuery.isLoading || profitQuery.isLoading || salesQuery.isLoading || inventoryQuery.isLoading;
  const isError = summaryQuery.isError || profitQuery.isError || salesQuery.isError || inventoryQuery.isError;

  return (
    <ReportErrorBoundary>
    
    <WorkspaceLayout maxWidth="xl">
      <WorkspaceLayout.Header
        icon={BarChart3}
        title="التقارير والإحصائيات"
        subtitle="تحليل متقدم لأداء المخازن والحركة المالية — لوحة تحليلات شاملة"
        actions={
          <div className="flex gap-2">
            <button onClick={() => { const b = new Blob([`تقرير\n${new Date().toLocaleString('ar-EG')}\nالمبيعات: ${totalRevenue}`], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `report_${Date.now()}.txt`; a.click(); URL.revokeObjectURL(u); }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[var(--border-light)] rounded-xl text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm">
              <Download className="w-3.5 h-3.5" /> تصدير
            </button>
            <button onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-black text-white rounded-xl text-[11px] font-bold hover:opacity-90 transition-all shadow-sm">
              <RefreshCw className="w-3.5 h-3.5" /> تحديث
            </button>
          </div>
        }
      />

      <Tabs
        tabs={[
          { id: 'analytics', label: 'التحليل البياني' },
          { id: 'audit', label: 'سجل حركات المخزون' },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'analytics' | 'audit')}
        variant="underline"
      />

      {activeTab === 'analytics' ? (
        <>
          {/* Financial Explanation Banner */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50/80 to-white border border-blue-100/60 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div className="text-[12px] text-gray-600 leading-relaxed space-y-1">
                <p className="font-bold text-gray-800 mb-1">توضيح محاسبي والدورة المالية</p>
                <p><strong>مجمل الربح:</strong> إجمالي المبيعات - تكلفة البضاعة المباعة (COGS).</p>
                <p><strong>صافي الربح:</strong> مجمل الربح - المصروفات التشغيلية.</p>
                <p><strong>قيمة المخزون:</strong> أصول متداولة (رأس مال عامل) بسعر الشراء للأصناف المتوفرة.</p>
              </div>
            </div>
          </motion.div>

          {/* �� KPI Cards Grid �� */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-[var(--border-light)] p-5 space-y-3">
                  <SkeletonBlock className="w-10 h-10 rounded-xl" />
                  <SkeletonBlock className="h-3 w-20" />
                  <SkeletonBlock className="h-8 w-32" />
                  <SkeletonBlock className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-lg font-black text-gray-900 mb-2">فشل تحميل البيانات</h3>
              <p className="text-sm text-gray-500 mb-4">تعذر الاتصال بالخادم. يرجى التحقق من اتصالك والمحاولة مرة أخرى.</p>
              <button onClick={() => window.location.reload()}
                className="px-6 py-2 bg-black text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all">
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpiCards.map((stat, i) => (
                <KPICard key={i} stat={stat} index={i} onClick={() => { console.log('CARD CLICK', stat.type); setSearchTerm(''); setSelectedMetric(stat.type); }} />
              ))}
            </div>
          )}

          {/* �� Charts Section �� */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-black text-[var(--text-primary)]">تحليل الأداء المالي (آخر 6 أشهر)</h3>
                <div className="flex gap-4 text-[10px] font-bold text-gray-500">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-black rounded-sm" /> صافي الربح</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" /> مبيعات</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-400 rounded-sm" /> مصاريف</div>
                </div>
              </div>
              <div className="min-h-[288px] h-72" style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="صافي_الربح" fill="#0A0A0B" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="مبيعات" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="مصاريف" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Top Selling */}
              <div className="bg-white rounded-2xl border border-[var(--border-light)] p-5 shadow-[var(--shadow-card)]">
                <button onClick={() => { setSearchTerm(''); setSelectedMetric('top_selling'); }}
                  className="flex items-center justify-between w-full mb-4 group">
                  <h3 className="text-sm font-black text-[var(--text-primary)]">الأكثر مبيعاً</h3>
                  <div className="text-[10px] font-bold text-gray-400 group-hover:text-black transition-colors flex items-center gap-1">
                    تفاصيل <ArrowLeft className="w-3 h-3" />
                  </div>
                </button>
                <div className="space-y-2">
                  {topSellingProducts?.map((p, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-black text-xs shadow-sm">{i + 1}</div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{p.name}</p>
                          <p className="text-[10px] text-gray-400">{p.quantity} وحدة</p>
                        </div>
                      </div>
                      <p className="text-xs font-black">{formatCurrency(p.revenue)}</p>
                    </motion.div>
                  ))}
                  {(!topSellingProducts || !topSellingProducts.length) && (
                    <p className="text-center text-xs text-gray-400 py-6 font-bold">لا توجد مبيعات مسجلة</p>
                  )}
                </div>
              </div>

              {/* Distribution */}
              <div className="bg-white rounded-2xl border border-[var(--border-light)] p-5 shadow-[var(--shadow-card)]">
                <h3 className="text-sm font-black text-[var(--text-primary)] mb-4">توزيع المخزون (قيمة)</h3>
                <div className="min-h-[176px] h-44" style={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <RePieChart>
                      <RePie
                        data={distributionData.length > 0 ? distributionData : [{ name: 'لا توجد', value: 1 }]}
                        innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value"
                      >
                        {distributionData.map((_e, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </RePie>
                      <Tooltip content={<PieTooltip />} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1.5">
                  {distributionData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="font-bold text-gray-600">{d.name}</span>
                      </div>
                      <span className="font-bold">{formatCurrency(d.value)}</span>
                    </div>
                  ))}
                  {distributionData.length === 0 && (
                    <p className="text-center text-[10px] text-gray-400 py-4 font-bold">لا توجد بيانات مخزون متاحة</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* �� Audit Log Tab �� */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-[var(--border-light)] overflow-hidden shadow-[var(--shadow-card)]"
        >
          <div className="px-5 py-4 border-b border-[var(--border-light)] flex items-center gap-2 bg-gray-50/50">
            <History className="w-4 h-4 text-gray-700" />
            <span className="text-xs font-bold text-gray-700">سجل حركات المخزون</span>
            <span className="mr-auto text-[10px] text-gray-400 font-bold">
              {inventoryTransactions?.length || 0} حركة
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[var(--border-light)]">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-[var(--text-tertiary)]">التاريخ</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-[var(--text-tertiary)]">الصنف</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-[var(--text-tertiary)]">العملية</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-[var(--text-tertiary)]">التغير</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-[var(--text-tertiary)]">السبب</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-[var(--text-tertiary)]">المستخدم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {inventoryTransactions?.map((t: any) => {
                  return (
    
                    <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-xs font-medium">{formatDate(t.timestamp)}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-bold">{t.itemName || 'صنف محذوف'}</p>
                        <p className="text-[10px] text-gray-400">{t.itemSku}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border',
                          t.type === 'increase' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200',
                        )}>
                          {t.type === 'increase' ? 'زيادة' : 'نقص'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span>{t.oldQuantity}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span>{t.newQuantity}</span>
                          <span className={cn('text-[10px]', t.type === 'increase' ? 'text-green-500' : 'text-red-500')}>
                            ({t.type === 'increase' ? '+' : '-'}{t.diff})
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-600">{t.reason}</span>
                        {t.source && <span className="block text-[10px] text-blue-500 mt-0.5">المصدر: {t.source}</span>}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold">{t.userId || '-'}</td>
                    </motion.tr>
                  );
                })}
                {(!inventoryTransactions || !inventoryTransactions.length) && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-xs font-bold">لا توجد حركات مخزون مسجلة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* �� Analytics Modal �� */}
      <AnimatePresence>
        {selectedMetric && modalContent && (
          <AnalyticsModal
            metric={selectedMetric}
            content={modalContent}
            onClose={() => { setSelectedMetric(null); setSearchTerm(''); }}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            monthlyData={monthlyData || []}
            distributionData={distributionData}
            topSellingProducts={topSellingProducts}
            validSales={[]}
            items={items}
            totalRevenue={totalRevenue}
            grossProfit={grossProfit}
            netProfit={netProfit}
            totalExpenses={totalExpenses}
            totalCostOfGoodsSold={totalCostOfGoodsSold}
            totalTaxCollected={totalTaxCollected}
            inventoryTotalValue={inventoryTotalValue}
            totalCustomersCount={totalCustomersCount}
            deliveredOrdersCount={deliveredOrdersCount}
            totalItemsCount={totalItemsCount}
            customers={customers}
            warehouses={[]}
            expensesQuery={expensesQuery}
            salesQuery={salesQuery}
          />
        )}
      </AnimatePresence>
    </WorkspaceLayout>
    </ReportErrorBoundary>
    
  );
}
