import { PrismaClient, UserRole } from '@prisma/client';
import Decimal from 'decimal.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  // Create default users
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: hashedPassword, role: 'admin' as UserRole, nationalId: '00000000000000' },
  });

  await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: { username: 'manager', password: hashedPassword, role: 'manager' as UserRole },
  });

  // Create default system config
  await prisma.systemConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'شركة المتحدة للمخازن المصرية',
      phone: '01000000000',
      email: 'info@united-warehouses.com',
      taxId: '000-000-000',
      crNumber: '000000',
      address: 'القاهرة، مصر',
    },
  });

  // Create default invoice settings
  await prisma.invoiceSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', companyName: 'شركة المتحدة للمخازن المصرية', managedBy: 'الإدارة' },
  });

  // Create default sales reps
  const rep1 = await prisma.salesRep.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'أحمد محمد', phone: '01111111111', email: 'ahmed@example.com', zone: 'القاهرة', target: 100000, commissionRate: 5 },
  });

  const rep2 = await prisma.salesRep.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'محمود علي', phone: '01222222222', email: 'mahmoud@example.com', zone: 'الجيزة', target: 80000, commissionRate: 5 },
  });

  // Create rep user
  await prisma.user.upsert({
    where: { username: 'rep1' },
    update: {},
    create: { username: 'rep1', password: hashedPassword, role: 'rep' as UserRole, repId: rep1.id },
  });

  await prisma.user.upsert({
    where: { username: 'rep2' },
    update: {},
    create: { username: 'rep2', password: hashedPassword, role: 'rep' as UserRole, repId: rep2.id },
  });

  // Create warehouses
  await prisma.warehouse.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'المخزن الرئيسي', location: 'المنطقة الصناعية، القاهرة', capacity: 50000, manager: 'أحمد محمد' },
  });
  await prisma.warehouse.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'مخزن الجيزة', location: 'الجيزة', capacity: 30000, manager: 'محمود علي' },
  });

  // Create suppliers
  await prisma.supplier.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'شركة الأرز المصري', contactName: 'محمد السيد', phone: '01111111111', email: 'rice@example.com', address: 'دمياط' },
  });
  await prisma.supplier.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'شركة الزيوت الطبيعية', contactName: 'أحمد حسن', phone: '01222222222', email: 'oil@example.com', address: 'الإسكندرية' },
  });

  // Create items
  await prisma.item.upsert({
    where: { id: 1 },
    update: {},
    create: { sku: 'RICE-001', name: 'أرز بسمتي 1 كجم', category: 'مواد غذائية', purchasePrice: new Decimal(25), sellingPrice: new Decimal(32), quantity: new Decimal(500), minQuantity: new Decimal(50), location: 'رف A1', supplierId: 1 },
  });
  await prisma.item.upsert({
    where: { id: 2 },
    update: {},
    create: { sku: 'OIL-001', name: 'زيت طعام 1 لتر', category: 'مواد غذائية', purchasePrice: new Decimal(40), sellingPrice: new Decimal(52), quantity: new Decimal(300), minQuantity: new Decimal(30), location: 'رف B2', supplierId: 2 },
  });
  await prisma.item.upsert({
    where: { id: 3 },
    update: {},
    create: { sku: 'SUGAR-001', name: 'سكر 1 كجم', category: 'مواد غذائية', purchasePrice: new Decimal(18), sellingPrice: new Decimal(24), quantity: new Decimal(400), minQuantity: new Decimal(40), location: 'رف A3', supplierId: 1 },
  });
  await prisma.item.upsert({
    where: { id: 4 },
    update: {},
    create: { sku: 'PASTA-001', name: 'مكرونة 400 جم', category: 'مواد غذائية', purchasePrice: new Decimal(10), sellingPrice: new Decimal(15), quantity: new Decimal(600), minQuantity: new Decimal(60), location: 'رف C1', supplierId: 1 },
  });

  // Create rep inventory assignments
  await prisma.repInventory.upsert({
    where: { repId_itemId: { repId: rep1.id, itemId: 1 } },
    update: {},
    create: { repId: rep1.id, itemId: 1, quantity: new Decimal(50) },
  });
  await prisma.repInventory.upsert({
    where: { repId_itemId: { repId: rep1.id, itemId: 2 } },
    update: {},
    create: { repId: rep1.id, itemId: 2, quantity: new Decimal(30) },
  });
  await prisma.repInventory.upsert({
    where: { repId_itemId: { repId: rep2.id, itemId: 1 } },
    update: {},
    create: { repId: rep2.id, itemId: 1, quantity: new Decimal(40) },
  });
  await prisma.repInventory.upsert({
    where: { repId_itemId: { repId: rep2.id, itemId: 3 } },
    update: {},
    create: { repId: rep2.id, itemId: 3, quantity: new Decimal(20) },
  });

  // Create customers
  await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'محمد أحمد', phone: '01111111111', email: 'customer1@example.com', address: 'القاهرة', loyaltyPoints: 150 },
  });
  await prisma.customer.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'أحمد محمود', phone: '01222222222', email: 'customer2@example.com', address: 'الجيزة', loyaltyPoints: 80 },
  });

  // Create employees
  await prisma.employee.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'محمد علي', role: 'محاسب', department: 'المالية', email: 'accountant@example.com', permissions: 'full' },
  });
  await prisma.employee.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'أحمد حسن', role: 'أمين مخزن', department: 'المخازن', email: 'store@example.com', permissions: 'limited' },
  });

  // Create vehicles
  await prisma.vehicle.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'تويوتا هايلوكس', plateNumber: 'س ق أ 1234', purchaseDate: new Date('2024-01-15'), purchaseValue: new Decimal(850000), licenseExpiry: new Date('2025-01-15'), insuranceExpiry: new Date('2025-01-15'), lastMaintenance: new Date('2024-06-15'), status: 'active' },
  });
  await prisma.vehicle.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'ميتسوبيشي كانتر', plateNumber: 'س ص ب 5678', purchaseDate: new Date('2024-03-01'), purchaseValue: new Decimal(650000), licenseExpiry: new Date('2025-03-01'), insuranceExpiry: new Date('2025-03-01'), lastMaintenance: new Date('2024-08-01'), status: 'active' },
  });

  // Create branches
  await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'الفرع الرئيسي', location: 'القاهرة', managerId: 1, phone: '01000000001' },
  });
  await prisma.branch.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'فرع الجيزة', location: 'الجيزة', managerId: 2, phone: '01000000002' },
  });

  // Create tax configs
  await prisma.taxConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'ضريبة القيمة المضافة', rate: new Decimal(14), type: 'VAT', code: 'VAT-01', description: 'ضريبة القيمة المضافة 14%', isActive: true, isInclusive: false },
  });

  console.log('Seed completed successfully');
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

