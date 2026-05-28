export interface Item {
  id?: number;
  sku: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minQuantity: number;
  location: string;
  expiryDate?: string;
  supplierId?: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  deleteReason?: string;
}

export interface InventoryTransaction {
  id?: number;
  itemId: number;
  type: 'increase' | 'decrease';
  oldQuantity: number;
  newQuantity: number;
  diff: number;
  reason: string;
  source?: string;
  userId: number | string;
  timestamp: number;
}

export interface Supplier {
  id?: number;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  taxNumber?: string;
  address: string;
  createdAt: number;
  deletedAt?: number;
  deleteReason?: string;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  loyaltyPoints: number;
  latitude?: number;
  longitude?: number;
  createdAt: number;
  deletedAt?: number;
  deleteReason?: string;
}

export interface PurchaseOrder {
  id?: number;
  orderNumber: string;
  supplierId: number;
  invoiceNumber?: string;
  items: { itemId: number; quantity: number; price: number }[];
  subtotal?: number;
  taxId?: number;
  taxAmount?: number;
  totalAmount: number;
  status: 'received' | 'cancelled';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paidAmount: number;
  dueDate?: number;
  date: number;
  notes?: string;
  paymentMethod?: 'cash' | 'transfer' | 'check' | 'credit';
  deletedAt?: number;
  deleteReason?: string;
}

export interface SalesOrder {
  id?: number;
  orderNumber: string;
  customerId: number;
  repId?: number;
  items: { itemId: number; quantity: number; price: number; purchasePrice?: number }[];
  subtotal?: number;
  taxId?: number;
  taxAmount?: number;
  totalAmount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paidAmount: number;
  settledAmount?: number;
  isSettledWithWarehouse?: boolean;
  dueDate?: number;
  date: number;
  deletedAt?: number;
  deleteReason?: string;
}

export interface SalesRep {
  id?: number;
  name: string;
  phone: string;
  email: string;
  zone: string;
  target: number;
  currentSales: number;
  commissionRate: number;
  balance?: number;
  createdAt: number;
  deletedAt?: number;
  deleteReason?: string;
}

export interface RepInventory {
  id?: number;
  repId: number;
  itemId: number;
  quantity: number;
  updatedAt?: number;
}

export interface StockTransfer {
  id?: number;
  transferNumber: string;
  fromType: 'warehouse' | 'rep';
  fromId: number;
  toType: 'warehouse' | 'rep';
  toId: number;
  items: { itemId: number; quantity: number }[];
  status: 'pending' | 'completed' | 'cancelled';
  date: number;
  deletedAt?: number;
  deleteReason?: string;
}

export interface Warehouse {
  id?: number;
  name: string;
  location: string;
  capacity: number;
  manager: string;
  deletedAt?: number;
  deleteReason?: string;
}

export interface AppNotification {
  id?: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  date: number;
}

export interface EmployeePermissions {
  addItems: boolean;
  deleteInvoices: boolean;
  editPrices: boolean;
  viewProfits: boolean;
  manageEmployees: boolean;
  approveReturns: boolean;
}

export interface Employee {
  id?: number;
  name: string;
  role: string;
  department: string;
  email: string;
  permissions: 'full' | 'limited' | EmployeePermissions;
  branchId?: number;
  deletedAt?: number;
  deleteReason?: string;
}

export interface UserAccount {
  id?: number;
  username: string;
  password?: string;
  role: 'admin' | 'rep' | 'manager';
  repId?: number;
  nationalId?: string;
}

export interface FinancialTransaction {
  id?: number;
  type: 'income' | 'expense' | 'equity';
  category: 'sale' | 'purchase' | 'salary' | 'rent' | 'utilities' | 'vehicle' | 'capital_injection' | 'cogs' | 'advance' | 'bonus' | 'deduction' | 'other';
  amount: number;
  description: string;
  referenceId?: number;
  date: number;
}

export interface Vehicle {
  id?: number;
  name: string;
  plateNumber: string;
  purchaseDate: number;
  purchaseValue: number;
  licenseExpiry: number;
  insuranceExpiry: number;
  lastMaintenance: number;
  status: 'active' | 'maintenance' | 'retired';
  deletedAt?: number;
  deleteReason?: string;
}

export interface EmployeePayroll {
  id?: number;
  employeeId: number;
  baseSalary: number;
  advances: number;
  bonuses: number;
  deductions: number;
  month: number;
  status?: 'pending' | 'paid';
  lastPaymentDate?: number;
}

export interface CompanySetting {
  id: string;
  value: any;
}

export interface PaymentCollection {
  id?: number;
  repId: number;
  customerId?: number;
  orderId?: number;
  amount: number;
  method: 'cash' | 'transfer' | 'check';
  status: 'pending' | 'confirmed' | 'rejected';
  type?: 'customer' | 'rep_settlement';
  date: number;
  confirmedDate?: number;
}

export interface StockRequest {
  id?: number;
  repId: number;
  items: { itemId: number; quantity: number; sellingPrice?: number }[];
  status: 'pending' | 'approved' | 'rejected';
  date: number;
  deletedAt?: number;
  deleteReason?: string;
}

export interface Branch {
  id?: number;
  name: string;
  location: string;
  managerId?: number;
  phone: string;
  createdAt: number;
  deletedAt?: number;
  deleteReason?: string;
}

export interface ActivityLog {
  id?: number;
  userId: number | string;
  username: string;
  action: string;
  entity: string;
  entityId?: number | string;
  details: string;
  timestamp: number;
}

export interface SystemConfig {
  id: string;
  companyName: string;
  logo?: string;
  stamp?: string;
  phone: string;
  email: string;
  taxId: string;
  crNumber: string;
  address: string;
  currency: string;
  language: string;
  invoicePrefix: string;
  invoiceNextNumber: number;
  vatRate: number;
  defaultDiscount: number;
  qrCodeEnabled: boolean;
  paperSize: 'A4' | 'Thermal 80mm' | 'Thermal 58mm';
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  layout: 'sidebar' | 'topbar';
  whatsappNotifications: boolean;
  emailNotifications: boolean;
  lowStockAlerts: boolean;
  minStockLevel: number;
  trackingSystem: 'none' | 'batch' | 'serial';
  primaryColor?: string;
}

export interface TaxConfig {
  id?: number;
  name: string;
  rate: number;
  type: 'VAT' | 'Sales' | 'Service' | 'Custom';
  code?: string;
  description?: string;
  isActive: boolean;
  isInclusive: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  deleteReason?: string;
}

export interface InvoiceSettings {
  id: string;
  companyName: string;
  managedBy: string;
  phone?: string;
  address?: string;
}


