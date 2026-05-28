import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { SalesOrder, SystemConfig, TaxConfig } from '../types';
import { useCustomer } from '../hooks/useCustomers';
import { useSystemConfig } from '../hooks/useSystemConfig';
import { useTaxes } from '../hooks/useTaxes';
import { formatCurrency, formatDate } from '../lib/utils';
import { toast } from 'sonner';

interface SalesInvoiceModalProps {
  order: SalesOrder;
  onClose: () => void;
}

const DEFAULT_CONFIG: SystemConfig = {
  id: 'default',
  companyName: 'المخازن المصرية المتحدة',
  taxId: '123-456-789',
  phone: '01012345678',
  address: 'القاهرة، مصر',
  vatRate: 14,
  email: '',
  crNumber: '',
  currency: 'EGP',
  language: 'ar',
  invoicePrefix: 'INV-',
  invoiceNextNumber: 1,
  defaultDiscount: 0,
  qrCodeEnabled: true,
  paperSize: 'A4',
  theme: 'light',
  fontSize: 'medium',
  layout: 'sidebar',
  whatsappNotifications: false,
  emailNotifications: false,
  lowStockAlerts: true,
  minStockLevel: 10,
  trackingSystem: 'none',
};

export default function SalesInvoiceModal({ order, onClose }: SalesInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { data: customerData } = useCustomer(order.customerId);
  const { data: configData } = useSystemConfig();
  const { data: taxesData } = useTaxes();

  const customer = customerData?.data;
  const config = configData?.data || DEFAULT_CONFIG;
  const tax = taxesData?.data?.find((t: TaxConfig) => t.id === order.taxId);

  const orderItems = order.items.map(oi => ({
    ...oi,
    name: (oi as any).name || 'صنف محذوف',
    sku: (oi as any).sku || '-',
  }));

  const subtotal = order.subtotal || (order.totalAmount - (order.taxAmount || 0));
  const vatAmount = order.taxAmount || 0;
  const taxRate = tax?.rate || config.vatRate;
  const taxName = tax?.name || 'ضريبة القيمة المضافة';

  const verifyUrl = `${window.location.origin}/#/invoice/${encodeURIComponent(order.orderNumber)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (!customer) {
      toast.error('لم يتم العثور على بيانات العميل للمشاركة');
      return;
    }

    const itemsText = orderItems.map(item => `${item.name} (${item.quantity} × ${item.price})`).join('\n');
    const text = `*فاتورة ضريبية من ${config.companyName}*\n` +
                 `---------------------------\n` +
                 `رقم الفاتورة: ${order.orderNumber}\n` +
                 `التاريخ: ${formatDate(order.date)}\n` +
                 `العميل: ${customer.name}\n` +
                 `---------------------------\n` +
                 `${itemsText}\n` +
                 `---------------------------\n` +
                 `الإجمالي شامل الضريبة: ${formatCurrency(order.totalAmount)}\n` +
                 `المبلغ المدفوع: ${formatCurrency(order.paidAmount)}\n` +
                 `المبلغ المتبقي: ${formatCurrency(order.totalAmount - (order.paidAmount || 0))}\n\n` +
                 `للتحقق: ${verifyUrl}\n\n` +
                 `شكراً لتعاملكم معنا!`;

    const whatsappUrl = `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl overflow-hidden no-print-overlay" dir="rtl">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col print-invoice shadow-none"
      >
        <div className="p-6 border-b bg-gray-50 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">معاينة الفاتورة الإلكترونية</h3>
              <p className="text-xs text-gray-500 font-bold">{order.orderNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
            >
              <Share2 className="w-4 h-4" />
              واتساب
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 no-scrollbar bg-white shadow-none printable-content" ref={invoiceRef}>
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-12 border-b-2 border-black pb-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-black">{config.companyName}</h1>
              <p className="font-bold text-gray-600">{config.address}</p>
              <p className="text-sm font-bold text-gray-500">الرقم الضريبي: {config.taxId}</p>
              <p className="text-sm font-bold text-gray-500">هاتف: {config.phone}</p>
            </div>
            <div className="text-left space-y-1 text-left">
              <h2 className="text-2xl font-black text-black">فاتورة ضريبية</h2>
              <p className="font-bold">رقم: {order.orderNumber}</p>
              <p className="text-gray-500 text-sm">التاريخ: {formatDate(order.date)}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h4 className="text-xs font-black text-gray-400 mb-2 uppercase tracking-wider">العميل</h4>
              <p className="text-lg font-black">{customer?.name || 'عميل مجهول'}</p>
              <p className="text-sm text-gray-600 mt-1">{customer?.address}</p>
              <p className="text-sm text-gray-600">هاتف: {customer?.phone}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h4 className="text-xs font-black text-gray-400 mb-2 uppercase tracking-wider">تفاصيل الدفع</h4>
              <p className="text-sm font-bold">حالة الدفع: <span className="font-black text-black">{order.paymentStatus === 'paid' ? 'مدفوعة' : order.paymentStatus === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة'}</span></p>
              <p className="text-sm font-bold">المبلغ المدفوع: {formatCurrency(order.paidAmount)}</p>
              {order.dueDate && <p className="text-sm font-bold text-red-600">تاريخ الاستحقاق: {formatDate(order.dueDate)}</p>}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-12 overflow-hidden rounded-2xl border border-gray-200">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-4 text-right font-bold text-sm">#</th>
                <th className="px-4 py-4 text-right font-bold text-sm">الصنف / SKU</th>
                <th className="px-4 py-4 text-center font-bold text-sm">الكمية</th>
                <th className="px-4 py-4 text-left font-bold text-sm">السعر</th>
                <th className="px-4 py-4 text-left font-bold text-sm">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-black font-bold">
              {orderItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm">{idx + 1}</td>
                  <td className="px-4 py-4">
                    <p className="font-black text-sm">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.sku}</p>
                  </td>
                  <td className="px-4 py-4 text-center">{item.quantity}</td>
                  <td className="px-4 py-4 text-left">{formatCurrency(item.price)}</td>
                  <td className="px-4 py-4 text-left font-black">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals & QR Code */}
          <div className="flex justify-between items-end border-t-2 border-dashed border-gray-200 pt-8 mt-12">
            <div className="flex flex-col items-center gap-2">
              <QRCodeSVG value={verifyUrl} size={150} level="M" includeMargin={true} />
              <p className="text-[10px] font-black text-gray-400">امسح للتحقق من الفاتورة</p>
            </div>

            <div className="w-80 space-y-3">
              <div className="flex justify-between text-gray-600 font-bold">
                <span>المبلغ الخاضع للضريبة:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-bold">
                <span>{taxName} ({taxRate}%):</span>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-black text-black pt-4 border-t border-gray-100">
                <span>الإجمالي شامل الضريبة:</span>
                <span className="text-2xl">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-400 font-bold">
            <p>شكراً لتعاملكم معنا!</p>
            <p>تم إصدار هذه الفاتورة إلكترونياً وهي معتمدة من قبل السنبوسي جروب.</p>
          </div>
        </div>
      </motion.div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .printable-content, .printable-content * {
            visibility: visible !important;
          }
          .printable-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            padding: 20px !important;
            margin: 0 !important;
            background: white !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
