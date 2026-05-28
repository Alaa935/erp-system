import React, { useMemo, useState } from 'react';
import { Plus, Shield, Trash2, Users, Building2, KeyRound, UserCog } from 'lucide-react';
import { Card } from '../../components/design-system/Card';
import { Badge } from '../../components/design-system/Badge';
import { Button } from '../../components/design-system/Button';
import { EnterpriseTable } from '../../components/design-system/EnterpriseTable';
import { EnterpriseEmptyState } from '../../components/design-system/EnterpriseEmptyState';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { Employee } from '../../types';

interface EmployeeSettingsProps {
  employees: Employee[] | undefined;
  onAddEmployee: () => void;
  onConfirmDelete: (type: 'employee', id: number) => void;
}

const DEPT_COLORS = ['#000', '#2563EB', '#059669', '#D97706', '#DC2626'];

export function EmployeeSettings({
  employees,
  onAddEmployee,
  onConfirmDelete
}: EmployeeSettingsProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());

  const empList = employees || [];
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    empList.forEach(e => { counts[e.department] = (counts[e.department] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [empList]);

  const adminCount = empList.filter(e => e.permissions === 'full' || (typeof e.permissions === 'object' && e.permissions.manageEmployees)).length;
  const deptCount = deptCounts.length;
  const permTypes = new Set(empList.map(e => typeof e.permissions === 'string' ? e.permissions : 'custom')).size;

  if (!employees || employees.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black">إدارة الموظفين والصلاحيات</h3>
          <Button onClick={onAddEmployee} icon={<Plus className="w-4 h-4" />}>إضافة موظف</Button>
        </div>
        <Card padding="none">
          <EnterpriseEmptyState
            icon={<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2"><rect x="8" y="8" width="64" height="64" rx="16" fill="#F3F4F6" /><rect x="8" y="8" width="64" height="64" rx="16" stroke="#E5E7EB" strokeWidth="1" /><circle cx="40" cy="32" r="8" fill="#D1D5DB" /><ellipse cx="40" cy="52" rx="14" ry="8" fill="#D1D5DB" /></svg>}
            title="لا يوجد موظفون بعد"
            description="أضف موظفاً جديداً لبدء إدارة الصلاحيات والصلاحيات الدقيقة"
            action={<Button onClick={onAddEmployee} icon={<Plus className="w-4 h-4" />}>إضافة موظف</Button>}
            tips={['يمكنك تحديد صلاحيات دقيقة لكل موظف', 'الموظفون يمكنهم تسجيل الدخول للنظام', 'صلاحية المدير تسمح بإدارة الموظفين الآخرين']}
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
            <p className="text-xs font-bold text-gray-400">إجمالي الموظفين</p>
            <Users className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{empList.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">الأقسام</p>
            <Building2 className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{deptCount}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">المدراء</p>
            <UserCog className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{adminCount}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">أنواع الصلاحيات</p>
            <KeyRound className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{permTypes}</p>
        </div>
      </div>

      {deptCounts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card padding="md" className="lg:col-span-1">
            <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">توزيع الأقسام</p>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deptCounts} cx="50%" cy="50%" innerRadius={20} outerRadius={38} paddingAngle={2} dataKey="value">
                      {deptCounts.map((_, i) => (
                        <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {deptCounts.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                    <span className="font-bold text-gray-600">{d.name}</span>
                    <span className="font-black text-gray-400">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card padding="md" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">نظرة سريعة</p>
              <Button size="sm" onClick={onAddEmployee} icon={<Plus className="w-3.5 h-3.5" />}>إضافة</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {empList.slice(0, 4).map(emp => (
                <div key={emp.id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl ring-1 ring-gray-100">
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                    {emp.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate">{emp.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 truncate">{emp.role || emp.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <EnterpriseTable
        data={empList}
        keyExtractor={(emp) => emp.id!}
        searchable
        searchKeys={['name', 'role', 'email', 'department']}
        searchPlaceholder="بحث باسم الموظف أو القسم..."
        selectable
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        pagination
        pageSize={6}
        totalLabel="موظف"
        toolbar={
          selectedRows.size > 0 && (
            <Button size="sm" variant="danger">
              <Trash2 className="w-3.5 h-3.5" /> حذف المحدد
            </Button>
          )
        }
        columns={[
          {
            key: 'name',
            label: 'الموظف',
            render: (emp: Employee) => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center text-xs font-black shrink-0">
                  {emp.name[0]}
                </div>
                <div>
                  <p className="text-sm font-black">{emp.name}</p>
                  <p className="text-[11px] font-bold text-gray-400">{emp.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'role',
            label: 'المسمى',
            className: 'w-28',
            render: (emp: Employee) => (
              <span className="text-sm font-bold text-gray-600">{emp.role || '—'}</span>
            ),
          },
          {
            key: 'department',
            label: 'القسم',
            className: 'w-28',
            render: (emp: Employee) => (
              <Badge variant="neutral">{emp.department}</Badge>
            ),
          },
          {
            key: 'permissions',
            label: 'الصلاحية',
            className: 'w-40',
            render: (emp: Employee) => (
              <div className="flex flex-wrap gap-1">
                {typeof emp.permissions === 'string' ? (
                  <Badge variant={emp.permissions === 'full' ? 'success' : 'info'} size="sm">
                    {emp.permissions === 'full' ? 'صلاحية كاملة' : 'صلاحية محدودة'}
                  </Badge>
                ) : (
                  <>
                    {emp.permissions.addItems && <Badge variant="neutral" size="sm">إضافة أصناف</Badge>}
                    {emp.permissions.deleteInvoices && <Badge variant="neutral" size="sm">حذف فواتير</Badge>}
                    {emp.permissions.editPrices && <Badge variant="neutral" size="sm">تعديل أسعار</Badge>}
                    {!emp.permissions.addItems && !emp.permissions.deleteInvoices && !emp.permissions.editPrices && (
                      <span className="text-[10px] text-gray-400">صلاحية مخصصة</span>
                    )}
                  </>
                )}
              </div>
            ),
          },
        ]}
        rowActions={(emp: Employee) => (
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
              <Shield className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); emp.id && onConfirmDelete('employee', emp.id); }}
              className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors text-gray-300 hover:text-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />
    </div>
  );
}
