import Dexie, { type Table } from 'dexie';
import type {
  Item, InventoryTransaction, Supplier, Customer, PurchaseOrder, SalesOrder,
  SalesRep, RepInventory, StockTransfer, Warehouse, AppNotification, Employee,
  UserAccount, FinancialTransaction, Vehicle, EmployeePayroll, CompanySetting,
  PaymentCollection, StockRequest, Branch, ActivityLog, SystemConfig, TaxConfig,
  InvoiceSettings
} from '../types';

export class WMSDatabase extends Dexie {
  items!: Table<Item>;
  suppliers!: Table<Supplier>;
  customers!: Table<Customer>;
  purchaseOrders!: Table<PurchaseOrder>;
  salesOrders!: Table<SalesOrder>;
  warehouses!: Table<Warehouse>;
  notifications!: Table<AppNotification>;
  employees!: Table<Employee>;
  salesReps!: Table<SalesRep>;
  repInventory!: Table<RepInventory>;
  stockTransfers!: Table<StockTransfer>;
  users!: Table<UserAccount>;
  stockRequests!: Table<StockRequest>;
  transactions!: Table<FinancialTransaction>;
  vehicles!: Table<Vehicle>;
  employeePayroll!: Table<EmployeePayroll>;
  settings!: Table<CompanySetting>;
  invoiceSettings!: Table<InvoiceSettings>;
  paymentCollections!: Table<PaymentCollection>;
  activityLogs!: Table<ActivityLog>;
  inventoryTransactions!: Table<InventoryTransaction>;
  branches!: Table<Branch>;
  systemConfig!: Table<SystemConfig>;
  taxes!: Table<TaxConfig>;

  async resetTransactionData() {
    const tablesToClear: (keyof WMSDatabase)[] = [
      'purchaseOrders', 'salesOrders', 'notifications', 'repInventory',
      'stockTransfers', 'stockRequests', 'transactions', 'paymentCollections',
      'activityLogs', 'inventoryTransactions', 'employeePayroll'
    ];

    await this.transaction('rw', tablesToClear.map(name => this[name] as Table), async () => {
      for (const tableName of tablesToClear) {
        await (this[tableName] as Table).clear();
      }
    });
    localStorage.setItem('disableSeeding', 'true');
  }

  constructor() {
    super('WMSDatabase');
    // ── Version 1..12 — legacy, never upgrade-properly-handled ──
    // Define all prior versions as empty so IndexedDB does NOT delete data
    this.version(1).stores({});
    this.version(2).stores({});
    this.version(3).stores({});
    this.version(4).stores({});
    this.version(5).stores({});
    this.version(6).stores({});
    this.version(7).stores({});
    this.version(8).stores({});
    this.version(9).stores({});
    this.version(10).stores({});
    this.version(11).stores({});
    this.version(12).stores({});

    // ── Version 13 — current production schema ──
    this.version(13).stores({
      items: '++id, sku, name, category, supplierId, quantity',
      suppliers: '++id, name, email',
      customers: '++id, name, phone, createdAt',
      purchaseOrders: '++id, orderNumber, supplierId, date, paymentStatus, status',
      salesOrders: '++id, orderNumber, customerId, repId, date, paymentStatus, status',
      warehouses: '++id, name, location, manager',
      notifications: '++id, type, read, date',
      employees: '++id, name, email, role',
      salesReps: '++id, name, email, zone',
      repInventory: '++id, repId, itemId',
      stockTransfers: '++id, transferNumber, fromId, toId, date',
      users: '++id, username, role, repId',
      stockRequests: '++id, repId, status, date',
      transactions: '++id, type, category, date, referenceId',
      vehicles: '++id, name, plateNumber, status',
      employeePayroll: '++id, employeeId, month',
      settings: 'id',
      invoiceSettings: 'id',
      paymentCollections: '++id, repId, customerId, status, date',
      activityLogs: '++id, userId, action, timestamp',
      inventoryTransactions: '++id, itemId, type, timestamp',
      branches: '++id, name',
      systemConfig: 'id',
      taxes: '++id, name, isActive'
    });

    // ── Version 14 — compound indexes + soft-delete indexes ──
    this.version(14).stores({
      items: '++id, sku, name, category, supplierId, quantity, [category+name], deletedAt',
      suppliers: '++id, name, email, deletedAt',
      customers: '++id, name, phone, createdAt, [name+phone], deletedAt',
      purchaseOrders: '++id, orderNumber, supplierId, date, paymentStatus, status, [supplierId+status], deletedAt',
      salesOrders: '++id, orderNumber, customerId, repId, date, paymentStatus, status, [customerId+paymentStatus], [repId+paymentStatus], deletedAt',
      warehouses: '++id, name, location, manager, deletedAt',
      notifications: '++id, type, read, date',
      employees: '++id, name, email, role, deletedAt',
      salesReps: '++id, name, email, zone, deletedAt',
      repInventory: '++id, repId, itemId, [repId+itemId]',
      stockTransfers: '++id, transferNumber, fromId, toId, date, [fromId+toType], deletedAt',
      users: '++id, username, role, repId',
      stockRequests: '++id, repId, status, date, [repId+status], deletedAt',
      transactions: '++id, type, category, date, referenceId, [type+category], [category+referenceId]',
      vehicles: '++id, name, plateNumber, status, deletedAt',
      employeePayroll: '++id, employeeId, month, [employeeId+month]',
      settings: 'id',
      invoiceSettings: 'id',
      paymentCollections: '++id, repId, customerId, status, date, [repId+status+type], [customerId+status], [repId+status]',
      activityLogs: '++id, userId, action, timestamp, [userId+action]',
      inventoryTransactions: '++id, itemId, type, timestamp, [itemId+type]',
      branches: '++id, name, deletedAt',
      systemConfig: 'id',
      taxes: '++id, name, isActive, deletedAt'
    }).upgrade(async tx => {
      const tables = [
        'items', 'suppliers', 'customers', 'salesOrders', 'purchaseOrders',
        'salesReps', 'warehouses', 'employees', 'stockTransfers', 'branches',
        'taxes', 'stockRequests', 'vehicles'
      ];
      for (const tableName of tables) {
        const rows = await tx.table(tableName).toArray();
        for (const row of rows) {
          if (row.deletedAt === undefined || row.deletedAt === null) {
            await tx.table(tableName).update(row.id, { deletedAt: 0, deleteReason: null });
          }
        }
      }
    });

    // ── Version 15 — add repId+isSettledWithWarehouse index for sales orders ──
    this.version(15).stores({
      salesOrders: '++id, orderNumber, customerId, repId, date, paymentStatus, status, [customerId+paymentStatus], [repId+paymentStatus], [repId+isSettledWithWarehouse], deletedAt',
    });
  }
}

export const db = new WMSDatabase();
