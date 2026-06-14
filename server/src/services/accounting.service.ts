import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import Decimal from 'decimal.js';

function toNumber(d: Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

export const accountingService = {
  async financialOverview() {
    const [
      transactions,
      items,
      vehicles,
      suppliers,
      customers,
      purchaseOrders,
      salesOrders,
      employees,
      payrolls,
      collections,
      reps,
      capitalTxns,
    ] = await Promise.all([
      prisma.financialTransaction.findMany({ orderBy: { date: 'desc' } }),
      prisma.item.findMany({ where: { deletedAt: null }, select: { id: true, name: true, purchasePrice: true, quantity: true } }),
      prisma.vehicle.findMany({ where: { deletedAt: null } }),
      prisma.supplier.findMany({ where: { deletedAt: null } }),
      prisma.customer.findMany({ where: { deletedAt: null } }),
      prisma.purchaseOrder.findMany({ where: { deletedAt: null }, select: { id: true, totalAmount: true, paidAmount: true, paymentStatus: true, supplierId: true } }),
      prisma.salesOrder.findMany({ where: { deletedAt: null }, select: { id: true, totalAmount: true, paidAmount: true, paymentStatus: true, customerId: true, status: true, settledAmount: true, isSettledWithWarehouse: true } }),
      prisma.employee.findMany({ where: { deletedAt: null } }),
      prisma.employeePayroll.findMany(),
      prisma.paymentCollection.findMany({ orderBy: { date: 'desc' } }),
      prisma.salesRep.findMany({ where: { deletedAt: null } }),
      prisma.financialTransaction.findMany({ where: { type: 'equity' } }),
    ]);
    const capital = capitalTxns.reduce((s, t) => s + toNumber(t.amount), 0);

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + toNumber(t.amount), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + toNumber(t.amount), 0);
    const balance = totalIncome - totalExpense;
    const totalPayables = purchaseOrders.filter(o => o.paymentStatus !== 'paid').reduce((s, o) => s + (toNumber(new Decimal(Number(o.totalAmount))) - toNumber(new Decimal(Number(o.paidAmount)))), 0);
    const totalReceivables = salesOrders.filter(o => o.paymentStatus !== 'paid').reduce((s, o) => s + (toNumber(new Decimal(Number(o.totalAmount))) - toNumber(new Decimal(Number(o.paidAmount)))), 0);
    const repCustody = salesOrders.filter(o => Number(o.paidAmount) > 0 && !o.isSettledWithWarehouse && o.status !== 'cancelled' && o.status !== 'pending').reduce((s, o) => s + (toNumber(new Decimal(Number(o.paidAmount))) - toNumber(new Decimal(Number(o.settledAmount)))), 0);
    const currentInventoryValue = items.reduce((s, i) => s + toNumber(i.purchasePrice) * toNumber(i.quantity), 0);

    const categoryLabels: Record<string, string> = {
      salary: 'رواتب', vehicle: 'سيارات', other: 'أخرى', purchase: 'مشتريات',
      rent: 'إيجار', utilities: 'مرافق', advance: 'سلف', bonus: 'مكافآت',
      cogs: 'تكلفة مبيعات', sale: 'مبيعات', capital_injection: 'رأس مال',
      deduction: 'خصومات',
    };
    const expenseColor: Record<string, string> = {
      salary: 'bg-green-600', vehicle: 'bg-orange-600', other: 'bg-purple-600',
      rent: 'bg-blue-600', utilities: 'bg-yellow-600', advance: 'bg-red-600',
      bonus: 'bg-teal-600', purchase: 'bg-gray-600',
    };
    const getCategoryTotal = (cat: string) => transactions.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + toNumber(t.amount), 0);
    const purchaseTotal = getCategoryTotal('purchase');
    const totalOpExpense = totalExpense - purchaseTotal;

    const expenseCategories = ['salary', 'rent', 'utilities', 'vehicle', 'advance', 'bonus', 'other'];
    const expenseBreakdown = expenseCategories.map(cat => {
      const val = getCategoryTotal(cat);
      return {
        label: categoryLabels[cat] || cat,
        val: val.toLocaleString(),
        per: totalOpExpense > 0 ? Math.round((val / totalOpExpense) * 100) : 0,
        color: expenseColor[cat] || 'bg-gray-600',
      };
    });

    return {
      transactions: transactions.map(t => ({ ...t, amount: toNumber(t.amount) })),
      capital: { value: capital },
      vehicles: vehicles.map(v => ({ id: v.id, name: v.name, plateNumber: v.plateNumber, status: v.status, deletedAt: v.deletedAt, deleteReason: v.deleteReason })),
      suppliers: suppliers.map(s => ({ id: s.id, name: s.name })),
      customers: customers.map(c => ({ id: c.id, name: c.name, phone: c.phone })),
      purchaseOrders: purchaseOrders.map(o => ({ ...o, totalAmount: toNumber(new Decimal(Number(o.totalAmount))), paidAmount: toNumber(new Decimal(Number(o.paidAmount))) })),
      salesOrders: salesOrders.map(o => ({ ...o, totalAmount: toNumber(new Decimal(Number(o.totalAmount))), paidAmount: toNumber(new Decimal(Number(o.paidAmount))), settledAmount: toNumber(new Decimal(Number(o.settledAmount))) })),
      employees: employees.map(e => ({ id: e.id, name: e.name, role: e.role, department: e.department })),
      payrolls: payrolls.map(p => ({ ...p, baseSalary: toNumber(p.baseSalary), advances: toNumber(p.advances), bonuses: toNumber(p.bonuses), deductions: toNumber(p.deductions) })),
      collections: collections.map(c => ({ ...c, amount: toNumber(c.amount) })),
      reps: reps.map(r => ({ id: r.id, name: r.name })),
      balance, totalIncome, totalExpense, totalPayables, totalReceivables, repCustody, currentInventoryValue, expenseBreakdown,
    };
  },

  async updateCapital(amount: number) {
    await prisma.financialTransaction.create({
      data: {
        type: 'equity',
        amount: new Decimal(amount),
        category: 'capital_injection',
        description: 'تعديل رأس المال',
        transactionNumber: 'CAP-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        date: new Date(),
      },
    });
    const capitalTxns = await prisma.financialTransaction.findMany({ where: { type: 'equity' } });
    const capital = capitalTxns.reduce((s, t) => s + toNumber(t.amount), 0);
    return { value: capital };
  },

  async createTransaction(data: { type: 'income' | 'expense'; amount: number; category: string; description?: string; referenceId?: number; date?: string }) {
    const transactionNumber = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    try {
      const transaction = await prisma.financialTransaction.create({
        data: {
          type: data.type,
          amount: new Decimal(data.amount),
          category: data.category as any,
          description: data.description || '',
          referenceId: data.referenceId ?? null,
          date: data.date ? new Date(data.date) : new Date(),
          transactionNumber,
        },
      });
      return { ...transaction, amount: toNumber(transaction.amount) };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new AppError(409, 'رقم المعاملة مكرر، يرجى المحاولة مرة أخرى');
      }
      throw err;
    }
  },

  async createPayroll(data: { employeeId: number; baseSalary: number; advances?: number; bonuses?: number; deductions?: number; month: number }) {
    const payroll = await prisma.employeePayroll.create({
      data: {
        employeeId: data.employeeId,
        baseSalary: new Decimal(data.baseSalary),
        advances: new Decimal(data.advances ?? 0),
        bonuses: new Decimal(data.bonuses ?? 0),
        deductions: new Decimal(data.deductions ?? 0),
        month: data.month,
      },
    });
    return { ...payroll, baseSalary: toNumber(payroll.baseSalary), advances: toNumber(payroll.advances), bonuses: toNumber(payroll.bonuses), deductions: toNumber(payroll.deductions) };
  },

  async getPaymentHistory(referenceId: number, category: string) {
    const transactions = await prisma.financialTransaction.findMany({
      where: { referenceId, category: category as any },
      orderBy: { date: 'desc' },
    });
    return transactions.map(t => ({ ...t, amount: toNumber(t.amount) }));
  },

  async confirmCollection(collectionId: number, username: string) {
    const collection = await prisma.paymentCollection.findUnique({ where: { id: collectionId } });
    if (!collection) throw new AppError(404, 'Collection not found');
    if (collection.status !== 'pending') throw new AppError(400, 'Collection already processed');

    const [updated] = await prisma.$transaction([
      prisma.paymentCollection.update({
        where: { id: collectionId },
        data: { status: 'confirmed', confirmedDate: new Date() },
      }),
      prisma.financialTransaction.create({
        data: {
          type: 'income',
          amount: collection.amount,
          category: 'other',
          description: `تحصيل من ${username}`,
          referenceId: collection.orderId ?? collection.customerId,
          transactionNumber: 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
          date: new Date(),
        },
      }),
    ]);
    return { ...updated, amount: toNumber(updated.amount) };
  },

  async confirmSalaryPayroll(payrollId: number) {
    const payroll = await prisma.employeePayroll.update({
      where: { id: payrollId },
      data: { status: 'paid', lastPaymentDate: new Date() },
    });
    return { ...payroll, baseSalary: toNumber(payroll.baseSalary), advances: toNumber(payroll.advances), bonuses: toNumber(payroll.bonuses), deductions: toNumber(payroll.deductions) };
  },

  async updatePayroll(id: number, data: { baseSalary?: number; advances?: number; bonuses?: number; deductions?: number; month?: number }) {
    const updateData: any = {};
    if (data.baseSalary !== undefined) updateData.baseSalary = new Decimal(data.baseSalary);
    if (data.advances !== undefined) updateData.advances = new Decimal(data.advances);
    if (data.bonuses !== undefined) updateData.bonuses = new Decimal(data.bonuses);
    if (data.deductions !== undefined) updateData.deductions = new Decimal(data.deductions);
    if (data.month !== undefined) updateData.month = data.month;
    const payroll = await prisma.employeePayroll.update({ where: { id }, data: updateData });
    return { ...payroll, baseSalary: toNumber(payroll.baseSalary), advances: toNumber(payroll.advances), bonuses: toNumber(payroll.bonuses), deductions: toNumber(payroll.deductions) };
  },

  async createVehicle(data: { name: string; plateNumber: string }) {
    return prisma.vehicle.create({ data: { name: data.name, plateNumber: data.plateNumber } });
  },

  async addVehicleExpense(data: { vehicleId: number; amount: number; description: string; date?: string }) {
    const transactionNumber = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const transaction = await prisma.financialTransaction.create({
      data: {
        type: 'expense',
        amount: new Decimal(data.amount),
        category: 'vehicle',
        description: data.description,
        referenceId: data.vehicleId,
        transactionNumber,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });
    return { ...transaction, amount: toNumber(transaction.amount) };
  },
};
