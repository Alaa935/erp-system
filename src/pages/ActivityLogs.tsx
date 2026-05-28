import React, { useState, useMemo } from 'react';
import { useActivityLogs } from '../hooks/useActivityLogs';
import {
  Activity, Search, Download, Calendar, Clock, User, RefreshCw
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { EnterpriseTable, type Column } from '../components/design-system';

const actionColors: Record<string, string> = {
  'إضافة': 'bg-green-50 text-green-600 border-green-200',
  'تعديل': 'bg-blue-50 text-blue-600 border-blue-200',
  'حذف': 'bg-red-50 text-red-600 border-red-200',
  'تفعيل': 'bg-purple-50 text-purple-600 border-purple-200',
  'تعطيل': 'bg-orange-50 text-orange-600 border-orange-200',
  'تسجيل': 'bg-gray-50 text-gray-600 border-gray-200'
};

const entities = [
  { value: '', label: 'الكل' },
  { value: 'Item', label: 'الأصناف' },
  { value: 'SupplierInvoice', label: 'فواتير الموردين' },
  { value: 'SalesOrder', label: 'طلبات البيع' },
  { value: 'TaxConfig', label: 'الضرائب' },
  { value: 'Employee', label: 'الموظفين' },
  { value: 'Branch', label: 'الفروع' },
  { value: 'User', label: 'المستخدمين' },
];

export default function ActivityLogs() {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  const { data, isLoading } = useActivityLogs({
    pageSize: 1000,
    search: search || undefined,
    entity: entityFilter || undefined,
    action: actionFilter || undefined,
  });

  const allLogs = useMemo(() => {
    const raw = (data as any)?.logs ?? [];
    return raw.map((log: any) => ({
      ...log,
      timestamp: typeof log.timestamp === 'number' ? log.timestamp : new Date(log.timestamp).getTime(),
    }));
  }, [data]);

  const filteredLogs = useMemo(() => {
    if (!allLogs || allLogs.length === 0) return [];
    return allLogs.filter((log: any) => {
      if (search && !log.details?.includes(search) && !log.action?.includes(search) && !log.username?.includes(search)) return false;
      if (entityFilter && log.entity !== entityFilter) return false;
      if (actionFilter && !log.action?.includes(actionFilter)) return false;
      return true;
    });
  }, [allLogs, search, entityFilter, actionFilter]);

  const columns: Column<any>[] = [
    { key: 'username', label: 'المستخدم', sortable: true, render: (log: any) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-gray-500" />
        </div>
        <span className="text-xs font-bold text-black">{log.username}</span>
      </div>
    )},
    { key: 'action', label: 'الإجراء', sortable: true, render: (log: any) => (
      <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border", getActionColor(log.action))}>
        {log.action}
      </span>
    )},
    { key: 'entity', label: 'الكيان', sortable: true, render: (log: any) => (
      <span className="text-xs text-gray-500">{getEntityLabel(log.entity)}</span>
    )},
    { key: 'details', label: 'التفاصيل', render: (log: any) => (
      <p className="text-xs text-gray-700 truncate max-w-[250px]">{log.details}</p>
    )},
    { key: 'timestamp', label: 'التاريخ', sortable: true, render: (log: any) => (
      <span className="text-[10px] text-gray-400">{formatDate(log.timestamp)}</span>
    )},
  ];

  const groupedByDate = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredLogs.forEach((log: any) => {
      const dateKey = new Date(log.timestamp).toLocaleDateString('ar-EG');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });
    return groups;
  }, [filteredLogs]);

  const handleExportCSV = () => {
    if (!filteredLogs.length) { toast.error('لا توجد بيانات للتصدير'); return; }
    const headers = ['المستخدم', 'الإجراء', 'الكيان', 'التفاصيل', 'التاريخ'];
    const rows = filteredLogs.map((l: any) => [l.username, l.action, l.entity, l.details, formatDate(l.timestamp)]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity_logs_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('تم تصدير السجل بنجاح');
  };

  const getActionColor = (action: string) => {
    for (const [key, color] of Object.entries(actionColors)) {
      if (action?.includes(key)) return color;
    }
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const getEntityLabel = (entity: string) => {
    const found = entities.find(e => e.value === entity);
    return found ? found.label : entity || 'غير محدد';
  };

  return (
    <div className="space-y-5" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-black">سجل النشاطات</h1>
          <p className="text-sm text-gray-500 mt-1">تتبع جميع العمليات والإجراءات في النظام</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['list', 'timeline'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", viewMode === m ? 'bg-white text-black shadow-sm' : 'text-gray-500')}
              >{m === 'list' ? 'قائمة' : 'تسلسل زمني'}</button>
            ))}
          </div>
          <button onClick={handleExportCSV}
            className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />تصدير
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="card-premium p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); }}
              className="input-premium w-full py-2.5 pr-10 pl-4 text-xs"
              placeholder="بحث في السجل..." />
          </div>
          <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); }}
            className="bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold focus:ring-2 focus:ring-black transition-all"
          >
            {entities.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
          <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); }}
            className="bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold focus:ring-2 focus:ring-black transition-all"
          >
            <option value="">كل الإجراءات</option>
            {Object.keys(actionColors).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {isLoading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
          <span className="text-xs text-gray-400">{filteredLogs.length} نتيجة</span>
        </div>
      </motion.div>

      {viewMode === 'list' ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card-premium overflow-hidden"
        >
          <EnterpriseTable
              data={filteredLogs}
              columns={columns}
              keyExtractor={(log: any) => log.id!}
              searchable={false}
              pagination
              pageSize={15}
              emptyState={
                <div className="flex flex-col items-center gap-2 py-12 opacity-50">
                  <Activity className="w-12 h-12 text-gray-300" />
                  <p className="font-bold text-gray-400">لا توجد نشاطات مطابقة</p>
                  <p className="text-xs text-gray-300">حاول تغيير معايير البحث</p>
                </div>
              }
            />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card-premium p-5"
        >
          <div className="space-y-6">
            {Object.entries(groupedByDate).slice(0, 5).map(([date, logs]: [string, any[]]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <h3 className="text-xs font-black text-gray-500">{date}</h3>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="space-y-1 pr-4 border-r-2 border-gray-100 mr-2">
                  {logs.slice(0, 10).map((log: any, i: number) => (
                    <div key={i} className="relative pr-6 pb-3">
                      <div className="absolute right-[-9px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-300" />
                      <div className="bg-gray-50 rounded-xl p-3 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold", getActionColor(log.action))}>{log.action}</span>
                          <span className="text-[9px] text-gray-400">{getEntityLabel(log.entity)}</span>
                        </div>
                        <p className="text-xs text-gray-700">{log.details}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-[9px] text-gray-400">{log.username}</span>
                          <Clock className="w-3 h-3 text-gray-400 mr-2" />
                          <span className="text-[9px] text-gray-400">{new Date(log.timestamp).toLocaleTimeString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(groupedByDate).length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">لا توجد نشاطات</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
