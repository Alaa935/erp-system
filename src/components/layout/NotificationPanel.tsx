import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, AlertCircle, CheckCircle2, Info, Clock } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import type { AppNotification } from '../../types';

interface NotificationPanelProps {
  isOpen: boolean;
  notifications: AppNotification[] | undefined;
  unreadCount: number;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, notifications, unreadCount, onClose }: NotificationPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[#E0E3E5] z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-[#E0E3E5] flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-black">الإشعارات</h3>
              <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full">{unreadCount} جديد</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {notifications && notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-4 border-b border-[#E0E3E5] last:border-0 hover:bg-[#F2F4F6] transition-colors cursor-pointer",
                      !n.read && "bg-blue-50/30"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center",
                        n.type === 'warning' ? "bg-orange-100 text-orange-600" :
                        n.type === 'success' ? "bg-green-100 text-green-600" :
                        n.type === 'error' ? "bg-red-100 text-red-600" :
                        "bg-blue-100 text-blue-600"
                      )}>
                        {n.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                         n.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                         n.type === 'info' ? <Info className="w-4 h-4" /> :
                         <Bell className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-black mb-0.5">{n.title}</p>
                        <p className="text-[12px] text-[#44474D] leading-relaxed mb-2">{n.message}</p>
                        <div className="flex items-center gap-1 text-[10px] text-[#44474D] opacity-60">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(n.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-[#44474D] opacity-50">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">لا توجد إشعارات حالياً</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-gray-50/50 border-t border-[#E0E3E5] text-center">
              <button onClick={onClose} className="text-[12px] font-bold text-black hover:underline">
                إغلاق
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
