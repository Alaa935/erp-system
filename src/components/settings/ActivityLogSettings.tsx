import React, { useMemo } from 'react';
import { Download, Activity, AlertTriangle, PlusSquare, Edit3, Trash2, LogIn, Clock } from 'lucide-react';
import { Card } from '../../components/design-system/Card';
import { Badge } from '../../components/design-system/Badge';
import { Button } from '../../components/design-system/Button';
import { EnterpriseTable } from '../../components/design-system/EnterpriseTable';
import { EnterpriseEmptyState } from '../../components/design-system/EnterpriseEmptyState';
import { formatDate } from '../../lib/utils';
import type { ActivityLog } from '../../types';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';

interface ActivityLogSettingsProps {
  activityLog: ActivityLog[] | undefined;
  onExport: () => void;
}

const ACTION_COLORS: Record<string, string> = {
  'إضافة': '#059669',
  'حذف': '#DC2626',
  'تعديل': '#2563EB',
  'دخول': '#D97706',
};

const ACTION_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'إضافة': PlusSquare,
  'حذف': Trash2,
  'تعديل': Edit3,
  'دخول': LogIn,
};

export function ActivityLogSettings({ activityLog: logs, onExport }: ActivityLogSettingsProps) {
  const logList = logs || [];

  const actionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logList.forEach(l => {
      let key = 'أخرى';
      if (l.action.includes('إضافة') || l.action.includes('اضافة')) key = 'إضافة';
      else if (l.action.includes('حذف')) key = 'حذف';
      else if (l.action.includes('تعديل') || l.action.includes('تحديث')) key = 'تعديل';
      else if (l.action.includes('دخول')) key = 'دخول';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [logList]);

  const last24h = logList.filter(l => Date.now() - l.timestamp < 86400000).length;
  const last7d = logList.filter(l => Date.now() - l.timestamp < 604800000).length;

  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    logList.forEach(l => {
      const d = new Date(l.timestamp).toLocaleDateString('ar-EG', { weekday: 'short' });
      days[d] = (days[d] || 0) + 1;
    });
    return Object.entries(days).slice(-7).map(([name, value]) => ({ name, value }));
  }, [logList]);

  if (logList.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black">سجل النشاطات</h3>
          <Button variant="secondary" size="sm" onClick={onExport} icon={<Download className="w-3.5 h-3.5" />}>
            تصدير
          </Button>
        </div>
        <Card padding="none">
          <EnterpriseEmptyState
            icon={
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
                <rect x="8" y="8" width="64" height="64" rx="16" fill="#F3F4F6" />
                <rect x="8" y="8" width="64" height="64" rx="16" stroke="#E5E7EB" strokeWidth="1" />
                <rect x="20" y="28" width="40" height="3" rx="1.5" fill="#D1D5DB" />
                <rect x="20" y="36" width="30" height="3" rx="1.5" fill="#D1D5DB" />
                <rect x="20" y="44" width="35" height="3" rx="1.5" fill="#D1D5DB" />
                <circle cx="16" cy="29" r="2" fill="#D1D5DB" />
                <circle cx="16" cy="37" r="2" fill="#D1D5DB" />
                <circle cx="16" cy="45" r="2" fill="#D1D5DB" />
              </svg>
            }
            title="لا توجد نشاطات مسجلة"
            description="سيتم تسجيل جميع العمليات والإجراءات هنا تلقائياً"
            action={<Button variant="secondary" size="sm" onClick={onExport} icon={<Download className="w-3.5 h-3.5" />}>تصدير</Button>}
            tips={['يتم تسجيل جميع عمليات الإضافة والحذف والتعديل', 'يمكن تصدير السجل كملف CSV', 'السجل يحتفظ بآخر 50 عملية']}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">إجمالي النشاطات</p>
            <Activity className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{logList.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">آخر 24 ساعة</p>
            <Clock className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{last24h}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">آخر 7 أيام</p>
            <Clock className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{last7d}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">متوسط يومي</p>
            <Activity className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{Math.round(last7d / 7) || 0}</p>
        </div>
      </div>

      {(actionCounts.length > 0 || chartData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {actionCounts.length > 0 && (
            <Card padding="md" className="lg:col-span-1">
              <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">توزيع النشاطات</p>
              <div className="space-y-2">
                {actionCounts.map((a) => {
                  const Icon = ACTION_ICONS[a.name] || Activity;
                  const color = ACTION_COLORS[a.name] || '#6B7280';
                  const maxVal = Math.max(...actionCounts.map(x => x.value));
                  const pct = maxVal > 0 ? (a.value / maxVal) * 100 : 0;
                  return (
                    <div key={a.name} className="flex items-center gap-2.5">
                      <div className="shrink-0" style={{ color }}><Icon className="w-3.5 h-3.5" /></div>
                      <span className="text-xs font-bold text-gray-600 w-16">{a.name}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-xs font-black text-gray-400 w-6 text-left">{a.value}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {chartData.length > 0 && (
            <Card padding="md" className="lg:col-span-2">
              <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">النشاط خلال الأيام</p>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={i === chartData.length - 1 ? '#000' : '#E5E7EB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}

      <EnterpriseTable
        data={logList}
        keyExtractor={(log) => log.id!}
        searchable
        searchKeys={['username', 'action', 'details']}
        searchPlaceholder="بحث في سجل النشاطات..."
        pagination
        pageSize={8}
        totalLabel="نشاط"
        toolbar={
          <Button size="sm" variant="secondary" onClick={onExport} icon={<Download className="w-3.5 h-3.5" />}>
            تصدير CSV
          </Button>
        }
        columns={[
          {
            key: 'user',
            label: 'المستخدم',
            className: 'w-32',
            render: (log: ActivityLog) => (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center text-[7px] font-black">
                  {log.username[0]}
                </div>
                <span className="text-xs font-bold">{log.username}</span>
              </div>
            ),
          },
          {
            key: 'action',
            label: 'العملية',
            className: 'w-28',
            render: (log: ActivityLog) => {
              const variant = log.action.includes('حذف') ? 'danger' : log.action.includes('إضافة') || log.action.includes('اضافة') ? 'success' : log.action.includes('دخول') ? 'info' : 'neutral';
              return <Badge variant={variant}>{log.action}</Badge>;
            },
          },
          {
            key: 'details',
            label: 'البيان',
            render: (log: ActivityLog) => (
              <span className="text-xs font-bold text-gray-500">{log.details}</span>
            ),
          },
          {
            key: 'timestamp',
            label: 'التاريخ',
            className: 'w-28 hidden md:table-cell',
            sortable: true,
            render: (log: ActivityLog) => (
              <span className="text-[10px] font-bold text-gray-400">{formatDate(log.timestamp)}</span>
            ),
          },
        ]}
      />
    </div>
  );
}
