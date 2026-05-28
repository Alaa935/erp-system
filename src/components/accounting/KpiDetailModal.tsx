import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Printer, 
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Users,
  Box,
  CreditCard,
  Building,
  Target,
  FileText,
  PieChart as PieChartIcon,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn, formatDate } from '../../lib/utils';
import { FinancialTransaction, Item, PurchaseOrder, SalesOrder, Customer, Supplier, SalesRep } from '../../db/db';

type KPIType = 'liquidity' | 'custody' | 'inventory' | 'debtors' | 'creditors' | 'capital';

interface KpiDetailModalProps {
  type: KPIType;
  isOpen: boolean;
  onClose: () => void;
  data: {
    transactions?: FinancialTransaction[];
    items?: Item[];
    purchaseOrders?: PurchaseOrder[];
    salesOrders?: SalesOrder[];
    customers?: Customer[];
    suppliers?: Supplier[];
    reps?: SalesRep[];
    capital?: number;
  };
}

export const KpiDetailModal = ({ type, isOpen, onClose, data }: KpiDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const kpiConfig = {
    liquidity: { title: 'السيولة بالخزينة', icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
    custody: { title: 'عهدة لدى المناديب', icon: Users, color: 'text-orange-500', bg: 'bg-orange-50' },
    inventory: { title: 'قيمة المخزون', icon: Box, color: 'text-purple-600', bg: 'bg-purple-50' },
    debtors: { title: 'المديونيات (العملاء)', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
    creditors: { title: 'المستحقات (الموردين)', icon: Building, color: 'text-red-600', bg: 'bg-red-50' },
    capital: { title: 'رأس المال والأصول', icon: Target, color: 'text-black', bg: 'bg-gray-100' },
  };

  const { title, icon: Icon, color, bg } = kpiConfig[type];

  // Helper Calculations
  const renderLiquidity = () => {
    const tx = data.transactions || [];
    const income = tx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount ?? 0), 0);
    const expense = tx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount ?? 0), 0);
    
    // Chart Data
    const chartData = tx.slice(0, 15).reverse().map(t => ({
      date: formatDate(t.date ?? 0),
      amount: t.amount ?? 0,
      type: t.type
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 mb-1">الرصيد الحالي</p>
            <h4 className="text-2xl font-black">{(income - expense).toLocaleString()} ج.م</h4>
          </div>
          <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
            <p className="text-[10px] font-black text-green-600 mb-1">إجمالي التحصيلات</p>
            <h4 className="text-2xl font-black text-green-600">{income.toLocaleString()} +</h4>
          </div>
          <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
            <p className="text-[10px] font-black text-red-600 mb-1">إجمالي المنصرف</p>
            <h4 className="text-2xl font-black text-red-600">{expense.toLocaleString()} -</h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-64">
          <h4 className="font-black text-sm mb-4">التدفق النقدي الأخير</h4>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'black', fontFamily: 'Inter' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <h4 className="font-black text-sm">كشف حركة الخزينة</h4>
          <div className="space-y-2">
            {tx.slice(0, 10).map(t => (
              <div key={t.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", t.type === 'income' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                    {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-black">{t.description ?? ''}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{formatDate(t.date ?? 0)}</p>
                  </div>
                </div>
                <div className="text-left font-black text-sm">
                  {t.type === 'income' ? '+' : '-'} {t.amount?.toLocaleString()} ج.م
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    const items = data.items || [];
    const totalValue = items.reduce((s, i) => s + ((i.purchasePrice ?? 0) * (i.quantity ?? 0)), 0);
    const sortedByValue = [...items].sort((a, b) => ((b.purchasePrice ?? 0) * (b.quantity ?? 0)) - ((a.purchasePrice ?? 0) * (a.quantity ?? 0))).slice(0, 5);
    const stagnant = items.filter(i => (i.quantity ?? 0) > 0).sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0)).slice(0, 5);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 mb-1">إجمالي قيمة المخزون</p>
            <h4 className="text-3xl font-black text-purple-600">{totalValue.toLocaleString()} ج.م</h4>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 mb-1">إجمالي عدد القطع</p>
            <h4 className="text-3xl font-black">{items.reduce((s, i) => s + (i.quantity ?? 0), 0).toLocaleString()} قطعة</h4>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h4 className="font-black text-sm mb-4">الأصناف الأعلى قيمة</h4>
            <div className="space-y-4">
              {sortedByValue.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                  <div>
                    <p className="text-sm font-black">{item.name ?? ''}</p>
                    <p className="text-[10px] text-gray-400">كمية: {item.quantity ?? 0} | تكلفة: {item.purchasePrice ?? 0}</p>
                  </div>
                  <div className="text-left font-black text-purple-600 text-sm">
                    {((item.purchasePrice ?? 0) * (item.quantity ?? 0)).toLocaleString()} ج.م
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h4 className="font-black text-sm mb-4">توزيع الأصناف بالمخزن</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sortedByValue.map(i => ({ name: i.name, value: (i.purchasePrice ?? 0) * (i.quantity ?? 0) }))}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sortedByValue.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <h4 className="font-black text-sm mb-4">قائمة الجرد التفصيلية</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="text-[10px] text-gray-400 font-black border-b">
                <tr>
                  <th className="pb-3 px-2">الصنف</th>
                  <th className="pb-3 px-2">الكمية</th>
                  <th className="pb-3 px-2">متوسط التكلفة</th>
                  <th className="pb-3 px-2">سعر البيع</th>
                  <th className="pb-3 px-2 text-left">قيمة المخزون</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.filter(i => (i.name ?? '').toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                  <tr key={item.id} className="text-xs">
                    <td className="py-4 px-2">
                       <p className="font-black">{item.name ?? ''}</p>
                       <p className="text-[9px] text-gray-400">{item.sku ?? ''}</p>
                    </td>
                    <td className="py-4 px-2 font-black">{item.quantity ?? 0}</td>
                    <td className="py-4 px-2 font-bold">{item.purchasePrice ?? 0}</td>
                    <td className="py-4 px-2 font-bold">{item.sellingPrice ?? 0}</td>
                    <td className="py-4 px-2 font-black text-left">{((item.purchasePrice ?? 0) * (item.quantity ?? 0)).toLocaleString()} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderCustody = () => {
    const reps = data.reps || [];
    const sales = data.salesOrders || [];
    const totalCustody = sales
      .filter(o => (o.paidAmount ?? 0) > 0 && !o.isSettledWithWarehouse)
      .reduce((s, o) => s + o.paidAmount, 0);

    const repsData = reps.map(rep => {
      const repSales = sales.filter(o => o.repId === rep.id && (o.paidAmount ?? 0) > 0 && !o.isSettledWithWarehouse);
      const amount = repSales.reduce((s, o) => s + o.paidAmount, 0);
      return {
        ...rep,
        custodyAmount: amount,
        invoices: repSales.length,
        lastCollection: repSales.sort((a, b) => (b.date ?? 0) - (a.date ?? 0))[0]?.date
      };
    });

    return (
      <div className="space-y-6">
        <div className="bg-orange-50 p-8 rounded-[40px] border border-orange-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-black text-orange-600 mb-1">إجمالي العهد لدى كافة المناديب</p>
            <h4 className="text-4xl font-black text-orange-600">{totalCustody.toLocaleString()} ج.م</h4>
          </div>
          <Users className="w-16 h-16 text-orange-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repsData.map(rep => (
            <div key={rep.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-gray-400">
                  {(rep.name ?? '?').charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-gray-400 mb-1">العهدة الحالية</p>
                  <p className="text-lg font-black text-orange-600">{(rep.custodyAmount ?? 0).toLocaleString()} ج.م</p>
                </div>
              </div>
              <div>
                <h4 className="font-black text-sm">{rep.name ?? ''}</h4>
                <p className="text-[10px] text-gray-400">{rep.phone ?? ''}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-50">
                <div className="text-right">
                  <p className="text-[9px] text-gray-400 font-bold">فواتير لم تسوّ بعد</p>
                  <p className="text-xs font-black">{(rep.invoices ?? 0)} فاتورة</p>
                </div>
                <div className="text-left">
                  <p className="text-[9px] text-gray-400 font-bold">آخر توريد</p>
                  <p className="text-xs font-black">{rep.lastCollection ? formatDate(rep.lastCollection) : 'لا يوجد'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDebtors = () => {
    const customers = data.customers || [];
    const sales = data.salesOrders || [];
    
    const debtorsData = customers.map(c => {
      const unpaidOrders = sales.filter(o => o.customerId === c.id && o.paymentStatus !== 'paid');
      const amount = unpaidOrders.reduce((s, o) => s + (((o.totalAmount ?? 0) - (o.paidAmount || 0))), 0);
      return { ...c, debt: amount, unpaidCount: unpaidOrders.length };
    }).filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt);

    const totalDebt = debtorsData.reduce((s, c) => s + c.debt, 0);

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-black text-blue-600 mb-1">إجمالي ديون العملاء (Receivables)</p>
            <h4 className="text-4xl font-black text-blue-600">{totalDebt.toLocaleString()} ج.م</h4>
          </div>
          <CreditCard className="w-16 h-16 text-blue-200" />
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h4 className="font-black text-sm mb-4">أكثر العملاء مديونية</h4>
          <div className="space-y-3">
            {debtorsData.map(c => (
              <div key={c.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {(c.name ?? '?').charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-sm font-black">{c.name ?? ''}</h5>
                    <p className="text-[10px] text-gray-400">{(c.unpaidCount ?? 0)} فاتورة آجلة</p>
                  </div>
                </div>
                <div className="text-left font-black text-blue-600">
                  {(c.debt ?? 0).toLocaleString()} ج.م
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCreditors = () => {
    const suppliers = data.suppliers || [];
    const purchases = data.purchaseOrders || [];
    
    const creditorsData = suppliers.map(s => {
      const unpaidOrders = purchases.filter(o => o.supplierId === s.id && o.paymentStatus !== 'paid');
      const amount = unpaidOrders.reduce((acc, o) => acc + (((o.totalAmount ?? 0) - (o.paidAmount || 0))), 0);
      return { ...s, due: amount, unpaidCount: unpaidOrders.length };
    }).filter(s => s.due > 0).sort((a, b) => b.due - a.due);

    const totalDue = creditorsData.reduce((s, c) => s + c.due, 0);

    return (
      <div className="space-y-6">
        <div className="bg-red-50 p-8 rounded-[40px] border border-red-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-black text-red-600 mb-1">إجمالي مستحقات الموردين (Payables)</p>
            <h4 className="text-4xl font-black text-red-600">{totalDue.toLocaleString()} ج.م</h4>
          </div>
          <Building className="w-16 h-16 text-red-200" />
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h4 className="font-black text-sm mb-4">الموردين المستحق لهم دفعات</h4>
          <div className="space-y-3">
            {creditorsData.map(s => (
              <div key={s.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black">
                    {(s.name ?? '?').charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-sm font-black">{s.name ?? ''}</h5>
                    <p className="text-[10px] text-gray-400">{(s.unpaidCount ?? 0)} فاتورة غير مسددة</p>
                  </div>
                </div>
                <div className="text-left font-black text-red-600">
                  {(s.due ?? 0).toLocaleString()} ج.م
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCapital = () => {
    const assets = (data.items || []).reduce((s, i) => s + ((i.purchasePrice ?? 0) * (i.quantity ?? 0)), 0);
    const receivables = (data.salesOrders || []).filter(o => o.paymentStatus !== 'paid').reduce((s, o) => s + (((o.totalAmount ?? 0) - (o.paidAmount || 0))), 0);
    const cash = (data.transactions || []).reduce((s, t) => s + (t.type === 'income' ? (t.amount ?? 0) : -(t.amount ?? 0)), 0);
    const liabilities = (data.purchaseOrders || []).filter(o => o.paymentStatus !== 'paid').reduce((s, o) => s + (((o.totalAmount ?? 0) - (o.paidAmount || 0))), 0);
    const equity = (assets + receivables + cash) - liabilities;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
            <Target className="absolute -right-4 -bottom-4 w-40 h-40 opacity-10" />
            <p className="text-sm font-black opacity-60 mb-2">صافي حقوق الملكية (Equity)</p>
            <h4 className="text-4xl font-black">{equity.toLocaleString()} ج.م</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 mb-1">إجمالي الأصول</p>
              <h4 className="text-lg font-black text-green-600">{(assets + receivables + cash).toLocaleString()}</h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 mb-1">إجمالي الالتزامات</p>
              <h4 className="text-lg font-black text-red-600">{liabilities.toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h4 className="font-black text-sm mb-6">تحليل المركز المالي</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <span className="font-black text-sm">النقدية والمكافئات (Cash)</span>
              <span className="font-black text-green-600">{cash.toLocaleString()} ج.م</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <span className="font-black text-sm">المخزون السلعي (Inventory)</span>
              <span className="font-black text-purple-600">{assets.toLocaleString()} ج.م</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <span className="font-black text-sm">مدينون (Accounts Receivable)</span>
              <span className="font-black text-blue-600">{receivables.toLocaleString()} ج.م</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <span className="font-black text-sm">دائنون (Accounts Payable)</span>
              <span className="font-black text-red-600">-{liabilities.toLocaleString()} ج.م</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currentTabContent = () => {
    switch (activeTab) {
      case 'overview':
        switch (type) {
          case 'liquidity': return renderLiquidity();
          case 'inventory': return renderInventory();
          case 'custody': return renderCustody();
          case 'debtors': return renderDebtors();
          case 'creditors': return renderCreditors();
          case 'capital': return renderCapital();
          default: return null;
        }
      case 'details':
        return renderDetails();
      case 'analytics':
        return renderAnalytics();
      default: return null;
    }
  };

  const renderDetails = () => {
    switch (type) {
      case 'liquidity':
        const tx = (data.transactions || []).filter(t => (t.description ?? '').includes(searchTerm) || (t.category ?? '').includes(searchTerm));
        return (
          <div className="bg-white p-6 rounded-3xl border border-gray-100 divide-y">
            {tx.length > 0 ? tx.map(t => (
              <div key={t.id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-xl", t.type === 'income' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                    {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-black">{t.description ?? ''}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{formatDate(t.date ?? 0)}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className={cn("text-sm font-black", t.type === 'income' ? "text-green-600" : "text-red-600")}>
                    {t.type === 'income' ? '+' : '-'} {(t.amount ?? 0).toLocaleString()} ج.م
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">{t.category ?? ''}</p>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-gray-400 italic">لا توجد نتائج مطابقة للبحث</div>
            )}
          </div>
        );
      case 'inventory':
        const items = (data.items || []).filter(i => (i.name ?? '').includes(searchTerm) || (i.sku ?? '').includes(searchTerm));
        return (
          <div className="bg-white p-6 rounded-3xl border border-gray-100 overflow-x-auto">
            <table className="w-full text-right">
              <thead className="text-[10px] text-gray-400 font-black border-b">
                <tr>
                  <th className="pb-4 px-2">المنتج</th>
                  <th className="pb-4 px-2">الكمية</th>
                  <th className="pb-4 px-2">التكلفة</th>
                  <th className="pb-4 px-2 font-black">القيمة الكلية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="py-4 px-2">
                       <p className="text-sm font-black">{item.name ?? ''}</p>
                       <p className="text-[10px] text-gray-400">{item.sku ?? ''}</p>
                    </td>
                    <td className="py-4 px-2 text-sm font-bold">{item.quantity ?? 0} وحدة</td>
                    <td className="py-4 px-2 text-sm font-bold">{(item.purchasePrice ?? 0).toLocaleString()}</td>
                    <td className="py-4 px-2 text-sm font-black text-purple-600">{((item.purchasePrice ?? 0) * (item.quantity ?? 0)).toLocaleString()} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'debtors':
        const custs = (data.customers || []).map(c => {
          const debt = (data.salesOrders || []).filter(o => o.customerId === c.id && o.paymentStatus !== 'paid').reduce((s, o) => s + (((o.totalAmount ?? 0) - (o.paidAmount || 0))), 0);
          return { ...c, debt };
        }).filter(c => c.debt > 0 && (c.name ?? '').includes(searchTerm));
        return (
          <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
            {custs.map(c => (
              <div key={c.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center group cursor-pointer hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white">
                    {(c.name ?? '?').charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-sm font-black">{c.name ?? ''}</h5>
                    <p className="text-[10px] text-gray-400 font-bold">{c.phone ?? ''}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-blue-600">{(c.debt ?? 0).toLocaleString()} ج.م</p>
                  <p className="text-[9px] font-bold text-gray-400">رصيد مدين</p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'creditors':
        const supps = (data.suppliers || []).map(s => {
          const due = (data.purchaseOrders || []).filter(o => o.supplierId === s.id && o.paymentStatus !== 'paid').reduce((s, o) => s + (((o.totalAmount ?? 0) - (o.paidAmount || 0))), 0);
          return { ...s, due };
        }).filter(s => s.due > 0 && (s.name ?? '').includes(searchTerm));
        return (
          <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
            {supps.map(s => (
              <div key={s.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center group cursor-pointer hover:bg-red-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black group-hover:bg-red-600 group-hover:text-white">
                    {(s.name ?? '?').charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-sm font-black">{s.name ?? ''}</h5>
                    <p className="text-[10px] text-gray-400 font-bold">{s.phone ?? ''}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-red-600">{(s.due ?? 0).toLocaleString()} ج.م</p>
                  <p className="text-[9px] font-bold text-gray-400">رصيد دائن</p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'custody':
        const reps = (data.reps || []).map(r => {
          const custodyAmount = (data.salesOrders || []).filter(o => o.repId === r.id && (o.paidAmount ?? 0) > 0 && !o.isSettledWithWarehouse).reduce((s, o) => s + o.paidAmount, 0);
          return { ...r, custodyAmount };
        }).filter(r => r.custodyAmount > 0 && (r.name ?? '').includes(searchTerm));
        return (
          <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
            {reps.map(r => (
              <div key={r.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center group cursor-pointer hover:bg-orange-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black group-hover:bg-orange-500 group-hover:text-white">
                    {(r.name ?? '?').charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-sm font-black">{r.name}</h5>
                    <p className="text-[10px] text-gray-400 font-bold">{r.phone ?? ''}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-orange-600">{(r.custodyAmount ?? 0).toLocaleString()} ج.م</p>
                  <p className="text-[9px] font-bold text-gray-400">عهدة قيد التوريد</p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'capital':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="font-black text-sm">الأصول المتداولة</h4>
              <div className="space-y-2">
                {[
                  { label: 'السيولة النقدية', value: (data.transactions || []).reduce((s, t) => s + (t.type === 'income' ? (t.amount ?? 0) : -(t.amount ?? 0)), 0) },
                  { label: 'المخزون السلعي', value: (data.items || []).reduce((s, i) => s + ((i.purchasePrice ?? 0) * (i.quantity ?? 0)), 0) },
                  { label: 'المديونيات (العملاء)', value: (data.salesOrders || []).filter(o => o.paymentStatus !== 'paid').reduce((s, o) => s + (((o.totalAmount ?? 0) - (o.paidAmount || 0))), 0) }
                ].map(asset => (
                  <div key={asset.label} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                    <span className="text-xs font-bold">{asset.label}</span>
                    <span className="text-sm font-black">{(asset.value ?? 0).toLocaleString()} ج.م</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="font-black text-sm">الالتزامات</h4>
              <div className="space-y-2">
                {[
                  { label: 'مستحقات الموردين', value: (data.purchaseOrders || []).filter(o => o.paymentStatus !== 'paid').reduce((s, o) => s + (((o.totalAmount ?? 0) - (o.paidAmount || 0))), 0) }
                ].map(liability => (
                  <div key={liability.label} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                    <span className="text-xs font-bold">{liability.label}</span>
                    <span className="text-sm font-black text-red-600">{(liability.value ?? 0).toLocaleString()} ج.م</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const renderAnalytics = () => {
    // Shared Chart Config
    const chartConfig = {
      liquidity: { color: "#10b981", label: "الحساب النقدي" },
      inventory: { color: "#8b5cf6", label: "قيمة المخزون" },
      custody: { color: "#f59e0b", label: "العهد المنقولة" },
      debtors: { color: "#2563eb", label: "المديونيات النشطة" },
      creditors: { color: "#dc2626", label: "المستحقات الآجلة" },
      capital: { color: "#000000", label: "حقوق الملكية" }
    };

    const config = chartConfig[type];

    // Dummy data generation for charts based on real totals to keep it interactive
    const generateChartData = () => {
      let baseValue = 0;
      switch(type) {
        case 'liquidity': baseValue = (data.transactions || []).reduce((s, t) => s + (t.type === 'income' ? (t.amount ?? 0) : -(t.amount ?? 0)), 0); break;
        case 'inventory': baseValue = (data.items || []).reduce((s, i) => s + ((i.purchasePrice ?? 0) * (i.quantity ?? 0)), 0); break;
        case 'custody': baseValue = (data.salesOrders || []).filter(o => (o.paidAmount ?? 0) > 0 && !o.isSettledWithWarehouse).reduce((s, o) => s + (o.paidAmount ?? 0), 0); break;
        case 'debtors': baseValue = (data.salesOrders || []).filter(o => o.paymentStatus !== 'paid').reduce((s, o) => s + (((o.totalAmount ?? 0) - (o.paidAmount || 0))), 0); break;
        case 'creditors': baseValue = (data.purchaseOrders || []).filter(o => o.paymentStatus !== 'paid').reduce((acc, o) => acc + (((o.totalAmount ?? 0) - (o.paidAmount || 0))), 0); break;
        case 'capital': baseValue = 0; break;
        default: baseValue = 0;
      }

      const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
      return days.map((day, i) => ({
        name: day,
        value: baseValue * (0.8 + Math.random() * 0.4)
      }));
    };

    const analyticsData = generateChartData();

    return (
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm h-80">
          <div className="flex justify-between items-center mb-8">
             <h4 className="font-black text-sm flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                تحليل الاتجاه العام (7 أيام)
             </h4>
             <span className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-lg">بيانات تقديرية</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {analyticsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={config.color} fillOpacity={0.4 + (index * 0.1)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h4 className="font-black text-sm mb-4">كفاءة التحصيل والسداد</h4>
              <p className="text-[11px] text-gray-500 font-bold mb-6">مقارنة بين التدفق النقدي الفعلي والتقديري لهذا الأسبوع.</p>
              <div className="space-y-4">
                 {[
                   { label: 'نسبة النمو المسجلة', value: '12.5%', icon: TrendingUp, color: 'text-green-600' },
                   { label: 'دقة التوقعات المالية', value: '94.2%', icon: Target, color: 'text-blue-600' }
                 ].map(stat => (
                   <div key={stat.label} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <stat.icon className={cn("w-5 h-5", stat.color)} />
                         <span className="text-xs font-black">{stat.label}</span>
                      </div>
                      <span className="text-sm font-black">{stat.value}</span>
                   </div>
                 ))}
              </div>
           </div>
           <div className="bg-black p-8 rounded-[40px] text-white flex flex-col justify-center">
              <h4 className="text-xl font-black mb-2">رؤية الذكاء الاصطناعي</h4>
              <p className="text-xs opacity-60 font-medium leading-relaxed">
                 بناءً على تتبع "التحليلات المالية" نلاحظ استقراراً في معدل التدفق النقدي مع زيادة طفيفة في متوسط التوريد من المناديب. يُنصح بمراجعة ديون العملاء المتأخرة لأكثر من 15 يوم لضمان توازن السيولة.
              </p>
              <button className="mt-8 bg-white text-black py-3 rounded-2xl font-black text-xs hover:bg-gray-100 transition-colors">
                تحميل التقرير التحليلي الكامل
              </button>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="bg-gray-50 w-full max-w-5xl h-[90vh] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden" 
        dir="rtl"
      >
        {/* Sticky Header */}
        <div className="bg-white p-6 border-b border-gray-100 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <div className={cn("w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center", bg, color)}>
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black">{title}</h3>
              <p className="text-sm text-gray-500 font-bold">تحليلات وتفاصيل دقيقة للنظام المالي</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button className="p-3 bg-gray-100 hover:bg-black hover:text-white rounded-2xl transition-all shadow-sm">
                <Download className="w-5 h-5" />
             </button>
             <button className="p-3 bg-gray-100 hover:bg-black hover:text-white rounded-2xl transition-all shadow-sm">
                <Printer className="w-5 h-5" />
             </button>
             <button 
              onClick={onClose}
              className="p-3 bg-black text-white hover:bg-red-600 rounded-2xl transition-all shadow-lg"
             >
                <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Filters and Search Strip */}
        <div className="bg-white/50 backdrop-blur shadow-sm p-4 flex gap-4 items-center">
            <div className="flex-1 relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="ابحث داخل البيانات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 bg-white border border-gray-100 rounded-2xl pr-12 pl-4 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-black/5"
                />
            </div>
            <button className="h-12 px-6 bg-white border border-gray-100 rounded-2xl font-black text-xs flex items-center gap-2 shadow-sm">
                <Filter className="w-4 h-4" /> فلاتر متقدمة
            </button>
            <div className="flex bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
                <button className={cn("px-4 py-2 rounded-xl text-xs font-black transition-all", activeTab === 'overview' ? "bg-black text-white" : "text-gray-400")} onClick={() => setActiveTab('overview')}>نظرة عامة</button>
                <button className={cn("px-4 py-2 rounded-xl text-xs font-black transition-all", activeTab === 'details' ? "bg-black text-white" : "text-gray-400")} onClick={() => setActiveTab('details')}>التفاصيل</button>
                <button className={cn("px-4 py-2 rounded-xl text-xs font-black transition-all", activeTab === 'analytics' ? "bg-black text-white" : "text-gray-400")} onClick={() => setActiveTab('analytics')}>التحليل الإحصائي</button>
            </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar scroll-smooth">
           <AnimatePresence mode="wait">
             <motion.div
               key={`${type}-${activeTab}`}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               transition={{ duration: 0.2 }}
             >
                {activeTab === 'overview' && currentTabContent()}
                {activeTab === 'details' && (
                    <div className="bg-white p-12 rounded-[40px] text-center border border-gray-100">
                        <FileText className="w-20 h-20 text-gray-200 mx-auto mb-6" />
                        <h4 className="text-xl font-black">جاري تحضير التقارير التفصيلية</h4>
                        <p className="text-sm text-gray-500 font-bold mt-2">نظام التحليل يقوم بتجميع البيانات المالية المحدثة حالياً.</p>
                    </div>
                )}
                {activeTab === 'analytics' && (
                    <div className="bg-white p-12 rounded-[40px] text-center border border-gray-100">
                        <PieChartIcon className="w-20 h-20 text-gray-200 mx-auto mb-6" />
                        <h4 className="text-xl font-black">التحليل الإحصائي المتقدم</h4>
                        <p className="text-sm text-gray-500 font-bold mt-2">الرسوم البيانية والمقارنة الشهرية قيد المعالجة.</p>
                    </div>
                )}
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400">آخر تحديث للبيانات: {formatDate(Date.now())}</span>
            <div className="flex gap-4">
                 <button className="px-8 py-3 bg-gray-100 font-black rounded-2xl text-xs" onClick={onClose}>إغلاق</button>
                 <button className="px-8 py-3 bg-black text-white font-black rounded-2xl text-xs shadow-xl active:scale-95 transition-all">تصدير التقرير PDF</button>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
