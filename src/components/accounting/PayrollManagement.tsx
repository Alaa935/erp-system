import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  CheckCircle2, 
  Coins, 
  Gift, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Employee, EmployeePayroll } from '../../db/db';
import { cn } from '../../lib/utils';

interface PayrollManagementProps {
  payrolls: EmployeePayroll[] | undefined;
  employees: Employee[] | undefined;
  onEdit: (payroll: EmployeePayroll) => void;
  onPay: (payroll: EmployeePayroll) => void;
  onViewStatement: (employeeId: number) => void;
}

export const PayrollManagement = ({
  payrolls,
  employees,
  onEdit,
  onPay,
  onViewStatement
}: PayrollManagementProps) => {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
         <table className="w-full text-right border-collapse">
            <thead>
               <tr className="bg-gray-50">
                  <th className="p-4 text-xs font-black text-gray-400">اسم الموظف</th>
                  <th className="p-4 text-xs font-black text-gray-400">المرتب الأساسي</th>
                  <th className="p-4 text-xs font-black text-gray-400">سلف / مستحقات</th>
                  <th className="p-4 text-xs font-black text-gray-400">مكافآت / خصومات</th>
                  <th className="p-4 text-xs font-black text-gray-400">صافي المستحق</th>
                  <th className="p-4 text-xs font-black text-gray-400">إجراءات</th>
               </tr>
            </thead>
            <tbody className="divide-y">
               {payrolls?.map(pr => {
                  const employee = employees?.find(e => e.id === pr.employeeId);
                  const net = pr.baseSalary + pr.bonuses - pr.advances - pr.deductions;
                  return (
                    <tr 
                      key={pr.id} 
                      className="hover:bg-gray-50 group cursor-pointer" 
                      onClick={() => onViewStatement(pr.employeeId)}
                    >
                       <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black",
                              pr.status === 'paid' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                            )}>
                              {pr.status === 'paid' ? <CheckCircle2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-black group-hover:text-blue-600 transition-colors">{employee?.name}</p>
                              <p className="text-[9px] text-gray-400 font-bold">{employee?.role}</p>
                            </div>
                          </div>
                       </td>
                       <td className="p-4 text-sm font-bold">{pr.baseSalary.toLocaleString()} ج.م</td>
                       <td className="p-4 text-xs font-bold text-red-600">-{pr.advances.toLocaleString()}</td>
                       <td className="p-4 text-xs font-bold text-green-600">+{pr.bonuses.toLocaleString()}</td>
                       <td className="p-4 text-sm font-black text-black">
                          {net.toLocaleString()} ج.م
                          {pr.status === 'paid' && (
                            <span className="mr-2 text-[9px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full">تم الصرف</span>
                          )}
                       </td>
                       <td className="p-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1 text-left">
                             <button 
                               onClick={() => onEdit(pr)}
                               disabled={pr.status === 'paid'}
                               className={cn(
                                 "p-2 rounded-lg transition-colors",
                                 pr.status === 'paid' ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 text-blue-600"
                               )}
                               title="تعديل السلفة والمكافآت"
                             >
                                <Coins className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => onPay(pr)}
                               disabled={pr.status === 'paid'}
                               className={cn(
                                 "p-2 rounded-lg transition-all",
                                 pr.status === 'paid' ? "text-gray-300 bg-gray-50 cursor-not-allowed" : "hover:bg-green-50 text-green-600 active:scale-95"
                               )}
                               title={pr.status === 'paid' ? "تم الصرف" : "صرف المرتب"}
                             >
                                <Gift className={cn("w-4 h-4", pr.status === 'paid' ? "opacity-50" : "")} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  )
               })}
               {(!payrolls || payrolls.length === 0) && (
                 <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic text-sm">لا توجد سجلات رواتب مسجلة لهذا الشهر</td></tr>
               )}
            </tbody>
         </table>
      </div>
    </motion.div>
  );
};
