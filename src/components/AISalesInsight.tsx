import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Item, SalesOrder } from '../types';
import { useInventory } from '../hooks/useInventory';
import { useSalesOrders } from '../hooks/useSalesOrders';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiKeyManager } from '../lib/apiKeys';

export default function AISalesInsight() {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useInventory();
  const sales = useSalesOrders();

  const getAIInsight = async () => {
    if (!items?.data?.items || !sales?.data?.orders) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = await apiKeyManager.getGeminiKey();

      if (!apiKey) {
        setError("مفتاح API الخاص بـ Gemini غير متوفر. يرجى إعداده في الإعدادات.");
        setLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const itemsSnapshot = items.data.items.map(i => ({ 
        name: i.name, 
        qty: i.quantity, 
        min: i.minQuantity,
        price: i.sellingPrice 
      }));
      
      const salesSnapshot = sales.data.orders.slice(-10).map(s => ({ 
        date: new Date(s.date).toLocaleDateString(), 
        total: s.totalAmount 
      }));

      const prompt = `
        بصفتك محلل أعمال ذكي لنظام إدارة مستودعات (WMS)، قم بتحليل البيانات التالية وقدم 3 نصائح استراتيجية قصيرة ومباشرة باللغة العربية:
        
        المخزون الحالي: ${JSON.stringify(itemsSnapshot)}
        آخر المبيعات: ${JSON.stringify(salesSnapshot)}
        
        ركز على:
        1. أصناف حرجة يجب طلبها فوراً.
        2. تحليل بسيط للنمو أو التراجع في المبيعات.
        3. نصيحة لتحسين الأرباح.
        
        اجعل الإجابة بتنسيق Markdown بسيط مع رموز تعبيرية (Emojis).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setInsight(response.text || "لا تتوفر نصائح حالياً.");
    } catch (err) {
      console.error(err);
      setError("عذراً، فشل الاتصال بمحلل الذكاء الاصطناعي.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (items?.data?.items && sales?.data?.orders && !insight && !loading) {
      getAIInsight();
    }
  }, [items, sales]);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/20 blur-3xl -mr-10 -mt-10 rounded-full" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-indigo-900">محلل الذكاء الاصطناعي</h3>
        </div>
        <button 
          onClick={getAIInsight}
          disabled={loading}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
        >
          {loading ? 'جاري التحليل...' : 'تحديث التحليل'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 gap-3"
          >
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-indigo-400 font-bold">جاري تحليل البيانات المخزنية المتقدمة...</p>
          </motion.div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-lg"
          >
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-bold">{error}</p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-sm max-w-none text-indigo-900"
          >
            <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {insight}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="mt-4 pt-4 border-t border-indigo-50 flex justify-between items-center text-[10px] text-indigo-300 font-bold">
        <span>مدعوم بواسطة Gemini 3 Flash</span>
        <span>آخر تحليل مؤتمت: {new Date().toLocaleTimeString('ar-EG')}</span>
      </div>
    </div>
  );
}
