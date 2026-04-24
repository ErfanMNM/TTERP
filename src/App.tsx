import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import SettingsPage from './pages/Settings';

// Selling
import Quotations from './pages/selling/Quotations';
import SalesOrders from './pages/selling/SalesOrders';
import SalesOrderDetail from './pages/selling/SalesOrderDetail';
import SalesOrderNew from './pages/selling/SalesOrderNew';
import DeliveryNotes from './pages/selling/DeliveryNotes';
import SalesInvoices from './pages/selling/SalesInvoices';
import Customers from './pages/selling/Customers';
import CustomerDetail from './pages/selling/CustomerDetail';
import CustomerNew from './pages/selling/CustomerNew';

// Buying
import SupplierQuotations from './pages/buying/SupplierQuotations';
import PurchaseOrders from './pages/buying/PurchaseOrders';
import PurchaseOrderDetail from './pages/buying/PurchaseOrderDetail';
import PurchaseReceipts from './pages/buying/PurchaseReceipts';
import PurchaseInvoices from './pages/buying/PurchaseInvoices';
import Suppliers from './pages/buying/Suppliers';
import SupplierDetail from './pages/buying/SupplierDetail';
import SupplierNew from './pages/buying/SupplierNew';

// Stock
import Items from './pages/stock/Items';
import ItemDetail from './pages/stock/ItemDetail';
import ItemNew from './pages/stock/ItemNew';
import StockBalance from './pages/stock/StockBalance';
import StockEntries from './pages/stock/StockEntries';
import StockEntryDetail from './pages/stock/StockEntryDetail';
import StockEntryNew from './pages/stock/StockEntryNew';
import MaterialRequests from './pages/stock/MaterialRequests';
import MaterialRequestDetail from './pages/stock/MaterialRequestDetail';
import StockReconciliations from './pages/stock/StockReconciliations';
import StockReconciliationDetail from './pages/stock/StockReconciliationDetail';
import StockLedger from './pages/stock/StockLedger';
import Warehouses from './pages/stock/Warehouses';
import BOMs from './pages/stock/BOMs';

// HR
import Employees from './pages/hr/Employees';
import EmployeeDetail from './pages/hr/EmployeeDetail';
import LeaveApplications from './pages/hr/LeaveApplications';
import LeaveApplicationDetail from './pages/hr/LeaveApplicationDetail';
import Attendance from './pages/hr/Attendance';
import SalarySlips from './pages/hr/SalarySlips';
import ExpenseClaims from './pages/hr/ExpenseClaims';

// CRM
import Opportunities from './pages/crm/Opportunities';
import Leads from './pages/crm/Leads';
import Contacts from './pages/crm/Contacts';

// Projects
import Projects from './pages/projects/Projects';
import ProjectDetail from './pages/projects/ProjectDetail';
import Tasks from './pages/projects/Tasks';
import Timesheets from './pages/projects/Timesheets';
import Todo from './pages/projects/Todo';
import TodoDetail from './pages/projects/TodoDetail';

// Accounts
import AccountsSalesInvoices from './pages/accounts/SalesInvoices';
import AccountsPurchaseInvoices from './pages/accounts/PurchaseInvoices';
import PaymentEntries from './pages/accounts/PaymentEntries';
import JournalEntries from './pages/accounts/JournalEntries';

// Manufacturing
import MfgBOMs from './pages/manufacturing/BOMs';
import WorkOrders from './pages/manufacturing/WorkOrders';

// Settings
import ItemGroups from './pages/settings/ItemGroups';
import UOMs from './pages/settings/UOMs';
import Brands from './pages/settings/Brands';
import Companies from './pages/settings/Companies';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-lg">M</span>
        </div>
        <p className="text-sm text-gray-400">Đang tải...</p>
      </div>
    </div>
  );
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Selling */}
            <Route path="/selling/quotations" element={<Quotations />} />
            <Route path="/selling/sales-orders" element={<SalesOrders />} />
            <Route path="/selling/sales-orders/new" element={<SalesOrderNew />} />
            <Route path="/selling/sales-orders/:name" element={<SalesOrderDetail />} />
            <Route path="/selling/delivery-notes" element={<DeliveryNotes />} />
            <Route path="/selling/sales-invoices" element={<SalesInvoices />} />
            <Route path="/selling/customers" element={<Customers />} />
            <Route path="/selling/customers/new" element={<CustomerNew />} />
            <Route path="/selling/customers/:name" element={<CustomerDetail />} />

            {/* Buying */}
            <Route path="/buying/supplier-quotations" element={<SupplierQuotations />} />
            <Route path="/buying/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/buying/purchase-orders/:name" element={<PurchaseOrderDetail />} />
            <Route path="/buying/purchase-receipts" element={<PurchaseReceipts />} />
            <Route path="/buying/purchase-invoices" element={<PurchaseInvoices />} />
            <Route path="/buying/suppliers" element={<Suppliers />} />
            <Route path="/buying/suppliers/new" element={<SupplierNew />} />
            <Route path="/buying/suppliers/:name" element={<SupplierDetail />} />

            {/* Stock */}
            <Route path="/stock/items" element={<Items />} />
            <Route path="/stock/items/new" element={<ItemNew />} />
            <Route path="/stock/items/:name" element={<ItemDetail />} />
            <Route path="/stock/balance" element={<StockBalance />} />
            <Route path="/stock/stock-entries" element={<StockEntries />} />
            <Route path="/stock/stock-entries/new" element={<StockEntryNew />} />
            <Route path="/stock/stock-entries/:name" element={<StockEntryDetail />} />
            <Route path="/stock/material-requests" element={<MaterialRequests />} />
            <Route path="/stock/material-requests/:name" element={<MaterialRequestDetail />} />
            <Route path="/stock/reconciliations" element={<StockReconciliations />} />
            <Route path="/stock/reconciliations/:name" element={<StockReconciliationDetail />} />
            <Route path="/stock/ledger" element={<StockLedger />} />
            <Route path="/stock/warehouses" element={<Warehouses />} />
            <Route path="/stock/boms" element={<BOMs />} />

            {/* HR */}
            <Route path="/hr/employees" element={<Employees />} />
            <Route path="/hr/employees/:name" element={<EmployeeDetail />} />
            <Route path="/hr/leave-applications" element={<LeaveApplications />} />
            <Route path="/hr/leave-applications/:name" element={<LeaveApplicationDetail />} />
            <Route path="/hr/attendance" element={<Attendance />} />
            <Route path="/hr/salary-slips" element={<SalarySlips />} />
            <Route path="/hr/expense-claims" element={<ExpenseClaims />} />

            {/* CRM */}
            <Route path="/crm/opportunities" element={<Opportunities />} />
            <Route path="/crm/leads" element={<Leads />} />
            <Route path="/crm/contacts" element={<Contacts />} />

            {/* Projects */}
            <Route path="/projects/projects" element={<Projects />} />
            <Route path="/projects/projects/:name" element={<ProjectDetail />} />
            <Route path="/projects/tasks" element={<Tasks />} />
            <Route path="/projects/timesheets" element={<Timesheets />} />
            <Route path="/projects/todos" element={<Todo />} />
            <Route path="/projects/todos/:name" element={<TodoDetail />} />

            {/* Accounts */}
            <Route path="/accounts/sales-invoices" element={<AccountsSalesInvoices />} />
            <Route path="/accounts/purchase-invoices" element={<AccountsPurchaseInvoices />} />
            <Route path="/accounts/payment-entries" element={<PaymentEntries />} />
            <Route path="/accounts/journal-entries" element={<JournalEntries />} />

            {/* Manufacturing */}
            <Route path="/manufacturing/boms" element={<MfgBOMs />} />
            <Route path="/manufacturing/work-orders" element={<WorkOrders />} />

            {/* Settings */}
            <Route path="/settings/item-groups" element={<ItemGroups />} />
            <Route path="/settings/uoms" element={<UOMs />} />
            <Route path="/settings/brands" element={<Brands />} />
            <Route path="/settings/companies" element={<Companies />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  );
}
