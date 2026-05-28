import React from 'react';
import { Plus, Store, ChevronRight, MapPin, Phone, User, Building2 } from 'lucide-react';
import { Card } from '../../components/design-system/Card';
import { Badge } from '../../components/design-system/Badge';
import { Button } from '../../components/design-system/Button';
import { EnterpriseTable } from '../../components/design-system/EnterpriseTable';
import { EnterpriseEmptyState } from '../../components/design-system/EnterpriseEmptyState';
import type { Branch, Employee } from '../../types';

interface BranchSettingsProps {
  branches: Branch[] | undefined;
  employees: Employee[] | undefined;
  onAddBranch: () => void;
}

export function BranchSettings({
  branches,
  employees,
  onAddBranch
}: BranchSettingsProps) {
  const branchList = branches || [];

  if (branchList.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black">إدارة الفروع والمخازن الإقليمية</h3>
          <Button onClick={onAddBranch} icon={<Plus className="w-4 h-4" />}>إضافة فرع جديد</Button>
        </div>
        <Card padding="none">
          <EnterpriseEmptyState
            icon={
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
                <rect x="8" y="8" width="64" height="64" rx="16" fill="#F3F4F6" />
                <rect x="8" y="8" width="64" height="64" rx="16" stroke="#E5E7EB" strokeWidth="1" />
                <rect x="24" y="22" width="32" height="24" rx="4" fill="#D1D5DB" />
                <rect x="28" y="26" width="10" height="8" rx="2" fill="#E5E7EB" />
                <rect x="42" y="26" width="10" height="8" rx="2" fill="#E5E7EB" />
                <rect x="30" y="46" width="20" height="3" rx="1.5" fill="#D1D5DB" />
              </svg>
            }
            title="لا توجد فروع بعد"
            description="أضف الفروع والمخازن الإقليمية لتوزيع المخزون وإدارة العمليات"
            action={<Button onClick={onAddBranch} icon={<Plus className="w-4 h-4" />}>إضافة فرع جديد</Button>}
            tips={['يمكن ربط كل فرع بمدير مسؤول', 'المخزون مستقل بين الفروع', 'يمكن تحويل المخزون بين الفروع بسهولة']}
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
            <p className="text-xs font-bold text-gray-400">إجمالي الفروع</p>
            <Store className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{branchList.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">المديرين المعينين</p>
            <User className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{branchList.filter(b => b.managerId).length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">فروع بدون مدير</p>
            <Building2 className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{branchList.filter(b => !b.managerId).length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400">الموظفون المتاحون</p>
            <Phone className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-black">{employees?.length || 0}</p>
        </div>
      </div>

      <EnterpriseTable
        data={branchList}
        keyExtractor={(b) => b.id!}
        searchable
        searchKeys={['name', 'location', 'phone']}
        searchPlaceholder="بحث باسم الفرع أو الموقع..."
        pagination
        pageSize={6}
        totalLabel="فرع"
        columns={[
          {
            key: 'name',
            label: 'الفرع',
            render: (branch: Branch) => (
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl ring-1 ring-gray-100">
                  <Store className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-black">{branch.name}</p>
                  <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {branch.location || '—'}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: 'phone',
            label: 'رقم الهاتف',
            className: 'w-32',
            render: (branch: Branch) => (
              <span className="text-sm font-bold text-gray-600">{branch.phone || '—'}</span>
            ),
          },
          {
            key: 'managerId',
            label: 'المدير المسؤول',
            className: 'w-36',
            render: (branch: Branch) => {
              const manager = employees?.find(e => e.id === branch.managerId);
              return (
                <div className="flex items-center gap-2">
                  {manager ? (
                    <>
                      <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-[7px] font-black">
                        {manager.name[0]}
                      </div>
                      <span className="text-xs font-bold">{manager.name}</span>
                    </>
                  ) : (
                    <Badge variant="warning" size="sm">غير معين</Badge>
                  )}
                </div>
              );
            },
          },
          {
            key: 'createdAt',
            label: 'تاريخ الإضافة',
            className: 'w-28 hidden md:table-cell',
            render: (branch: Branch) => (
              <span className="text-xs font-bold text-gray-400">
                {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString('ar-EG') : '—'}
              </span>
            ),
          },
        ]}
        rowActions={(branch: Branch) => (
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-300 hover:text-gray-500">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      />
    </div>
  );
}
