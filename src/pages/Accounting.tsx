import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Truck, Users, Building, CreditCard, TrendingUp, TrendingDown, Plus, Search, Download, ArrowUpRight, ArrowDownRight, FileText, PieChart as PieChartIcon, Gift, AlertTriangle, History, Coins, ChevronLeft, ChevronRight, X, Eye, Edit2, Trash2, Printer, Phone, Mail, MapPin, CheckCircle2, XCircle, DollarSign, Percent, BarChart3, Package, RefreshCw, Loader2 } from 'lucide-react';
import { WorkspaceLayout, Tabs } from '../components/design-system';
import { FinancialOverview } from '../components/accounting/FinancialOverview';
import { VendorAccounts } from '../components/accounting/VendorAccounts';
import { CustomerAccounts } from '../components/accounting/CustomerAccounts';
import { PayrollManagement } from '../components/accounting/PayrollManagement';
import { FleetManagement } from '../components/accounting/FleetManagement';
import { PendingCollections } from '../components/accounting/PendingCollections';
import { KpiDetailModal } from '../components/accounting/KpiDetailModal';
import {
  CapitalModal, AllTransactionsModal, VendorPayModal,
  ManualCollectionModal, PayrollEditModal, VehicleExpenseModal,
  VehicleAddModal, OrderDetailsModal, PaymentHistoryModal,
  SalaryConfirmModal
} from '../components/accounting/modals';
import { useAccountingData } from '../hooks/useAccountingData';

export default function Accounting() {
  const {
    // State
    activeTab, setActiveTab,
    isModalOpen, setModalOpen,
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
    // Data
    transactions, allItems, capital, vehicles, suppliers, customers,
    purchaseOrders, salesOrders, employees, payrolls, collections, reps,
    // Computed
    balance, totalIncome, totalExpense, totalPayables, totalReceivables,
    repCustody, currentInventoryValue, expenseBreakdown,
    // Handlers
    handleSelectKpi, fetchOrderDetails, fetchPaymentHistory, handleConfirmCollection,
  } = useAccountingData();

  const tabs = [
    { id: 'overview', label: 'العامة / النقدية', icon: Wallet },
    { id: 'vendors', label: 'حساب الموردين', icon: Building },
    { id: 'customers', label: 'حساب العملاء', icon: CreditCard },
    { id: 'payroll', label: 'الرواتب والموظفين', icon: Users },
    { id: 'fleet', label: 'حساب السيارات', icon: Truck },
  ] as const;

  return (
    <WorkspaceLayout maxWidth="xl">
      <WorkspaceLayout.Header
        title="الإدارة المالية والحسابات"
        subtitle="إدارة التدفقات النقدية، المديونيات، الرواتب، والأصول"
        actions={
          <Tabs
            tabs={tabs.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            variant="segmented"
          />
        }
      />

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <FinancialOverview
            transactions={transactions}
            capital={capital}
            balance={balance}
            totalReceivables={totalReceivables}
            totalPayables={totalPayables}
            repCustody={repCustody}
            inventoryValue={currentInventoryValue}
            expenseBreakdown={expenseBreakdown}
            onUpdateCapital={() => setCapitalModalOpen(true)}
            onSelectKpi={handleSelectKpi}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorAccounts
            purchaseOrders={purchaseOrders}
            suppliers={suppliers}
            onViewDetails={fetchOrderDetails}
            onViewHistory={(id) => fetchPaymentHistory(id, 'purchase')}
            onPay={(order) => {
              setSelectedVendorOrder(order);
              setVendorPayModalOpen(true);
            }}
          />
        )}

        {activeTab === 'customers' && (
          <>
            <CustomerAccounts
              salesOrders={salesOrders}
              customers={customers}
              onViewDetails={fetchOrderDetails}
              onViewHistory={(id) => fetchPaymentHistory(id, 'sale')}
              onCollect={(customer) => {
                setSelectedCustomer(customer);
                setCustomerCollectModalOpen(true);
              }}
            />
            <PendingCollections
              collections={collections}
              reps={reps}
              customers={customers}
              onConfirm={handleConfirmCollection}
            />
          </>
        )}

        {activeTab === 'payroll' && (
          <PayrollManagement
            payrolls={payrolls}
            employees={employees}
            onEdit={(payroll) => {
              setSelectedPayroll(payroll);
              setPayrollModalOpen(true);
            }}
            onPay={(payroll) => setPayrollToConfirm(payroll)}
            onViewStatement={(id) => fetchPaymentHistory(id, 'salary')}
          />
        )}

        {activeTab === 'fleet' && (
          <FleetManagement
            vehicles={vehicles}
            transactions={transactions}
            onAddVehicle={() => setVehicleAddModalOpen(true)}
            onAddExpense={(vehicle) => {
              setSelectedVehicle(vehicle);
              setVehicleExpenseModalOpen(true);
            }}
            onViewStatement={(id) => fetchPaymentHistory(id, 'vehicle')}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <CapitalModal
        open={isCapitalModalOpen}
        onClose={() => setCapitalModalOpen(false)}
        currentCapital={capital?.value || 0}
      />

      <AllTransactionsModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        transactions={transactions}
      />

      <VendorPayModal
        open={isVendorPayModalOpen}
        onClose={() => setVendorPayModalOpen(false)}
        order={selectedVendorOrder}
      />

      <ManualCollectionModal
        open={isCustomerCollectModalOpen}
        onClose={() => setCustomerCollectModalOpen(false)}
        customer={selectedCustomer}
      />

      <PayrollEditModal
        open={isPayrollModalOpen}
        onClose={() => setPayrollModalOpen(false)}
        payroll={selectedPayroll}
      />

      <VehicleExpenseModal
        open={isVehicleExpenseModalOpen}
        onClose={() => setVehicleExpenseModalOpen(false)}
        vehicle={selectedVehicle}
      />

      <VehicleAddModal
        open={isVehicleAddModalOpen}
        onClose={() => setVehicleAddModalOpen(false)}
      />

      <OrderDetailsModal
        open={isOrderDetailsModalOpen}
        onClose={() => setOrderDetailsModalOpen(false)}
        order={selectedOrderDetails}
        items={allItems}
      />

      <PaymentHistoryModal
        open={isPaymentHistoryModalOpen}
        onClose={() => setPaymentHistoryModalOpen(false)}
        transactions={selectedReferenceTransactions}
      />

      <SalaryConfirmModal
        open={isSalaryConfirmModalOpen}
        onClose={() => setSalaryConfirmModalOpen(false)}
        payroll={payrollToConfirm}
        employees={employees}
      />

      {/* KPI Detail Modal - remains imported */}
      <AnimatePresence>
        {isKpiModalOpen && selectedKpi && (
          <KpiDetailModal
            isOpen={isKpiModalOpen}
            onClose={() => setKpiModalOpen(false)}
            type={selectedKpi}
            data={{
              transactions,
              salesOrders,
              purchaseOrders,
              items: allItems,
              capital: capital?.value || 0,
              reps,
            }}
          />
        )}
      </AnimatePresence>
    </WorkspaceLayout>
  );
}