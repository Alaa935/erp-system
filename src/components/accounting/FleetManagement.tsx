import React from 'react';
import { motion } from 'motion/react';
import { 
  Truck, 
  Plus, 
  ShieldCheck, 
  Wrench, 
  Fuel, 
  ChevronRight,
  ArrowDownRight
} from 'lucide-react';
import { Vehicle, FinancialTransaction } from '../../db/db';
import { cn, formatDate } from '../../lib/utils';

interface FleetManagementProps {
  vehicles: Vehicle[] | undefined;
  transactions: FinancialTransaction[] | undefined;
  onAddVehicle: () => void;
  onAddExpense: (vehicle: Vehicle) => void;
  onViewStatement: (vehicleId: number) => void;
}

export const FleetManagement = ({
  vehicles,
  transactions,
  onAddVehicle,
  onAddExpense,
  onViewStatement
}: FleetManagementProps) => {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {vehicles?.map(vehicle => (
           <div 
            key={vehicle.id} 
            onClick={() => onViewStatement(vehicle.id!)}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 group cursor-pointer hover:border-black transition-all"
           >
              <div className="flex justify-between items-start">
                 <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-black group-hover:text-white transition-colors">
                    <Truck className="w-6 h-6" />
                 </div>
                 <span className={cn(
                   "text-[10px] px-2 py-1 rounded-full font-black",
                   vehicle.status === 'active' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                 )}>
                   {vehicle.status === 'active' ? 'نشطة' : 'في الصيانة'}
                 </span>
              </div>
              <div>
                 <h3 className="text-lg font-black text-black">{vehicle.name}</h3>
                 <p className="text-xs text-gray-500 font-bold">{vehicle.plateNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <div className="p-2 bg-gray-50 rounded-xl text-[10px] space-y-1">
                    <p className="text-gray-400 flex items-center gap-1 font-bold"><ShieldCheck className="w-3 h-3" /> الرخص</p>
                    <p className="font-black">{formatDate(vehicle.licenseExpiry)}</p>
                 </div>
                 <div className="p-2 bg-gray-50 rounded-xl text-[10px] space-y-1">
                    <p className="text-gray-400 flex items-center gap-1 font-bold"><Wrench className="w-3 h-3" /> آخر صيانة</p>
                    <p className="font-black">{formatDate(vehicle.lastMaintenance)}</p>
                 </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onAddExpense(vehicle); }}
                className="w-full py-2 bg-gray-50 group-hover:bg-black group-hover:text-white rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-2"
              >
                <Fuel className="w-3 h-3" />
                إضافة مصاريف تشغيل
              </button>
           </div>
         ))}
         <button 
           onClick={onAddVehicle}
           className="border-2 border-dashed border-gray-200 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-black transition-all group min-h-[240px]"
         >
            <div className="p-3 bg-gray-50 rounded-full group-hover:bg-black group-hover:text-white transition-all"><Plus className="w-6 h-6" /></div>
            <span className="text-xs font-black">إضافة سيارة جديدة</span>
         </button>
      </div>
    </motion.div>
  );
};
