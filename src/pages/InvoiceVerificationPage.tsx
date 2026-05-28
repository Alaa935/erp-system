import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Warehouse, Printer, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { useSalesOrders } from '../hooks/useSalesOrders';
import { useSystemConfig } from '../hooks/useSystemConfig';
import { useCustomers } from '../hooks/useCustomers';
import { useInventory } from '../hooks/useInventory';
import type { SalesOrder, SystemConfig, Customer, Item } from '../types';

interface Props {
  invoiceNumber: string;
  onClose?: () => void;
}

export default function InvoiceVerificationPage({ invoiceNumber, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const { data: ordersRes } = useSalesOrders({ search: invoiceNumber, pageSize: 1 } as any);
  const { data: sysRes } = useSystemConfig();
  const { data: customersRes } = useCustomers();
  const { data: itemsRes } = useInventory();

  const order = (ordersRes as any)?.orders?.[0] ?? undefined;
  const systemConfig = (sysRes as any)?.data;
  const customers = (customersRes as any)?.items ?? [];
  const items = (itemsRes as any)?.items ?? [];

  if (order === undefined) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center p-6" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto animate-pulse" />
          <p className="text-gray-500 font-bold">جاري التحقق من الفاتورة...</p>
        </div>
      </div>
    );
  }

  if (!order || order.deletedAt) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center p-6" dir="rtl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black">الفاتورة غير موجودة</h1>
          <p className="text-gray-500 font-bold">
            لا توجد فاتورة بهذا الرقم
          </p>
          <p className="text-sm text-gray-400 font-bold">{invoiceNumber}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black hover:opacity-90 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              عودة
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  const customer = customers?.find((c: Customer) => c.id === order.customerId);
  const config: SystemConfig = systemConfig || {
    companyName: 'المخازن المصرية المتحدة',
    taxId: '123-456-789',
    phone: '01012345678',
    address: 'القاهرة، مصر',
    vatRate: 14,
  } as SystemConfig;

  const orderItems = order.items.map((oi: { itemId: number; quantity: number; price: number; total: number }) => {
    const item = items?.find((i: Item) => i.id === oi.itemId);
    return { ...oi, name: item?.name || 'صنف محذوف', sku: item?.sku || '-' };
  });

  const subtotal = order.subtotal || (order.totalAmount - (order.taxAmount || 0));
  const vatAmount = order.taxAmount || 0;
  const isCancelled = order.status === 'cancelled';

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-[#F7F9FB]" dir="rtl">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black">التحقق من الفاتورة</h1>
                <p className="text-xs text-gray-500 font-bold">{invoiceNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
              >
                <Printer className="w-4 h-4" />
                طباعة
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  عودة
                </button>
              )}
            </div>
          </div>

          <div ref={printRef} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-10">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div className="space-y-1">
                  <h2 className="text-2xl md:text-3xl font-black text-black">{config.companyName}</h2>
                  <p className="font-bold text-gray-600">{config.address}</p>
                  <p className="text-sm font-bold text-gray-500">الرقم الضريبي: {config.taxId}</p>
                  <p className="text-sm font-bold text-gray-500">هاتف: {config.phone}</p>
                </div>
                <div className="text-right space-y-2">
                  <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black ${
                    isCancelled
                      ? 'bg-red-50 text-red-600'
                      : 'bg-green-50 text-green-700'
                  }`}>
                    {isCancelled ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {isCancelled ? 'ملغاة' : 'فاتورة موثقة'}
                  </span>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-black">فاتورة ضريبية</h3>
                    <p className="font-bold">رقم: {order.orderNumber}</p>
                    <p className="text-gray-500 text-sm">التاريخ: {formatDate(order.date)}</p>
                    <p className="text-gray-500 text-sm">
                      الحالة: {order.status === 'shipped' ? 'تم الشحن' : order.status === 'delivered' ? 'تم التسليم' : order.status === 'cancelled' ? 'ملغاة' : 'قيد الانتظار'}
                    </p>
                  </div>
                </div>
              </div>

              {isCancelled && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <p className="font-black text-red-700 text-sm">تم إلغاء هذه الفاتورة</p>
                    {order.deleteReason && (
                      <p className="text-xs text-red-500 mt-1">السبب: {order.deleteReason}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 mb-8">
                <div className="bg-gray-50 p-5 md:p-6 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-black text-gray-400 mb-2 uppercase tracking-wider">العميل</h4>
                  <p className="text-base md:text-lg font-black">{customer?.name || 'عميل مجهول'}</p>
                  <p className="text-sm text-gray-600 mt-1">{customer?.address}</p>
                  <p className="text-sm text-gray-600">هاتف: {customer?.phone}</p>
                </div>
                <div className="bg-gray-50 p-5 md:p-6 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-black text-gray-400 mb-2 uppercase tracking-wider">تفاصيل الدفع</h4>
                  <p className="text-sm font-bold">
                    حالة الدفع:{' '}
                    <span className="font-black text-black">
                      {order.paymentStatus === 'paid' ? 'مدفوعة' : order.paymentStatus === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة'}
                    </span>
                  </p>
                  <p className="text-sm font-bold">المبلغ المدفوع: {formatCurrency(order.paidAmount)}</p>
                  {order.dueDate && (
                    <p className="text-sm font-bold text-red-600">تاريخ الاستحقاق: {formatDate(order.dueDate)}</p>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto mb-8">
                <table className="w-full border-collapse rounded-2xl overflow-hidden border border-gray-200">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-right font-bold text-xs md:text-sm">#</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-right font-bold text-xs md:text-sm">الصنف / SKU</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-center font-bold text-xs md:text-sm">الكمية</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left font-bold text-xs md:text-sm">السعر</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left font-bold text-xs md:text-sm">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-black font-bold">
                    {orderItems.map((item: { name: string; sku: string; quantity: number; price: number; total: number }, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm">{idx + 1}</td>
                        <td className="px-3 md:px-4 py-3 md:py-4">
                          <p className="font-black text-xs md:text-sm">{item.name}</p>
                          <p className="text-[10px] text-gray-400">{item.sku}</p>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-center text-xs md:text-sm">{item.quantity}</td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm">{formatCurrency(item.price)}</td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-black">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t-2 border-dashed border-gray-200 pt-6 md:pt-8">
                <div className="flex flex-col items-end gap-3">
                  <div className="w-full sm:w-80 space-y-2 md:space-y-3">
                    <div className="flex justify-between text-gray-600 font-bold text-sm md:text-base">
                      <span>المبلغ الخاضع للضريبة:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 font-bold text-sm md:text-base">
                      <span>ضريبة القيمة المضافة ({config.vatRate}%):</span>
                      <span>{formatCurrency(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-base md:text-xl font-black text-black pt-4 border-t border-gray-100">
                      <span>الإجمالي شامل الضريبة:</span>
                      <span className="text-xl md:text-2xl">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-100 text-center text-xs text-gray-400 font-bold space-y-1">
                <p>شكراً لتعاملكم معنا!</p>
                <p>تم إصدار هذه الفاتورة إلكترونياً وهي موثقة ومعتمدة.</p>
                <p className="text-[10px] text-gray-300">رمز التحقق: {invoiceNumber}-{order.id}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .min-h-screen { min-height: auto !important; }
          .max-w-4xl { max-width: 100% !important; padding: 0 !important; }
          .rounded-3xl { border-radius: 0 !important; box-shadow: none !important; }
          .bg-white { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
