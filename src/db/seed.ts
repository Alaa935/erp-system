import { db } from './schema';
import { hashPassword, isHashed } from '../lib/auth';

const DEFAULT_USERS = [
  { username: 'admin', password: 'Admin@123', role: 'admin' as const },
  { username: 'manager', password: 'Admin@123', role: 'manager' as const },
  { username: 'مدير', password: 'Admin@123', role: 'manager' as const },
  { username: 'mohamed', password: 'Admin@123', role: 'rep' as const, repId: 1 },
  { username: 'yassin', password: 'Admin@123', role: 'rep' as const, repId: 2 }
];

let seedingPromise: Promise<void> | null = null;

async function seedUsers(): Promise<void> {
  for (const u of DEFAULT_USERS) {
    const existing = await db.users.where('username').equals(u.username).first();
    const hashed = await hashPassword(u.password);
    if (existing) {
      await db.users.update(existing.id!, { password: hashed });
    } else {
      await db.users.add({ ...u, password: hashed });
    }
  }
}

export async function resetDefaultPasswords(): Promise<void> {
  const hashed = await hashPassword('Admin@123');
  for (const u of DEFAULT_USERS) {
    const existing = await db.users.where('username').equals(u.username).first();
    if (existing) {
      await db.users.update(existing.id!, { password: hashed });
    } else {
      await db.users.add({ ...u, password: hashed });
    }
  }
}

export async function seedData() {
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    try {
      const userCount = await db.users.count();
      if (userCount === 0) {
        await seedUsers();
      }

      const repCount = await db.salesReps.count();
      if (repCount === 0) {
        await db.salesReps.bulkAdd([
          { name: 'محمد محمود', phone: '01234567890', email: 'mohamed@sales.com', zone: 'القاهرة - مدينة نصر', target: 50000, currentSales: 0, commissionRate: 5, createdAt: Date.now() },
          { name: 'ياسين حسن', phone: '01511223344', email: 'yassin@sales.com', zone: 'الجيزة - الدقي', target: 40000, currentSales: 0, commissionRate: 4, createdAt: Date.now() }
        ]);
      }

      const warehouseCount = await db.warehouses.count();
      if (warehouseCount === 0) {
        await db.warehouses.bulkAdd([
          { name: 'مخزن القاهرة الرئيسي', location: 'التجمع الخامس', capacity: 10000, manager: 'م. خالد حسن' },
          { name: 'فرع الإسكندرية', location: 'برج العرب', capacity: 5000, manager: 'م. يحيى زكريا' }
        ]);
      }

      const itemCount = await db.items.count();
      if (itemCount === 0) {
        await db.suppliers.bulkAdd([
          { name: 'شركة النيل للصناعات الغذائية', contactName: 'أحمد محمود', phone: '01012345678', email: 'nile@food.com', address: 'مدينة العبور، القاهرة', createdAt: Date.now() },
          { name: 'المتحدة للاستيراد والتصدير', contactName: 'سارة حسن', phone: '01198765432', email: 'united@import.com', address: 'مصر الجديدة، القاهرة', createdAt: Date.now() }
        ]);
        const suppliers = await db.suppliers.toArray();
        await db.items.bulkAdd([
          { sku: 'SKU-001', name: 'أرز بسمتي هندي - 5كجم', category: 'مواد غذائية', purchasePrice: 200, sellingPrice: 250, quantity: 150, minQuantity: 20, location: 'ممر A - رف 01', supplierId: suppliers[0].id, createdAt: Date.now(), updatedAt: Date.now() },
          { sku: 'SKU-002', name: 'زيت سلايت عباد شمس - 1لتر', category: 'مواد غذائية', purchasePrice: 70, sellingPrice: 85, quantity: 45, minQuantity: 50, location: 'ممر B - رف 12', supplierId: suppliers[0].id, createdAt: Date.now(), updatedAt: Date.now() },
          { sku: 'SKU-003', name: 'سكر الأسرة - 1كجم', category: 'مواد غذائية', purchasePrice: 28, sellingPrice: 35, quantity: 500, minQuantity: 100, location: 'ممر A - رف 05', supplierId: suppliers[1].id, createdAt: Date.now(), updatedAt: Date.now() },
          { sku: 'SKU-004', name: 'مكرونة الملكة - 400جم', category: 'مواد غذائية', purchasePrice: 12, sellingPrice: 15, quantity: 1000, minQuantity: 200, location: 'ممر C - رف 03', supplierId: suppliers[0].id, createdAt: Date.now(), updatedAt: Date.now() }
        ]);
      }

      const repInvCount = await db.repInventory.count();
      if (repInvCount === 0) {
        await db.repInventory.bulkAdd([
          { repId: 1, itemId: 1, quantity: 3 },
          { repId: 1, itemId: 2, quantity: 15 },
          { repId: 1, itemId: 3, quantity: 2 },
          { repId: 2, itemId: 1, quantity: 20 },
        ]);
      }

      const customerCount = await db.customers.count();
      if (customerCount === 0) {
        await db.customers.bulkAdd([
          { name: 'سوبر ماركت الياسمين', phone: '01001122334', email: 'yas@shop.com', address: 'ميدان الحجاز، مصر الجديدة', loyaltyPoints: 150, createdAt: Date.now() },
          { name: 'أسواق الفتح', phone: '01122334455', email: 'fath@shop.com', address: 'شارع الهرم، الجيزة', loyaltyPoints: 85, createdAt: Date.now() }
        ]);
      }

      const purchaseOrderCount = await db.purchaseOrders.count();
      if (purchaseOrderCount === 0) {
        const suppliers = await db.suppliers.toArray();
        if (suppliers.length > 0) {
          await db.purchaseOrders.add({
            orderNumber: 'PO-2024-001', supplierId: suppliers[0].id!,
            items: [{ itemId: 1, quantity: 100, price: 250 }], totalAmount: 25000,
            status: 'received', paymentStatus: 'paid', paidAmount: 25000, date: Date.now() - 86400000
          });
        }
      }

      const notificationCount = await db.notifications.count();
      if (notificationCount === 0) {
        await db.notifications.bulkAdd([
          { title: 'مخزون منخفض', message: 'صنف أرز بسمتي هندي وصل للحد الأدنى (20)', type: 'warning', read: false, date: Date.now() },
          { title: 'فاتورة توريد جديد', message: 'تم استلام فاتورة التوريد INV-SUP-2024-001 بنجاح', type: 'success', read: false, date: Date.now() - 3600000 },
          { title: 'تحديث النظام', message: 'نسخة النظام v3.0 تعمل الآن بجميع المميزات الجديدة', type: 'info', read: true, date: Date.now() - 86400000 }
        ]);
      }

      const employeeCount = await db.employees.count();
      if (employeeCount === 0) {
        await db.employees.bulkAdd([
          { name: 'أحمد علي', role: 'موظف مستودع', department: 'المستودعات', email: 'ahmed@company.com', permissions: 'limited' },
          { name: 'سارة ياسين', role: 'مدير قسم التوريدات', department: 'التوريدات', email: 'sara@company.com', permissions: 'full' }
        ]);
      }

      const transactionCount = await db.transactions.count();
      if (transactionCount === 0) {
        const purchaseOrders = await db.purchaseOrders.toArray();
        await db.transactions.bulkAdd([
          { type: 'income', category: 'sale', amount: 25000, description: 'مبيعات نقدية - دفعة أولى', date: Date.now() - 172800000 },
          { type: 'expense', category: 'purchase', amount: 15000, description: 'شراء بضاعة PO-2024-001', referenceId: purchaseOrders[0]?.id, date: Date.now() - 86400000 },
          { type: 'expense', category: 'rent', amount: 5000, description: 'إيجار المخزن الرئيسي للشهر الحالي', date: Date.now() - 432000000 }
        ]);
      }

      const settingsCount = await db.settings.count();
      if (settingsCount === 0) {
        await db.settings.add({ id: 'capital', value: 1000000 });
      }

      const vehicleCount = await db.vehicles.count();
      if (vehicleCount === 0) {
        await db.vehicles.bulkAdd([
          { name: 'CHEVROLET T-SERIES', plateNumber: 'أ ب ج 1234', purchaseDate: Date.now() - 31536000000, purchaseValue: 450000, licenseExpiry: Date.now() + 86400000 * 180, insuranceExpiry: Date.now() + 86400000 * 90, lastMaintenance: Date.now() - 2592000000, status: 'active' },
          { name: 'MITSUBISHI CANTER', plateNumber: 'س ص ع 5678', purchaseDate: Date.now() - 15768000000, purchaseValue: 600000, licenseExpiry: Date.now() + 86400000 * 30, insuranceExpiry: Date.now() + 86400000 * 60, lastMaintenance: Date.now() - 5184000000, status: 'active' }
        ]);
      }

      const employees = await db.employees.toArray();
      const payrollCount = await db.employeePayroll.count();
      if (payrollCount === 0 && employees.length > 0) {
        await db.employeePayroll.bulkAdd([
          { employeeId: employees[0].id!, baseSalary: 8000, advances: 500, bonuses: 200, deductions: 0, month: new Date().setHours(0, 0, 0, 0) },
          { employeeId: employees[1].id!, baseSalary: 6500, advances: 0, bonuses: 0, deductions: 100, month: new Date().setHours(0, 0, 0, 0) }
        ]);
      }

      const systemConfigCount = await db.systemConfig.count();
      if (systemConfigCount === 0) {
        await db.systemConfig.add({
          id: 'default', companyName: 'المخازن المصرية المتحدة', phone: '01012345678', email: 'info@wms-egypt.com',
          taxId: '123-456-789', crNumber: '998877', address: 'القاهرة، مصر', currency: 'ج.م', language: 'ar',
          invoicePrefix: 'INV-', invoiceNextNumber: 1001, vatRate: 14, defaultDiscount: 0, qrCodeEnabled: true,
          paperSize: 'A4', theme: 'light', fontSize: 'medium', layout: 'sidebar', whatsappNotifications: true,
          emailNotifications: true, lowStockAlerts: true, minStockLevel: 20, trackingSystem: 'batch'
        });
      }
    } catch (err) {
      console.error('[seedData] Seeding error:', err);
    } finally {
      seedingPromise = null;
    }
  })();

  return seedingPromise;
}
