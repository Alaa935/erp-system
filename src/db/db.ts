// Re-exports for backward compatibility — all imports from '../db/db' continue to work
export type {
  Item, InventoryTransaction, Supplier, Customer, PurchaseOrder, SalesOrder,
  SalesRep, RepInventory, StockTransfer, Warehouse, AppNotification as Notification,
  Employee, EmployeePermissions, UserAccount, FinancialTransaction, Vehicle,
  EmployeePayroll, CompanySetting, PaymentCollection, StockRequest, Branch,
  ActivityLog, SystemConfig, TaxConfig, InvoiceSettings
} from '../types';

export { WMSDatabase, db } from './schema';
export { inventoryService, paymentService, exportAllData, importAllData } from './services';
export { seedData } from './seed';
