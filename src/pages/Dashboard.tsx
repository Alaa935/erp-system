import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, DollarSign, Package, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Eye, RefreshCw,
  Activity, Percent, Wallet, Truck,
  Bell, Zap, CheckCircle2, Info, BarChart3, PieChart, Users, FileText, Target,
  ShoppingCart, UserPlus, ClipboardList, Sparkles,
  Star, Award, Clock, ExternalLink, Coins, UserCheck,
  UserX, TrendingDown, Ban, Shield, Handshake,
  ArrowRightLeft, Banknote, Building2, Receipt,
  CircleDot, Circle, CircleCheck, ArrowUpDown,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, Area, AreaChart, LineChart, Line,
} from 'recharts';
import { toast } from 'sonner';
import { Card, PageHeader, EmptyState, WorkspaceSection } from '../components/design-system';
import { LoadingButton } from '../components/ui/LoadingButton';
import { useExecutiveDashboard } from '../hooks/useExecutiveDashboard';
import { useConfirmCollection } from '../hooks/useAccounting';
import { useProtectedMutation } from '../hooks/useProtectedMutation';
import api from '../lib/api-client';

const COLORS = ['#000000', '#333333', '#666666', '#999999', '#BBBBBB', '#22C55E', '#EF4444', '#F59E0B'];
const STATUS_COLORS = { success: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-rose-500', info: 'bg-blue-500', default: 'bg-gray-500' } as const;

function fmt(n: number) { return n.toLocaleString('ar-EG'); }

function getColorForValue(val: number, good: number, bad: number): 'success' | 'warning' | 'danger' {
  if (val >= good) return 'success';
  if (val <= bad) return 'danger';
  return 'warning';
}

function getHealthColor(ratio: number): string {
  if (ratio >= 0.8) return 'text-emerald-600';
  if (ratio >= 0.5) return 'text-amber-600';
  return 'text-rose-600';
}

const MiniSparkline = ({ data, color = '#000' }: { data: number[]; color?: string }) => {
  if (!data || data.length < 2) return null;
  const w = 56, h = 20;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) =>
    [(i / (data.length - 1) * w).toFixed(1), (h - ((v - min) / range) * (h - 4) - 2).toFixed(1)].join(',')
  ).join(' ');
  const gradId = 'sg-' + color.replace('#', '');
  const last = pts.split(' ').slice(-1)[0];
  const first = pts.split(' ')[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={`M${pts}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${first} L${pts.split(' ').slice(1).join(' L')} L${last.split(',')[0]},${h} L${first.split(',')[0]},${h} Z`} fill={`url(#${gradId})`} />
    </svg>
  );
};

const KpiCard = React.memo(({ title, value, subtitle, icon: Icon, trend, change, variant = 'default', loading }: {
  title: string; value: string; subtitle?: string; icon: React.ComponentType<{ className?: string }>;
  trend?: number[]; change?: number; variant?: keyof typeof STATUS_COLORS; loading?: boolean;
}) => {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 group"
    >
      {loading ? (
        <div className="space-y-3"><div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" /><div className="h-3 w-24 rounded bg-gray-100 animate-pulse" /><div className="h-7 w-32 rounded bg-gray-100 animate-pulse" /></div>
      ) : (
        <><div className="flex items-start justify-between mb-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110', variant === 'success' ? 'bg-emerald-50' : variant === 'warning' ? 'bg-amber-50' : variant === 'danger' ? 'bg-rose-50' : variant === 'info' ? 'bg-blue-50' : 'bg-gray-50')}>
            <Icon className={cn('w-5 h-5', variant === 'success' ? 'text-emerald-600' : variant === 'warning' ? 'text-amber-600' : variant === 'danger' ? 'text-rose-600' : variant === 'info' ? 'text-blue-600' : 'text-gray-900')} />
          </div>
          <div className="flex items-center gap-1.5">
            {change !== undefined && (
              <span className={cn('flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-lg', change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
                {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(change)}%
              </span>
            )}
            {trend && <MiniSparkline data={trend} color={change !== undefined && change >= 0 ? '#22C55E' : '#EF4444'} />}
          </div>
        </div>
        <p className="text-[11px] font-bold text-gray-500 mb-1">{title}</p>
        <h3 className="text-xl font-black text-black tracking-tight truncate">{value}</h3>
        {subtitle && <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{subtitle}</p>}</>
      )}
    </motion.div>
  );
});

const MoneyBar = ({ label, amount, total, color, icon: Icon }: { label: string; amount: number; total: number; color: string; icon: React.ComponentType<{ className?: string }> }) => {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color.replace('bg-', 'bg-').replace('text-', '') + '/10')}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-gray-700">{label}</span>
          <span className="text-xs font-black">{formatCurrency(amount)}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full rounded-full', color.replace('text-', 'bg-'))} />
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-lg p-3 text-right">
      <p className="text-xs font-bold text-gray-500 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="font-bold text-gray-700">{p.name}:</span>
          <span className="font-black text-black">{p.name.includes('نسبة') ? `${p.value}%` : formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

interface ActionBtnProps { label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void; color?: string; }
const ActionBtn = ({ label, icon: Icon, onClick, color = 'bg-black' }: ActionBtnProps) => (
  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/60 text-xs font-bold text-gray-700 transition-all hover:shadow-sm"
  >
    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0', color)}>
      <Icon className="w-3 h-3 text-white" />
    </div>
    {label}
  </motion.button>
);

interface ApproveBtnProps { onClick: () => void; label: string; isPending?: boolean; variant?: 'confirm' | 'reject'; }
const ApproveBtn = ({ onClick, label, isPending, variant = 'confirm' }: ApproveBtnProps) => (
  <LoadingButton
    isPending={isPending}
    onClick={onClick}
    size="sm"
    className={variant === 'confirm' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}
  >
    {label}
  </LoadingButton>
);

export default function Dashboard({ setActivePage }: { setActivePage: (page: string) => void }) {
  const exec = useExecutiveDashboard();
  const confirmCollection = useConfirmCollection();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const navigateTo = useCallback((page: string) => setActivePage(page), [setActivePage]);

  const handleQuickConfirm = async (id: number) => {
    setConfirmingId(id);
    try {
      await confirmCollection.mutateAsync(id);
      toast.success('تم تأكيد التحصيل');
    } catch { toast.error('فشل التأكيد'); }
    finally { setConfirmingId(null); }
  };

  const cashAllocation = useMemo(() => {
    const cp = exec.cashPosition;
    if (!cp) return [];
    const items = [
      { label: 'الخزينة', amount: cp.cashInTreasury, color: 'text-emerald-600', icon: Banknote },
      { label: 'بين المناديب', amount: cp.cashWithReps, color: 'text-amber-600', icon: Users },
      { label: 'تسويات معلقة', amount: cp.pendingSettlements, color: 'text-rose-600', icon: Clock },
      { label: 'مديونيات عملاء', amount: cp.outstandingReceivables, color: 'text-blue-600', icon: Receipt },
    ];
    const total = items.reduce((s, i) => s + i.amount, 0) || 1;
    return items.map(i => ({ ...i, total }));
  }, [exec.cashPosition]);

  const pendingCollectionsList = useMemo(() => {
    return (exec.accountingData?.collections || []).filter((c: any) => c.status === 'pending').slice(0, 8);
  }, [exec.accountingData]);

  const activityLogs = useMemo(() => {
    if (!exec.accountingData?.transactions) return [];
    const txns = exec.accountingData.transactions as any[];
    return txns.slice(0, 10).map((t: any) => ({
      id: t.id,
      action: t.type === 'income' ? 'إيراد' : 'مصروف',
      details: `${t.description} — ${formatCurrency(t.amount)}`,
      timestamp: new Date(t.date).getTime(),
      type: t.type,
    }));
  }, [exec.accountingData]);

  const healthScore = useMemo(() => {
    const f = exec.financial;
    if (!f) return { score: 0, label: '...', color: 'text-gray-400' };
    const collectionHealth = f.collectionRate / 100;
    const marginHealth = Math.min(f.profitMargin / 100, 1);
    const cashHealth = exec.cashPosition ? Math.min(exec.cashPosition.cashInTreasury / (exec.cashPosition.balance || 1), 1) : 0;
    const score = Math.round((collectionHealth * 0.4 + marginHealth * 0.35 + cashHealth * 0.25) * 100);
    const label = score >= 80 ? 'ممتاز' : score >= 60 ? 'جيد' : score >= 40 ? 'متوسط' : 'حرج';
    return { score, label, color: getHealthColor(score / 100) };
  }, [exec.financial, exec.cashPosition]);

  return (
    <div className="space-y-5" dir="rtl">
      <PageHeader
        title="لوحة القيادة التنفيذية"
        subtitle="رؤية شاملة لحظة بلحظة — تعرف أين كل جنيه في مؤسستك"
        icon={BarChart3}
        badge={{ label: 'مباشر', variant: 'success' }}
        actions={
          <div className="flex items-center gap-2">
            <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold', healthScore.color.includes('emerald') ? 'bg-emerald-50 text-emerald-700' : healthScore.color.includes('amber') ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700')}>
              <Circle className={cn('w-2 h-2 fill-current', healthScore.color)} />
              مؤشر الصحة: {healthScore.score}% — {healthScore.label}
            </div>
          </div>
        }
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-black text-white">لمحة النقدية — أين أموالك الآن؟</h2>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{new Date().toLocaleTimeString('ar-SA')}</span>
        </div>
        {exec.cashPosition ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-[10px] font-bold text-emerald-300 mb-1">في الخزينة</p>
              <p className="text-2xl font-black text-white">{formatCurrency(exec.cashPosition.cashInTreasury)}</p>
              <p className="text-[10px] text-gray-400 mt-1">متاح للسحب والاستخدام</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-[10px] font-bold text-amber-300 mb-1">بين المناديب</p>
              <p className="text-2xl font-black text-white">{formatCurrency(exec.cashPosition.cashWithReps)}</p>
              <p className="text-[10px] text-gray-400 mt-1">غير محصّلة بعد في الخزينة</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-[10px] font-bold text-rose-300 mb-1">التسويات المعلقة</p>
              <p className="text-2xl font-black text-white">{formatCurrency(exec.cashPosition.pendingSettlements)}</p>
              <p className="text-[10px] text-gray-400 mt-1">تسويات مناديب بانتظار التأكيد</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-[10px] font-bold text-blue-300 mb-1">المديونيات</p>
              <p className="text-2xl font-black text-white">{formatCurrency(exec.cashPosition.outstandingReceivables)}</p>
              <p className="text-[10px] text-gray-400 mt-1">مستحقة على العملاء</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
          </div>
        )}
      </motion.div>

      <WorkspaceSection title="المؤشرات المالية" description="ملخص الأداء المالي مع الاتجاهات"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-gray-500 font-bold">التحصيل {exec.financial ? exec.financial.collectionRate.toFixed(1) : '...'}%</span>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard title="إجمالي المبيعات" value={exec.financial ? formatCurrency(exec.financial.totalSales) : '...'} icon={TrendingUp}
            change={exec.financial?.salesChange} trend={exec.financial?.salesTrend} loading={exec.isLoading} />
          <KpiCard title="صافي الربح" value={exec.financial ? formatCurrency(exec.financial.netProfit) : '...'} icon={Wallet}
            change={exec.financial?.profitChange} variant="success" loading={exec.isLoading} />
          <KpiCard title="إجمالي التحصيلات" value={exec.financial ? formatCurrency(exec.financial.totalCollections) : '...'} icon={Coins}
            variant="info" loading={exec.isLoading} subtitle={`نسبة تحصيل ${exec.financial?.collectionRate.toFixed(1) || '...'}%`} />
          <KpiCard title="المديونيات" value={exec.financial ? formatCurrency(exec.financial.outstandingReceivables) : '...'} icon={Receipt}
            variant={exec.financial && exec.financial.outstandingReceivables > 0 ? 'warning' : 'success'} loading={exec.isLoading} />
          <KpiCard title="متوسط الفاتورة" value={exec.financial ? formatCurrency(exec.financial.avgInvoiceValue) : '...'} icon={FileText}
            loading={exec.isLoading} />
          <KpiCard title="هامش الربح" value={exec.financial ? `${exec.financial.profitMargin.toFixed(1)}%` : '...'} icon={Percent}
            variant={exec.financial && exec.financial.profitMargin >= 20 ? 'success' : 'warning'} loading={exec.isLoading} />
        </div>
      </WorkspaceSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <WorkspaceSection title="أين أموالك؟" description="النقدية والمديونيات">
          {cashAllocation.length > 0 ? (
            <div className="space-y-1">
              {cashAllocation.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                  <MoneyBar {...item} />
                </motion.div>
              ))}
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">الإجمالي النقدي</span>
                <span className="text-sm font-black">{formatCurrency(exec.cashPosition?.balance || 0)}</span>
              </div>
            </div>
          ) : <EmptyState icon={Wallet} title="بيانات غير متوفرة" />}
        </WorkspaceSection>

        <WorkspaceSection title="أداء المناديب" description="أفضل وأقل المناديب أداءً"
          actions={<ActionBtn label="عرض الكل" icon={Users} onClick={() => navigateTo('sales-rep-management')} color="bg-blue-600" />}
        >
          {exec.salesRepPerformance ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/80 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-700">الأفضل مبيعات</span>
                  </div>
                  <p className="text-sm font-black text-black">{exec.salesRepPerformance.topPerformer?.name || '—'}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{exec.salesRepPerformance.topPerformer ? formatCurrency(exec.salesRepPerformance.topPerformer.sales) : 'لا توجد مبيعات'}</p>
                </div>
                <div className="bg-amber-50/80 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                    <span className="text-[10px] font-bold text-amber-700">الأقل أداءً</span>
                  </div>
                  <p className="text-sm font-black text-black">{exec.salesRepPerformance.lowestPerformer?.name || '—'}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{exec.salesRepPerformance.lowestPerformer ? formatCurrency(exec.salesRepPerformance.lowestPerformer.sales) : '—'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-bold text-gray-700">المناديب النشطون</span>
                </div>
                <span className="text-lg font-black">{exec.salesRepPerformance.totalActiveReps}</span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-bold text-gray-700">مبيعات اليوم للمناديب</span>
                </div>
                <span className="text-lg font-black">{formatCurrency(exec.salesRepPerformance.dailySalesByRep)}</span>
              </div>
            </div>
          ) : <EmptyState icon={Users} title="بيانات المناديب غير متوفرة" />}
        </WorkspaceSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <WorkspaceSection title="تحليل المبيعات والتدفق النقدي" description="شهري"
            actions={
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-black" /><span className="text-[10px] text-gray-500 font-bold">مبيعات</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] text-gray-500 font-bold">التحصيلات</span></div>
              </div>
            }
          >
            <div className="h-72" style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <BarChart data={exec.charts?.salesByMonth || []} barSize={12} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="sales" fill="#000000" radius={[4, 4, 0, 0]} name="مبيعات" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </WorkspaceSection>
        </div>

        <WorkspaceSection title="المخزون السريع" description="حالة الأصناف"
          actions={<ActionBtn label="إدارة" icon={Package} onClick={() => navigateTo('inventory')} color="bg-emerald-600" />}>
          {exec.inventoryHealth ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-gray-700">قيمة المخزون</span>
                </div>
                <span className="text-sm font-black">{formatCurrency(exec.inventoryHealth.inventoryValue)}</span>
              </div>
              <div className="space-y-1">
                {exec.inventoryHealth.outOfStockCount > 0 && (
                  <div className="flex items-center justify-between p-2.5 bg-rose-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-xs font-bold text-rose-700">نفد تماماً</span>
                    </div>
                    <span className="text-xs font-black text-rose-700">{exec.inventoryHealth.outOfStockCount}</span>
                  </div>
                )}
                {exec.inventoryHealth.lowStockCount > 0 && (
                  <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-amber-700">منخفض</span>
                    </div>
                    <span className="text-xs font-black text-amber-700">{exec.inventoryHealth.lowStockCount - exec.inventoryHealth.outOfStockCount}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-gray-700">متوفر</span>
                  </div>
                  <span className="text-xs font-black">{exec.inventoryHealth.totalItems - exec.inventoryHealth.lowStockCount}</span>
                </div>
              </div>
              {exec.inventoryHealth.outOfStockItems.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-rose-600 mb-1.5">أصناف نفدت — تحتاج طلب عاجل</p>
                  {exec.inventoryHealth.outOfStockItems.slice(0, 3).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-xs font-bold text-gray-700">{item.name}</span>
                      <span className="text-[10px] font-bold text-rose-500">نفد</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : <EmptyState icon={Package} title="بيانات المخزون غير متوفرة" />}
        </WorkspaceSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <WorkspaceSection title="العملاء" description="المديونيات والعملاء الجدد"
          actions={<ActionBtn label="إدارة" icon={Users} onClick={() => navigateTo('customers')} color="bg-blue-600" />}>
          {exec.customerMetrics ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-bold text-gray-700">إجمالي العملاء</span>
                </div>
                <span className="text-lg font-black">{exec.customerMetrics.totalCustomers}</span>
              </div>
              {exec.customerMetrics.customersWithBalance > 0 && (
                <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-rose-700">عليهم مديونيات</span>
                  </div>
                  <span className="text-lg font-black text-rose-700">{exec.customerMetrics.customersWithBalance}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">جدد هذا الشهر</span>
                </div>
                <span className="text-lg font-black">{exec.customerMetrics.newCustomersThisMonth}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-700">معدل تكرار الشراء</span>
                </div>
                <span className="text-lg font-black">{exec.customerMetrics.repeatCustomerRate}%</span>
              </div>
            </div>
          ) : <EmptyState icon={Users} title="بيانات العملاء غير متوفرة" />}
        </WorkspaceSection>

        <WorkspaceSection title="الأعمال قيد التنفيذ" description="الطلبات والتحصيلات بانتظار المراجعة"
          actions={<ActionBtn label="متابعة" icon={ClipboardList} onClick={() => navigateTo('sales-rep-management')} color="bg-amber-600" />}>
          {exec.operational ? (
            <div className="space-y-2">
              {[
                { label: 'طلبات توريد معلقة', value: exec.operational.pendingSupplyRequests, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'تحويلات معلقة', value: exec.operational.pendingTransfers, icon: ArrowRightLeft, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'تحصيلات بانتظار التأكيد', value: exec.operational.pendingCollections, icon: Coins, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'إنذارات المخزون', value: exec.operational.criticalAlerts, icon: AlertTriangle, color: exec.operational.criticalAlerts > 0 ? 'text-rose-600' : 'text-emerald-600', bg: exec.operational.criticalAlerts > 0 ? 'bg-rose-50' : 'bg-emerald-50' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={cn('flex items-center justify-between p-3 rounded-xl', item.bg)}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className={cn('w-4 h-4', item.color)} />
                    <span className="text-xs font-bold text-gray-700">{item.label}</span>
                  </div>
                  <span className={cn('text-base font-black', item.value > 0 ? item.color : 'text-gray-400')}>{item.value}</span>
                </motion.div>
              ))}
            </div>
          ) : <EmptyState icon={ClipboardList} title="لا تبيانات" />}
        </WorkspaceSection>

        <WorkspaceSection title="مركز الموافقات السريعة" description="تحصيلات بانتظار التأكيد">
          {pendingCollectionsList.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="كل التحصيلات مؤكدة" description="لا توجد تحصيلات بانتظار الموافقة" />
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {pendingCollectionsList.map((col: any, i: number) => {
                const repName = exec.accountingData?.reps?.find((r: any) => r.id === col.repId)?.name || 'مندوب';
                return (
                  <motion.div key={col.id || i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-black truncate">{formatCurrency(col.amount)}</p>
                      <p className="text-[9px] text-gray-400">{repName} • {formatDate(col.date)}</p>
                    </div>
                    <ApproveBtn label="تأكيد" onClick={() => handleQuickConfirm(col.id)} isPending={confirmingId === col.id} variant="confirm" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </WorkspaceSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <WorkspaceSection title="أفضل المنتجات" description="الأكثر مبيعاً">
          {!exec.topProducts?.items?.length ? (
            <EmptyState icon={BarChart3} title="لا توجد مبيعات كافية" />
          ) : (
            <div className="space-y-1">
              {exec.topProducts.items.slice(0, 5).map((item: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
                >
                  <span className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black text-white shrink-0',
                    i === 0 ? 'bg-black' : i === 1 ? 'bg-gray-600' : i === 2 ? 'bg-gray-400' : 'bg-gray-200 text-gray-600'
                  )}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-black truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">قيمة {formatCurrency(item.revenue)}</p>
                  </div>
                  <span className="text-xs font-black text-gray-700">{item.qty}</span>
                </motion.div>
              ))}
            </div>
          )}
        </WorkspaceSection>

        <WorkspaceSection title="أفضل العملاء" description="الأعلى إنفاقاً">
          {!exec.topCustomers?.items?.length ? (
            <EmptyState icon={Users} title="لا تبيانات كافية" />
          ) : (
            <div className="space-y-1">
              {exec.topCustomers.items.slice(0, 5).map((c: any, i: number) => {
                const initials = c.name?.charAt(0) || '?';
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0',
                      i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-500' : i === 2 ? 'bg-amber-700' : 'bg-gray-300 text-gray-600'
                    )}>{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-black truncate">{c.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{c.orders} طلب</p>
                    </div>
                    <span className="text-xs font-black">{formatCurrency(c.total)}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </WorkspaceSection>

        <WorkspaceSection title="آخر المعاملات المالية" description="أحدث الإيرادات والمصروفات">
          {activityLogs.length === 0 ? (
            <EmptyState icon={Activity} title="لا توجد معاملات بعد" />
          ) : (
            <div className="space-y-0.5 max-h-80 overflow-y-auto">
              {activityLogs.map((log: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-2.5 py-1.5 border-b border-gray-50 last:border-0"
                >
                  <div className={cn('w-1.5 h-1.5 mt-2 rounded-full shrink-0', log.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-black truncate">{log.details}</p>
                    <p className="text-[10px] text-gray-400">{log.action} • {formatDate(log.timestamp)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </WorkspaceSection>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200/60 p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-black">مركز الإجراءات السريعة</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionBtn label="فاتورة بيع جديدة" icon={ShoppingCart} onClick={() => navigateTo('sales-orders')} color="bg-black" />
          <ActionBtn label="إضافة عميل" icon={UserPlus} onClick={() => navigateTo('customers')} color="bg-blue-600" />
          <ActionBtn label="إضافة صنف" icon={Package} onClick={() => navigateTo('inventory')} color="bg-emerald-600" />
          <ActionBtn label="إدارة المناديب" icon={Users} onClick={() => navigateTo('sales-rep-management')} color="bg-purple-600" />
          <ActionBtn label="فاتورة مورد" icon={ClipboardList} onClick={() => navigateTo('supplier-invoices')} color="bg-amber-600" />
          <ActionBtn label="الحسابات" icon={Wallet} onClick={() => navigateTo('accounting')} color="bg-rose-600" />
        </div>
      </motion.div>
    </div>
  );
}
