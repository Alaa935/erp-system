import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Warehouse, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
}

interface SidebarProps {
  items: SidebarItem[];
  activePage: string;
  isOpen: boolean;
  isMobileOpen: boolean;
  onNavigate: (id: string) => void;
  onToggle: () => void;
  onMobileClose: () => void;
  storageUsed?: number;
}

export default function Sidebar({
  items,
  activePage,
  isOpen,
  isMobileOpen,
  onNavigate,
  onToggle,
  onMobileClose,
  storageUsed = 72,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-black flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <Warehouse className="text-black w-5 h-5" />
                  </div>
                  <h1 className="font-black text-white text-lg">المخازن المصرية</h1>
                </div>
                <button onClick={onMobileClose} className="p-2 text-white/60 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 mt-4 overflow-y-auto overflow-x-hidden no-scrollbar">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onMobileClose();
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/10 relative",
                      activePage === item.id ? "bg-white/10 text-white border-l-4 border-white" : "text-white/60"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-[15px] font-medium flex-1 text-right">{item.label}</span>
                    {item.badge != null && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "bg-[#000000] text-white transition-all duration-300 flex flex-col z-50 hidden lg:flex shrink-0 relative group/sidebar",
          isOpen ? "w-64" : "w-20"
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -left-3 top-16 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow z-10 opacity-0 group-hover/sidebar:opacity-100"
        >
          <motion.div
            animate={{ rotate: isOpen ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <X className="w-3 h-3 text-black" />
          </motion.div>
        </button>

        {/* Logo/Header */}
        <div className="p-6 flex items-center gap-3 overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          >
            <Warehouse className="text-black w-6 h-6" />
          </motion.div>
          <motion.div
            animate={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap"
          >
            <h1 className="font-black text-lg">المخازن المصرية</h1>
            <p className="text-[10px] opacity-70">نظام إدارة المستودعات الذكي</p>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-4 overflow-y-auto overflow-x-hidden no-scrollbar px-3 space-y-1">
          {items.map((item) => {
            const isActive = activePage === item.id;
            return (
              <div key={item.id} className="relative group/nav">
                <button
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 relative overflow-hidden",
                    isActive
                      ? "bg-white/10 text-white shadow-lg"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  {/* Active Glow Background */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-glow"
                      className="absolute inset-0 bg-gradient-to-l from-white/10 to-transparent rounded-xl"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <span className={cn(
                    "relative z-10 transition-transform group-hover/nav:scale-110",
                    isOpen ? "shrink-0" : "mx-auto"
                  )}>
                    <item.icon className={cn(
                      "w-5 h-5 transition-all",
                      isActive ? "text-white" : "text-white/50 group-hover/nav:text-white"
                    )} />
                  </span>

                  {/* Label */}
                  {isOpen && (
                    <span className="relative z-10 text-[14px] font-medium flex-1 text-right truncate">
                      {item.label}
                    </span>
                  )}

                  {/* Badge */}
                  {isOpen && item.badge != null && item.badge > 0 && (
                    <span className="relative z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip when collapsed */}
                  {!isOpen && (
                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-2xl opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none">
                      {item.label}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-4 border-transparent border-r-gray-900" />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Storage Usage */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-4"
            >
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white/70 text-[11px] font-medium">مساحة التخزين</p>
                  <span className="text-white text-[10px] font-bold">{storageUsed}%</span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${storageUsed}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="bg-white h-full rounded-full"
                  />
                </div>
                <p className="text-white/40 text-[9px] mt-2">مستخدم من السعة الإجمالية</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed storage indicator */}
        {!isOpen && (
          <div className="p-4 flex justify-center">
            <div className="w-1 h-12 bg-white/20 rounded-full overflow-hidden">
              <div className="bg-white/60 w-full h-[72%] rounded-full" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
