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

// ─── Types ───────────────────────────────────────────────
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

// ─── Color palette ───────────────────────────────────────
const CHART_COLORS = ['#0A0A0B', '#2563EB', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899', '#14B8A6'];
const GRADIENT_CHART = { offset: '0%', color: '#0A0A0B', opacity: 0.2 };
const GRADIENT_CHART_END = { offset: '100%', color: '#0A0A0B', opacity: 0.02 };

// ─── Error Boundary ──────────────────────────────────────
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

// ─── Skeleton loader ─────────────────────────────────────
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton-pulse', className)} />;
}

// ─── Animated counter ────────────────────────────────────
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

// ─── Premium KPI Card ────────────────────────────────────
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

// ─── KPI Mini Sparkline ──────────────────────────────────
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

// ─── Custom Chart Tooltip ────────────────────────────────
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

// ─── Custom Pie Tooltip ──────────────────────────────────
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

// ─── Modal Section Wrapper ───────────────────────────────
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

// ─── Premium Analytics Modal ─────────────────────────────
function AnalyticsModal({
  metric, content, onClose, searchTerm, onSearchChange, monthlyData, distributionData,
  topSellingProducts, validSales, items, totalRevenue, grossProfit, netProfit, totalExpenses,
  totalCostOfGoodsSold, totalTaxCollected, inventoryTotalValue, totalCustomersCount,
  deliveredOrdersCount, customers, warehouses,
}: {
  metric: MetricType; content: ModalContent; onClose: () => void;
  searchTerm: string; onSearchChange: (v: string) => void;
  monthlyData: any[]; distributionData: { name: string; value: number }[];
  topSellingProducts: { name: string; quantity: number; revenue: number }[] | undefined;
  validSales: any[]; items: any[] | undefined;
  totalRevenue: number; grossProfit: number; netProfit: number; totalExpenses: number;
  totalCostOfGoodsSold: number; totalTaxCollected: number; inventoryTotalValue: number;
  totalCustomersCount: number; deliveredOrdersCount: number;
  customers: any[] | undefined; warehouses: any[] | undefined;
  expenseTransactions?: any[];
  expenseCategoryBreakdown?: { category: string; totalAmount: number; count: number; percentage: number }[];
}) {
  const [modalTab, setModalTab] = useState<'overview' | 'chart' | 'table' | 'insights'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'نظرة عامة', icon: Activity },
    { id: 'chart' as const, label: 'تحليل بياني', icon: BarChart3 },
    { id: 'table' as const, label: 'جدول تفصيلي', icon: FileText },
    { id: 'insights' as const, label: 'رؤى ذكية', icon: Zap },
  ];

  const handleExport = useCallback((type: 'pdf' | 'excel') => {
    const txt = `${content.title}\nالتاريخ: ${new Date().toLocaleString('ar-EG')}\n` +
      `إجمالي المبيعات: ${totalRevenue} ج.م\nقيمة المخزون: ${inventoryTotalValue} ج.م\n`;
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report_${Date.now()}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
    a.click(); URL.revokeObjectURL(url);
  }, [content.title, totalRevenue, inventoryTotalValue]);

  // ── Metric-specific Overview Renderer ──
  function renderMetricOverview() {
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const expenseRate = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
    const avgPerCustomer = totalCustomersCount > 0 ? totalRevenue / totalCustomersCount : 0;
    const avgOrderValue = deliveredOrdersCount > 0 ? totalRevenue / deliveredOrdersCount : 0;

    const KpiCard = ({ label, value, icon: Icon, gradient }: { label: string; value: string; icon: any; gradient: string }) => (
      <div className="relative rounded-xl border border-[var(--border-light)] bg-gradient-to-br from-white to-gray-50/50 p-4 overflow-hidden">
        <div className={cn('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r', gradient)} />
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-gray-600" />
          </div>
          <p className="text-[10px] font-bold text-[var(--text-tertiary)]">{label}</p>
        </div>
        <p className="text-lg font-black">{value}</p>
      </div>
    );

    const cardGrid = (cards: { label: string; value: string; icon: any; gradient: string }[]) => (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
      </div>
    );

    switch (metric) {
      case 'sales':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {cardGrid([
              { label: 'إجمالي الإيرادات', value: formatCurrency(totalRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
              { label: 'الفواتير المسلمة', value: deliveredOrdersCount.toLocaleString(), icon: Receipt, gradient: 'from-emerald-500/10 to-transparent' },
              { label: 'مجمل الربح', value: formatCurrency(grossProfit), icon: TrendingUp, gradient: 'from-blue-500/10 to-transparent' },
              { label: 'الضرائب المحصلة', value: formatCurrency(totalTaxCollected), icon: Percent, gradient: 'from-purple-500/10 to-transparent' },
            ])}
            <ModalSection title="اتجاه المبيعات الشهري" icon={ChartLine}>
              <div className="min-h-[256px] h-64" style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="gSalesOv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0A0A0B" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0A0A0B" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="مبيعات" stroke="#0A0A0B" strokeWidth={2} fill="url(#gSalesOv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ModalSection>
          </motion.div>
        );

      case 'gross_profit':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {cardGrid([
              { label: 'إجمالي الإيرادات', value: formatCurrency(totalRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
              { label: 'تكلفة البضاعة المباعة', value: formatCurrency(totalCostOfGoodsSold || 0), icon: Wallet, gradient: 'from-red-500/10 to-transparent' },
              { label: 'مجمل الربح', value: formatCurrency(grossProfit), icon: TrendingUp, gradient: 'from-blue-500/10 to-transparent' },
              { label: 'هامش الربح الإجمالي', value: `${grossMargin.toFixed(1)}%`, icon: Percent, gradient: 'from-green-500/10 to-transparent' },
            ])}
            <ModalSection title="مقارنة الإيرادات والتكلفة" icon={BarChart3}>
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
            </ModalSection>
          </motion.div>
        );

      case 'net_profit':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {cardGrid([
              { label: 'إجمالي الإيرادات', value: formatCurrency(totalRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
              { label: 'مجمل الربح', value: formatCurrency(grossProfit), icon: TrendingUp, gradient: 'from-blue-500/10 to-transparent' },
              { label: 'إجمالي المصاريف', value: formatCurrency(totalExpenses), icon: Wallet, gradient: 'from-red-500/10 to-transparent' },
              { label: 'صافي الربح', value: formatCurrency(netProfit), icon: CheckCircle2, gradient: 'from-green-500/10 to-transparent' },
            ])}
            <ModalSection title="تحليل الربحية الشهري" icon={TrendingUp}>
              <div className="min-h-[256px] h-64" style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="gNetProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0A0A0B" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0A0A0B" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="gNetProfitSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="صافي_الربح" stroke="#0A0A0B" strokeWidth={2} fill="url(#gNetProfit)" />
                    <Area type="monotone" dataKey="مبيعات" stroke="#2563EB" strokeWidth={2} fill="url(#gNetProfitSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ModalSection>
          </motion.div>
        );

      case 'tax':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {cardGrid([
              { label: 'الضرائب المحصلة', value: formatCurrency(totalTaxCollected), icon: Percent, gradient: 'from-purple-500/10 to-transparent' },
              { label: 'عدد الفواتير', value: deliveredOrdersCount.toLocaleString(), icon: Receipt, gradient: 'from-emerald-500/10 to-transparent' },
              { label: 'إجمالي المبيعات', value: formatCurrency(totalRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
              { label: 'متوسط الضريبة لكل فاتورة', value: deliveredOrdersCount > 0 ? formatCurrency(totalTaxCollected / deliveredOrdersCount) : formatCurrency(0), icon: BarChart3, gradient: 'from-blue-500/10 to-transparent' },
            ])}
            <ModalSection title="ملخص تحصيل الضرائب" icon={Landmark}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-[11px] font-bold text-gray-500 mb-1">إجمالي المبيعات الخاضعة للضريبة</p>
                  <p className="text-xl font-black">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-[11px] font-bold text-gray-500 mb-1">نسبة الضريبة</p>
                  <p className="text-xl font-black">{totalRevenue > 0 ? `${((totalTaxCollected / totalRevenue) * 100).toFixed(2)}%` : '0%'}</p>
                </div>
              </div>
            </ModalSection>
          </motion.div>
        );

      case 'inventory':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {cardGrid([
              { label: 'قيمة المخزون', value: formatCurrency(inventoryTotalValue), icon: DollarSign, gradient: 'from-orange-500/10 to-transparent' },
              { label: 'إجمالي الأصناف', value: String(items?.length || 0), icon: Package, gradient: 'from-blue-500/10 to-transparent' },
              { label: 'إجمالي العملاء', value: totalCustomersCount.toLocaleString(), icon: Users, gradient: 'from-indigo-500/10 to-transparent' },
              { label: 'الضرائب المحصلة', value: formatCurrency(totalTaxCollected), icon: Percent, gradient: 'from-purple-500/10 to-transparent' },
            ])}
            <ModalSection title="توزيع المخزون حسب الفئة" icon={PieChart}>
              <div className="min-h-[256px] h-64 flex items-center justify-center" style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <RePieChart>
                    <RePie data={distributionData.length > 0 ? distributionData : [{ name: 'لا توجد بيانات', value: 1 }]}
                      innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {distributionData.map((_e, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </RePie>
                    <Tooltip content={<PieTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 flex-wrap justify-center">
                  {distributionData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </div>
            </ModalSection>
          </motion.div>
        );

      case 'expenses':
        const monthlyAvg = monthlyData.length > 0 ? monthlyData.reduce((s: number, m: any) => s + (m.مصاريف || 0), 0) / monthlyData.length : 0;
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {cardGrid([
              { label: 'إجمالي المصاريف', value: formatCurrency(totalExpenses), icon: Wallet, gradient: 'from-red-500/10 to-transparent' },
              { label: 'نسبة المصاريف', value: `${expenseRate.toFixed(1)}%`, icon: Percent, gradient: 'from-orange-500/10 to-transparent' },
              { label: 'متوسط شهري', value: formatCurrency(monthlyAvg), icon: Calendar, gradient: 'from-blue-500/10 to-transparent' },
              { label: 'صافي الربح', value: formatCurrency(netProfit), icon: CheckCircle2, gradient: 'from-green-500/10 to-transparent' },
            ])}
            <ModalSection title="اتجاه المصاريف الشهري" icon={TrendingUp}>
              <div className="min-h-[256px] h-64" style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="gExpensesOv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="مصاريف" stroke="#EF4444" strokeWidth={2} fill="url(#gExpensesOv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ModalSection>
          </motion.div>
        );

      case 'customers':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {cardGrid([
              { label: 'إجمالي العملاء', value: totalCustomersCount.toLocaleString(), icon: Users, gradient: 'from-indigo-500/10 to-transparent' },
              { label: 'إجمالي المبيعات', value: formatCurrency(totalRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
              { label: 'متوسط الشراء لكل عميل', value: formatCurrency(avgPerCustomer), icon: BarChart3, gradient: 'from-blue-500/10 to-transparent' },
              { label: 'الفواتير المسلمة', value: deliveredOrdersCount.toLocaleString(), icon: Receipt, gradient: 'from-emerald-500/10 to-transparent' },
            ])}
            <ModalSection title="قائمة العملاء" icon={Users}>
              <div className="space-y-2">
                {(customers || []).slice(0, 5).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-xs font-bold">{c.name}</p>
                      <p className="text-[10px] text-gray-400">{c.phone || '-'}</p>
                    </div>
                    <span className="text-xs font-black">{formatCurrency(c.balance || 0)}</span>
                  </div>
                ))}
                {(!customers || customers.length === 0) && (
                  <p className="text-center text-xs text-gray-400 py-4 font-bold">لا يوجد عملاء</p>
                )}
              </div>
            </ModalSection>
          </motion.div>
        );

      case 'delivered_orders':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {cardGrid([
              { label: 'فواتير مسلمة', value: deliveredOrdersCount.toLocaleString(), icon: Receipt, gradient: 'from-emerald-500/10 to-transparent' },
              { label: 'إجمالي الإيرادات', value: formatCurrency(totalRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
              { label: 'متوسط قيمة الفاتورة', value: formatCurrency(avgOrderValue), icon: BarChart3, gradient: 'from-blue-500/10 to-transparent' },
              { label: 'الضرائب المحصلة', value: formatCurrency(totalTaxCollected), icon: Percent, gradient: 'from-purple-500/10 to-transparent' },
            ])}
          </motion.div>
        );

      case 'top_selling':
        const totalTopRevenue = topSellingProducts?.reduce((s, p) => s + p.revenue, 0) || 0;
        const totalTopQty = topSellingProducts?.reduce((s, p) => s + p.quantity, 0) || 0;
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {cardGrid([
              { label: 'المنتجات الأكثر مبيعاً', value: String(topSellingProducts?.length || 0), icon: ShoppingCart, gradient: 'from-amber-500/10 to-transparent' },
              { label: 'إجمالي الإيرادات', value: formatCurrency(totalTopRevenue), icon: DollarSign, gradient: 'from-black/5 to-transparent' },
              { label: 'إجمالي الكميات المباعة', value: String(totalTopQty), icon: Package, gradient: 'from-blue-500/10 to-transparent' },
              { label: 'نسبة من إجمالي المبيعات', value: totalRevenue > 0 ? `${((totalTopRevenue / totalRevenue) * 100).toFixed(1)}%` : '0%', icon: Percent, gradient: 'from-purple-500/10 to-transparent' },
            ])}
            {topSellingProducts && topSellingProducts.length > 0 && (
              <ModalSection title="أكثر المنتجات مبيعاً" icon={Target}>
                <div className="space-y-2">
                  {topSellingProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-xs">{i + 1}</div>
                        <div>
                          <p className="text-xs font-bold">{p.name}</p>
                          <p className="text-[10px] text-gray-400">باع {p.quantity} وحدة</p>
                        </div>
                      </div>
                      <p className="text-xs font-black">{formatCurrency(p.revenue)}</p>
                    </div>
                  ))}
                </div>
              </ModalSection>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  }

  return (
    
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-[var(--shadow-modal)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[var(--border-light)] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-sm">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)]">{content.title}</h2>
              <p className="text-[11px] text-[var(--text-tertiary)] font-bold">{content.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleExport('pdf')} className="btn-premium px-3 py-2 text-[11px] bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={() => handleExport('excel')} className="btn-premium px-3 py-2 text-[11px] bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button onClick={() => handleExport('pdf')} className="btn-premium px-3 py-2 text-[11px] bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg">
              <Printer className="w-3.5 h-3.5" /> طباعة
            </button>
            <button onClick={onClose} className="btn-premium w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Tabs + Filter Bar ── */}
        <div className="sticky top-[73px] z-10 bg-white border-b border-[var(--border-light)] px-6 py-3 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-1 bg-gray-100/50 p-0.5 rounded-lg">
            {tabs.map(tab => {
              const TIcon = tab.icon;
              const isActive = modalTab === tab.id;
              return (
    
                <button key={tab.id} onClick={() => setModalTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-md transition-all',
                    isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  <TIcon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="بحث..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)}
              className="input-premium w-56 pr-9 pl-3 py-1.5 text-xs" />
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {modalTab === 'overview' && renderMetricOverview()}

          {modalTab === 'chart' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <ModalSection title="تحليل الإتجاه الشهري" icon={TrendingUp}>
                <div className="min-h-[288px] h-72" style={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0A0A0B" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#0A0A0B" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8A8D94' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="مبيعات" stroke="#0A0A0B" strokeWidth={2} fill="url(#gSales)" />
                      <Area type="monotone" dataKey="صافي_الربح" stroke="#2563EB" strokeWidth={2} fill="url(#gProfit)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ModalSection>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ModalSection title="توزيع المستودعات" icon={Layers}>
                    <div className="min-h-[224px] h-56" style={{ position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%" debounce={100}>
                      <RePieChart>
                        <RePie data={distributionData.length > 0 ? distributionData : [{ name: 'لا توجد', value: 1 }]}
                          innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                          {distributionData.map((_e, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </RePie>
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </ModalSection>

                <ModalSection title="مقارنة الأداء" icon={BarChart3}>
                  <div className="min-h-[224px] h-56" style={{ position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%" debounce={100}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8A8D94' }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="مبيعات" fill="#0A0A0B" radius={[3, 3, 0, 0]} maxBarSize={24} />
                        <Bar dataKey="مصاريف" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ModalSection>
              </div>
            </motion.div>
          )}

          {modalTab === 'table' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-white rounded-xl border border-[var(--border-light)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[var(--border-light)]">
                        {content.headers.map((h, i) => (
                          <th key={i} className="px-5 py-3.5 text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-light)]">
                      {content.rows.length > 0 ? content.rows.map((row, ri) => (
                        <motion.tr key={row.id ?? ri}
                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ri * 0.015 }}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          {Object.entries(row).filter(([k]) => k !== 'id' && k !== 'raw_search').map(([_k, val], ci) => (
                            <td key={ci} className="px-5 py-3.5 text-xs font-medium text-[var(--text-primary)]">{String(val ?? '')}</td>
                          ))}
                        </motion.tr>
                      )) : (
                        <tr><td colSpan={content.headers.length} className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <Search className="w-8 h-8 opacity-30" />
                            <span className="text-xs font-bold">لا توجد بيانات مطابقة</span>
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {modalTab === 'insights' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: DollarSign, label: 'إجمالي الإيرادات', value: formatCurrency(totalRevenue), note: 'من الفواتير المسلمة', color: 'text-black', bg: 'bg-black/5' },
                { icon: TrendingUp, label: 'مجمل الربح', value: formatCurrency(grossProfit), note: `الهامش ${totalRevenue ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: CheckCircle2, label: 'صافي الربح', value: formatCurrency(netProfit), note: netProfit >= 0 ? 'إيجابي' : 'سلبي', color: netProfit >= 0 ? 'text-green-600' : 'text-red-500', bg: netProfit >= 0 ? 'bg-green-50' : 'bg-red-50' },
                { icon: Wallet, label: 'إجمالي المصاريف', value: formatCurrency(totalExpenses), note: 'نسبة من الإيرادات', color: 'text-red-500', bg: 'bg-red-50' },
                { icon: Package, label: 'قيمة المخزون', value: formatCurrency(inventoryTotalValue), note: `${items?.length || 0} صنف`, color: 'text-orange-600', bg: 'bg-orange-50' },
                { icon: Users, label: 'إجمالي العملاء', value: totalCustomersCount.toLocaleString(), note: 'عميل مسجل', color: 'text-purple-600', bg: 'bg-purple-50' },
                { icon: Receipt, label: 'فواتير مسلمة', value: deliveredOrdersCount.toLocaleString(), note: 'فاتورة', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { icon: Percent, label: 'الضرائب المحصلة', value: formatCurrency(totalTaxCollected), note: 'VAT', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-light)] bg-white hover:border-gray-200 transition-colors"
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', item.bg)}>
                    <item.icon className={cn('w-5 h-5', item.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-[var(--text-tertiary)]">{item.label}</p>
                    <p className="text-base font-black text-[var(--text-primary)]">{item.value}</p>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-tertiary)]">{item.note}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-[var(--border-light)] px-6 py-3 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[var(--text-tertiary)] font-bold">
            إجمالي النتائج: {content.rows.length}
          </span>
          <button onClick={onClose} className="btn-premium px-5 py-2 bg-black text-white rounded-xl text-xs font-bold hover:opacity-90">
            إغلاق
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN REPORTS PAGE
// ═══════════════════════════════════════════════════════════
export default function Reports({ setActivePage }: { setActivePage: (page: string) => void }) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'audit'>('analytics');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Backend Analytics (React Query) ──
  const summaryQuery = useAnalyticsSummary();
  const profitQuery = useProfitDetails();
  const salesQuery = useSalesDetails();
  const inventoryQuery = useInventoryAnalytics();
  const expensesQuery = useExpensesDetails();

  // ── Backend Data — replaces Dexie ──
  const inventoryReportsQuery = useInventoryReports();
  const customerBalancesQuery = useCustomerBalances();
  const items = inventoryReportsQuery.data?.tables?.items ?? [];
  const inventoryTransactions = inventoryReportsQuery.data?.tables?.transactions ?? [];
  const customers = customerBalancesQuery.data?.data ?? [];
  const expenseTransactions = expensesQuery.data?.tables?.transactions ?? [];
  const expenseCategoryBreakdown = expensesQuery.data?.charts?.categoryBreakdown ?? [];

  // ── Computed from API ──
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

  console.log('[Reports Page] Inventory:', { inventoryCostValue: inventoryTotalValue, inventorySellingValue: s?.inventorySellingValue ?? 0, expectedProfit: (s?.inventorySellingValue ?? 0) - inventoryTotalValue });

  const profitSummary = profitQuery.data?.summary;
  const totalCostOfGoodsSold = profitSummary?.totalCost ?? 0;
  const grossProfit = totalRevenue - totalCostOfGoodsSold;

  const totalTaxCollected = profitQuery.data?.summary?.totalTaxCollected ?? 0;

  // ── Monthly Chart Data from API ──
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

  // ── Distribution Data (category-based) from API ──
  const distributionData = useMemo(() => {
    const catDist = inventoryQuery.data?.charts?.categoryDistribution ?? [];
    return catDist.slice(0, 4).map(d => ({ name: d.category, value: d.value }));
  }, [inventoryQuery.data]);

  // ── Top Selling from API ──
  const topSellingProducts = useMemo(() => {
    const topItems = salesQuery.data?.charts?.topItems ?? [];
    return topItems.slice(0, 5).map(i => ({ name: i.name, quantity: i.totalQuantity, revenue: i.totalRevenue }));
  }, [salesQuery.data]);

  // ── Modal Content ──
  const modalContent = useMemo((): ModalContent | null => {
    if (!selectedMetric) return null;
    let title = '', subtitle = '', headers: string[] = [], rows: StatRow[] = [];
    switch (selectedMetric) {
      case 'sales': case 'delivered_orders':
        title = selectedMetric === 'sales' ? 'تفاصيل إجمالي المبيعات' : 'تفاصيل الفواتير المسلمة';
        subtitle = selectedMetric === 'sales' ? 'جميع المبيعات المكتملة والنشطة' : 'الفواتير التي تم تسليمها بالكامل';
        headers = ['رقم الفاتورة', 'العميل', 'التاريخ', 'الحالة', 'المبلغ'];
        rows = (salesQuery.data?.tables?.orders ?? []).map((o: any) => ({
          id: o.id, number: o.orderNumber, customer: o.customer,
          date: formatDate(o.date), status: o.status === 'delivered' ? 'مستلم' : 'مشحون', amount: formatCurrency(o.totalAmount),
          raw_search: `${o.orderNumber} ${o.customer}`,
        }));
        break;
      case 'expenses':
        title = 'بيان المصروفات التشغيلية'; subtitle = 'جميع المصاريف باستثناء المشتريات وتكلفة البضاعة';
        headers = ['التاريخ', 'البند', 'المبلغ', 'الوصف'];
        rows = expenseTransactions.map((t: any) => ({
          id: t.id, date: formatDate(t.date), category: t.category, amount: formatCurrency(t.amount), description: t.description || '',
          raw_search: `${t.category} ${t.description ?? ''}`,
        }));
        break;
      case 'tax':
        title = 'تحليل الضرائب المحصلة'; subtitle = 'ضريبة القيمة المضافة على المبيعات';
        headers = ['البيان', 'القيمة', 'ملاحظة'];
        rows = [
          { id: 1, label: 'إجمالي الضرائب المحصلة', value: formatCurrency(totalTaxCollected), note: 'VAT', raw_search: 'tax collected' },
          { id: 2, label: 'إجمالي المبيعات الخاضعة للضريبة', value: formatCurrency(totalRevenue), note: 'إيرادات', raw_search: 'taxable sales' },
          { id: 3, label: 'عدد الفواتير', value: deliveredOrdersCount.toLocaleString(), note: 'فاتورة', raw_search: 'invoices' },
          { id: 4, label: 'نسبة الضريبة', value: totalRevenue > 0 ? `${((totalTaxCollected / totalRevenue) * 100).toFixed(2)}%` : '0%', note: 'من إجمالي المبيعات', raw_search: 'tax rate' },
        ];
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
    return { title, subtitle, headers, rows: filteredRows };
  }, [selectedMetric, salesQuery.data, customers, items, searchTerm, totalRevenue, totalCostOfGoodsSold, totalExpenses, grossProfit, netProfit, topSellingProducts, profitQuery.data, inventoryQuery.data, expenseTransactions]);

  // ── KPI Card Definitions ──
  const netLabel = profitVal > 0 ? 'صافي الأرباح' : lossVal > 0 ? 'إجمالي الخسائر' : 'صافي الربح/الخسارة';
  const netValue = profitVal > 0 ? profitVal : lossVal > 0 ? lossVal : 0;
  const netIcon = profitVal > 0 ? CheckCircle2 : lossVal > 0 ? TrendingDown : Minus;
  const netGradient = profitVal > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : lossVal > 0 ? 'bg-gradient-to-r from-red-500 to-rose-400' : 'bg-gradient-to-r from-gray-500 to-gray-400';
  const netIconBg = profitVal > 0 ? 'bg-green-500' : lossVal > 0 ? 'bg-red-500' : 'bg-gray-500';
  const netTrendDir = profitVal > 0 ? 'up' : lossVal > 0 ? 'down' : 'neutral';
  const netTrendLabel = profitVal > 0 ? 'ربح' : lossVal > 0 ? 'خسارة' : '─';

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
      type: 'sales', rawValue: totalTaxCollected,
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

  // ── Loading State ──
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

          {/* ── KPI Cards Grid ── */}
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
                <KPICard key={i} stat={stat} index={i} onClick={() => { setSearchTerm(''); setSelectedMetric(stat.type); }} />
              ))}
            </div>
          )}

          {/* ── Charts Section ── */}
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
        /* ── Audit Log Tab ── */
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

      {/* ── Analytics Modal ── */}
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
            customers={customers}
            warehouses={[]}
            expenseTransactions={expensesQuery.data?.tables?.transactions ?? []}
            expenseCategoryBreakdown={expensesQuery.data?.charts?.categoryBreakdown ?? []}
          />
        )}
      </AnimatePresence>
    </WorkspaceLayout>
    </ReportErrorBoundary>
    
  );
}
