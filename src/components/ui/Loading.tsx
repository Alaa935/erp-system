import React from 'react';
import { motion } from 'motion/react';
import { Warehouse } from 'lucide-react';

export function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 2,
          ease: "easeInOut"
        }}
        className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
      >
        <Warehouse className="text-white w-10 h-10" />
      </motion.div>
      <h2 className="text-2xl font-black mb-2">جاري التحميل...</h2>
      <p className="text-gray-400 font-bold max-w-xs">نعمل على تجهيز النظام بأفضل سرعة ممكنة، من فضلك انتظر لحظة.</p>
      
      <div className="mt-12 w-48 bg-gray-100 h-1.5 rounded-full overflow-hidden">
        <motion.div 
          animate={{ x: [-192, 192] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="bg-black h-full w-24 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)]"
        />
      </div>
    </div>
  );
}

export function ContentLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-12 p-6 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full mb-4"
      />
      <p className="text-gray-400 font-bold">جاري عرض البيانات</p>
    </div>
  );
}
