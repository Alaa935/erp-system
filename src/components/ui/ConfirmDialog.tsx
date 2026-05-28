import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'تأكيد', cancelLabel = 'إلغاء',
  variant = 'danger', onConfirm, onCancel
}: ConfirmDialogProps) {
  const colors = {
    danger: { bg: 'bg-red-50', border: 'border-red-100', icon: 'bg-red-500 text-white', btn: 'bg-red-600 hover:bg-red-700', text: 'text-red-900', subtext: 'text-red-600' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'bg-amber-500 text-white', btn: 'bg-amber-600 hover:bg-amber-700', text: 'text-amber-900', subtext: 'text-amber-600' },
    info: { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'bg-blue-500 text-white', btn: 'bg-blue-600 hover:bg-blue-700', text: 'text-blue-900', subtext: 'text-blue-600' },
  }[variant];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className={`p-6 ${colors.bg} border-b ${colors.border} flex items-center gap-3`}>
              <div className={`w-12 h-12 ${colors.icon} rounded-2xl flex items-center justify-center shadow-lg`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-xl font-black ${colors.text}`}>{title}</h3>
                <p className={`text-xs font-bold ${colors.subtext}`}>{message}</p>
              </div>
              <button onClick={onCancel} className="mr-auto p-2 hover:bg-black/5 rounded-full">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-3">
                <button onClick={onConfirm} className={`flex-1 text-white py-4 rounded-2xl font-black shadow-lg transition-colors ${colors.btn}`}>
                  {confirmLabel}
                </button>
                <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black hover:bg-gray-200 transition-colors">
                  {cancelLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
