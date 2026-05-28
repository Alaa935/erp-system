import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Bell, User, Warehouse, LogOut, UserCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { UserAccount } from '../../types';

interface HeaderProps {
  currentUser: UserAccount | null;
  unreadCount: number;
  onMenuToggle: () => void;
  onNotificationsToggle: () => void;
  onLogout: () => void;
  onNavigate?: (page: string) => void;
}

export function Header({ currentUser, unreadCount, onMenuToggle, onNotificationsToggle, onLogout, onNavigate }: HeaderProps) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setDropdownOpen(false); };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isDropdownOpen]);

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100/80 h-16 flex items-center justify-between px-4 md:px-6 shrink-0 z-40 sticky top-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <button onClick={onMenuToggle} className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-150 active:scale-95">
          <Menu className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center shadow-sm">
            <Warehouse className="text-white w-5 h-5" />
          </div>
          <span className="font-black text-sm hidden sm:block">المخازن المصرية</span>
        </div>

        <div className="relative max-w-sm w-full hidden md:block">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="بحث..." className="w-full bg-gray-100/80 border border-transparent rounded-xl py-2 pr-10 pl-4 text-sm outline-none focus:border-gray-200 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] transition-all duration-150" />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full ring-1 ring-emerald-200/50">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-bold text-emerald-700">متصل</span>
        </div>

        <div className="relative">
          <button onClick={onNotificationsToggle} className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-150 relative active:scale-95">
            <Bell className="w-5 h-5 text-gray-500" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />}
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200 hidden xs:block" />

        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-all duration-150 active:scale-95">
            <div className="text-left hidden md:block">
              <p className="text-sm font-bold text-black">{currentUser?.username}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{currentUser?.role}</p>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl border-2 border-gray-100 overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden"
              >
                <div className="p-2">
                  <div className="px-3 py-2.5 border-b border-gray-50 mb-1">
                    <p className="text-sm font-bold text-black">{currentUser?.username}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{currentUser?.role}</p>
                  </div>

                  <button onClick={() => { setDropdownOpen(false); onNavigate?.('profile'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold text-gray-700 group">
                    <UserCircle className="w-4.5 h-4.5 text-gray-400 group-hover:text-black transition-colors" />
                    <span>بيانات الحساب</span>
                  </button>

                  <div className="h-px bg-gray-50 my-1" />

                  <button onClick={() => { setDropdownOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all text-sm font-bold text-red-600 group">
                    <LogOut className="w-4.5 h-4.5 text-red-400 group-hover:text-red-600 transition-colors" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}