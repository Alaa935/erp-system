import { useState } from 'react';
import { useAccountingOverview, useConfirmCollection } from '../hooks/useAccounting';
import type { PurchaseOrder, SalesOrder, Customer, EmployeePayroll } from '../types';
import api from '../lib/api-client';

export type AccountingTab = 'overview' | 'vendors' | 'customers' | 'payroll' | 'fleet';
export type KpiType = 'liquidity' | 'custody' | 'inventory' | 'debtors' | 'creditors' | 'capital';

export function useAccountingData() {
  const [activeTab, setActiveTab] = useState<AccountingTab>('overview');
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'statement'>('list');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<PurchaseOrder | SalesOrder | null>(null);
  const [isOrderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [selectedReferenceTransactions, setSelectedReferenceTransactions] = useState<any[]>([]);
  const [isPaymentHistoryModalOpen, setPaymentHistoryModalOpen] = useState(false);

  const [selectedKpi, setSelectedKpi] = useState<KpiType | null>(null);
  const [isKpiModalOpen, setKpiModalOpen] = useState(false);

  const [isCapitalModalOpen, setCapitalModalOpen] = useState(false);
  const [isVendorPayModalOpen, setVendorPayModalOpen] = useState(false);
  const [selectedVendorOrder, setSelectedVendorOrder] = useState<PurchaseOrder | null>(null);
  const [isCustomerCollectModalOpen, setCustomerCollectModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isPayrollModalOpen, setPayrollModalOpen] = useState(false);
  const [isSalaryConfirmModalOpen, setSalaryConfirmModalOpen] = useState(false);
  const [payrollToConfirm, setPayrollToConfirm] = useState<EmployeePayroll | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<EmployeePayroll | null>(null);
  const [isVehicleExpenseModalOpen, setVehicleExpenseModalOpen] = useState(false);
  const [isVehicleAddModalOpen, setVehicleAddModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Backend data
  const { data: overviewData } = useAccountingOverview();
  const confirmCollectionMutation = useConfirmCollection();

  const d = (overviewData && 'transactions' in overviewData) ? overviewData : (overviewData?.data ?? overviewData);

  const transactions = d?.transactions;
  const allItems = d?.items;
  const capital = d?.capital;
  const vehicles = d?.vehicles;
  const suppliers = d?.suppliers;
  const customers = d?.customers;
  const purchaseOrders = d?.purchaseOrders;
  const salesOrders = d?.salesOrders;
  const employees = d?.employees;
  const payrolls = d?.payrolls;
  const collections = d?.collections;
  const reps = d?.reps;

  const balance = d?.balance ?? 0;
  const totalIncome = d?.totalIncome ?? 0;
  const totalExpense = d?.totalExpense ?? 0;
  const totalPayables = d?.totalPayables ?? 0;
  const totalReceivables = d?.totalReceivables ?? 0;
  const repCustody = d?.repCustody ?? 0;
  const currentInventoryValue = d?.currentInventoryValue ?? 0;
  const expenseBreakdown = d?.expenseBreakdown ?? [];

  const handleSelectKpi = (type: KpiType) => {
    setSelectedKpi(type);
    setKpiModalOpen(true);
  };

  const fetchOrderDetails = (order: PurchaseOrder | SalesOrder) => {
    setSelectedOrderDetails(order);
    setOrderDetailsModalOpen(true);
  };

  const fetchPaymentHistory = async (referenceId: number, category: string) => {
    if (!referenceId) return;
    try {
      const data = await api<any>(`/accounting/payment-history/${referenceId}`, {
        params: { category }
      });
      setSelectedReferenceTransactions(data || []);
      setPaymentHistoryModalOpen(true);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const handleConfirmCollection = async (collectionId: number) => {
    try {
      await confirmCollectionMutation.mutateAsync(collectionId);
    } catch (error) {
      console.error('Error confirming collection:', error);
    }
  };

  return {
    activeTab, setActiveTab,
    isModalOpen, setModalOpen,
    searchTerm, setSearchTerm,
    selectedEntityId, setSelectedEntityId,
    viewMode, setViewMode,
    selectedOrderDetails, isOrderDetailsModalOpen, setOrderDetailsModalOpen,
    selectedReferenceTransactions, isPaymentHistoryModalOpen, setPaymentHistoryModalOpen,
    selectedKpi, isKpiModalOpen, setKpiModalOpen,
    isCapitalModalOpen, setCapitalModalOpen,
    isVendorPayModalOpen, setVendorPayModalOpen,
    selectedVendorOrder, setSelectedVendorOrder,
    isCustomerCollectModalOpen, setCustomerCollectModalOpen,
    selectedCustomer, setSelectedCustomer,
    isPayrollModalOpen, setPayrollModalOpen,
    isSalaryConfirmModalOpen, setSalaryConfirmModalOpen,
    payrollToConfirm, setPayrollToConfirm,
    selectedPayroll, setSelectedPayroll,
    isVehicleExpenseModalOpen, setVehicleExpenseModalOpen,
    isVehicleAddModalOpen, setVehicleAddModalOpen,
    selectedVehicle, setSelectedVehicle,
    transactions, allItems, capital, vehicles, suppliers, customers,
    purchaseOrders, salesOrders, employees, payrolls, collections, reps,
    balance, totalIncome, totalExpense, totalPayables, totalReceivables,
    repCustody, currentInventoryValue, expenseBreakdown,
    handleSelectKpi, fetchOrderDetails, fetchPaymentHistory, handleConfirmCollection,
  };
}
