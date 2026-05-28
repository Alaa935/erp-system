import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Warehouse } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: string[];
  badge?: number | null;
}

interface SidebarProps {
  menuItems: MenuItem[];
  activePage: string;
  onNavigate: (page: string) => void;
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ menuItems, activePage, onNavigate, isSidebarOpen, isMobileMenuOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
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
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); onMobileClose(); }}
                    className={cn(
                      "w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/10 relative",
                      activePage === item.id ? "bg-white/10 text-white border-l-4 border-white" : "text-white/60"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-[15px] font-medium flex-1 text-right">{item.label}</span>
                    {item.badge && (
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
      <aside className={cn(
        "bg-[#000000] text-white transition-all duration-300 flex flex-col z-50 hidden lg:flex shrink-0",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
            <Warehouse className="text-black w-6 h-6" />
          </div>
          {isSidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="font-black text-lg whitespace-nowrap">المخازن المصرية</h1>
              <p className="text-[10px] opacity-70 whitespace-nowrap">نظام إدارة المستودعات الذكي</p>
            </div>
          )}
        </div>

        <nav className="flex-1 mt-4 overflow-y-auto overflow-x-hidden no-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/10 relative",
                activePage === item.id ? "bg-white/10 text-white border-l-4 border-white" : "text-white/60"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && (
                <>
                  <span className="text-[15px] font-medium flex-1 text-right">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {activePage === item.id && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute right-0 top-0 bottom-0 w-1 bg-white"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          {isSidebarOpen && (
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-white text-[12px] mb-2">مساحة التخزين المستخدمة</p>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white h-full w-[72%] transition-all" />
              </div>
              <p className="text-white text-[10px] mt-2 text-left">72%</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
