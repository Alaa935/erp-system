import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuickActionsProps {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (page: string) => void;
}

const ACTIONS = [
  { id: 'inventory', label: 'إضافة صنف', color: 'hover:bg-blue-50 text-blue-600' },
  { id: 'supplier-invoices', label: 'فاتورة توريد جديد', color: 'hover:bg-green-50 text-green-600' },
  { id: 'suppliers', label: 'إضافة مورد', color: 'hover:bg-orange-50 text-orange-600' },
];

export function QuickActions({ isOpen, onToggle, onNavigate }: QuickActionsProps) {
  return (
    <div className="fixed bottom-24 left-8 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="absolute bottom-16 left-0 mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-[#E0E3E5] overflow-hidden p-2 space-y-1"
          >
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => { onNavigate(action.id); onToggle(); }}
                className={cn(
                  "w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-between",
                  action.color
                )}
              >
                {action.label}
                <Plus className="w-3 h-3" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={onToggle}
        className={cn(
          "bg-black text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all",
          isOpen ? "rotate-45 bg-red-500" : "hover:scale-110 active:scale-95"
        )}
      >
        <Plus className={cn("w-6 h-6 transition-transform", isOpen && "rotate-0")} />
      </button>
    </div>
  );
}
