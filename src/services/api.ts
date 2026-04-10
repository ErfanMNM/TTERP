import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
  },
});

// Remove Content-Type for GET requests (ERPNext rejects GET with Content-Type: application/json)
api.interceptors.request.use((config) => {
  if (config.method === 'get' || config.method === 'GET') {
    delete config.headers['Content-Type'];
  } else {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (usr: string, pwd: string) =>
    api.post('/method/login', { usr, pwd }),
  logout: () =>
    api.post('/method/logout'),
  getCurrentUser: () =>
    api.get<{ message: string }>('/method/frappe.auth.get_logged_user'),
  getUserByName: (name: string) =>
    api.get(`/resource/User/${encodeURIComponent(name)}`),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
export async function submitDoc(doctype: string, docname: string) {
  return fetch('/api/method/frappe.client.submit', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ doctype, docname }),
  });
}

export async function cancelDoc(doctype: string, docname: string) {
  return fetch('/api/method/frappe.client.cancel', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ doctype, docname }),
  });
}

export async function deleteDoc(doctype: string, name: string) {
  return api.delete(`/resource/${doctype}/${encodeURIComponent(name)}`);
}

export function getResource<T = unknown>(doctype: string, name: string, params?: Record<string, string>) {
  return api.get<{ data: T }>(`/resource/${doctype}/${encodeURIComponent(name)}`, { params });
}

export function listResource<T = unknown>(doctype: string, params?: Record<string, unknown>) {
  return api.get<{ data: T[]; count?: number }>(`/resource/${doctype}`, { params });
}

export function createResource<T = unknown>(doctype: string, data: unknown) {
  return api.post<T>(`/resource/${doctype}`, data);
}

export function updateResource<T = unknown>(doctype: string, name: string, data: unknown) {
  return api.put<T>(`/resource/${doctype}/${encodeURIComponent(name)}`, data);
}

export function callMethod<T = unknown>(method: string, args?: Record<string, unknown>) {
  return api.post<T>(`/method/${method}`, args);
}

// ─── Company ─────────────────────────────────────────────────────────────────
export const companyApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{ name: string; company_name: string; default_currency: string }>('Company', params),
  get: (name: string) =>
    getResource<{ name: string; company_name: string; default_currency: string }>('Company', name),
};

// ─── Warehouse ───────────────────────────────────────────────────────────────
export const warehouseApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{ name: string; warehouse_name: string; company: string }>('Warehouse', params),
};

// ─── Item ────────────────────────────────────────────────────────────────────
export const itemApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; item_name: string; item_code: string; item_group: string;
      stock_uom: string; image?: string; disabled: number;
    }>('Item', params),
  get: (name: string) =>
    getResource<{
      name: string; item_code: string; item_name: string; item_group: string;
      stock_uom: string; description?: string; brand?: string; disabled: number;
      standard_rate?: number; valuation_rate?: number; created_on?: string; modified?: string;
      [key: string]: unknown;
    }>('Item', name),
  create: (data: unknown) =>
    createResource('Item', data),
  update: (name: string, data: unknown) =>
    updateResource('Item', name, data),
  search: (txt: string) =>
    callMethod<{ message: { value: string; description: string }[] }>('erpnext.stock.get_item_details', {
      item_code: txt,
    }),
};

// ─── Item Group ──────────────────────────────────────────────────────────────
export const itemGroupApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{ name: string; item_group_name: string; parent_item_group?: string }>('Item Group', params),
};

// ─── UOM ─────────────────────────────────────────────────────────────────────
export const uomApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{ name: string; uom_name: string }>('UOM', params),
};

// ─── Brand ───────────────────────────────────────────────────────────────────
export const brandApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{ name: string; brand: string }>('Brand', params),
};

// ─── Customer ─────────────────────────────────────────────────────────────────
export const customerApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; customer_name: string; customer_type: string;
      customer_group: string; territory: string; mobile_no?: string;
    }>('Customer', params),
  get: (name: string) =>
    getResource<{
      name: string; customer_name: string; customer_type: string;
      customer_group: string; territory?: string; mobile_no?: string;
      email_id?: string; address_display?: string; primary_address?: string;
      company_name?: string; website?: string; tax_id?: string;
      payment_terms?: string; credit_limit?: number;
      [key: string]: unknown;
    }>('Customer', name),
  create: (data: unknown) =>
    createResource('Customer', data),
  update: (name: string, data: unknown) =>
    updateResource('Customer', name, data),
};

// ─── Supplier ────────────────────────────────────────────────────────────────
export const supplierApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; supplier_name: string; supplier_type: string;
      supplier_group: string; country?: string;
    }>('Supplier', params),
  get: (name: string) =>
    getResource<{
      name: string; supplier_name: string; supplier_type: string;
      supplier_group: string; country?: string; default_currency?: string;
      mobile_no?: string; email_id?: string; website?: string;
      tax_id?: string; payment_terms?: string; credit_limit?: number;
    }>('Supplier', name),
  create: (data: unknown) =>
    createResource('Supplier', data),
  update: (name: string, data: unknown) =>
    updateResource('Supplier', name, data),
};

// ─── Sales Order ─────────────────────────────────────────────────────────────
export const salesOrderApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; customer: string; customer_name: string; transaction_date: string;
      delivery_date: string; grand_total: number; currency: string;
      status: string; docstatus: number; per_delivered: number;
      per_billed: number; company: string;
    }>('Sales Order', params),
  get: (name: string) =>
    getResource<{
      name: string; customer: string; customer_name: string; transaction_date: string;
      delivery_date: string; grand_total: number; currency: string;
      status: string; docstatus: number; company: string;
      items?: Array<{ item_code: string; item_name: string; qty: number; rate: number; amount: number; uom: string }>;
    }>('Sales Order', name),
  create: (data: unknown) =>
    createResource('Sales Order', data),
  update: (name: string, data: unknown) =>
    updateResource('Sales Order', name, data),
  submit: (name: string) =>
    submitDoc('Sales Order', name),
};

// ─── Quotation ────────────────────────────────────────────────────────────────
export const quotationApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; customer_name: string; party_name: string; quotation_to: string;
      transaction_date: string; valid_till: string; grand_total: number; currency: string;
      status: string; docstatus: number; company: string;
    }>('Quotation', params),
  get: (name: string) =>
    getResource<{
      name: string; customer_name: string; party_name: string; quotation_to: string;
      transaction_date: string; valid_till: string; grand_total: number; currency: string;
      status: string; docstatus: number; company: string;
    }>('Quotation', name),
  create: (data: unknown) =>
    createResource('Quotation', data),
  update: (name: string, data: unknown) =>
    updateResource('Quotation', name, data),
  submit: (name: string) =>
    submitDoc('Quotation', name),
};

// ─── Delivery Note ────────────────────────────────────────────────────────────
export const deliveryNoteApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; customer: string; customer_name: string; posting_date: string;
      grand_total: number; currency: string; status: string; docstatus: number; company: string;
    }>('Delivery Note', params),
  get: (name: string) =>
    getResource<{
      name: string; customer: string; customer_name: string; posting_date: string;
      grand_total: number; currency: string; status: string; docstatus: number; company: string;
    }>('Delivery Note', name),
  create: (data: unknown) =>
    createResource('Delivery Note', data),
  update: (name: string, data: unknown) =>
    updateResource('Delivery Note', name, data),
  submit: (name: string) =>
    submitDoc('Delivery Note', name),
};

// ─── Sales Invoice ───────────────────────────────────────────────────────────
export const salesInvoiceApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; customer: string; customer_name: string; posting_date: string;
      due_date: string; grand_total: number; outstanding_amount: number;
      currency: string; status: string; docstatus: number; company: string;
    }>('Sales Invoice', params),
  get: (name: string) =>
    getResource<{
      name: string; customer: string; customer_name: string; posting_date: string;
      due_date: string; grand_total: number; outstanding_amount: number;
      currency: string; status: string; docstatus: number; company: string;
    }>('Sales Invoice', name),
  create: (data: unknown) =>
    createResource('Sales Invoice', data),
  update: (name: string, data: unknown) =>
    updateResource('Sales Invoice', name, data),
  submit: (name: string) =>
    submitDoc('Sales Invoice', name),
};

// ─── Purchase Order ───────────────────────────────────────────────────────────
export const purchaseOrderApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; supplier: string; supplier_name: string; transaction_date: string;
      schedule_date: string; grand_total: number; currency: string;
      status: string; docstatus: number; per_received: number; company: string;
    }>('Purchase Order', params),
  get: (name: string) =>
    getResource<{
      name: string; supplier_name: string; transaction_date: string;
      schedule_date: string; grand_total: number; currency: string;
      status: string; docstatus: number; company: string;
      items?: Array<{ item_code: string; item_name: string; qty: number; rate: number; amount: number; uom: string }>;
    }>('Purchase Order', name),
  create: (data: unknown) =>
    createResource('Purchase Order', data),
  update: (name: string, data: unknown) =>
    updateResource('Purchase Order', name, data),
  submit: (name: string) =>
    submitDoc('Purchase Order', name),
};

// ─── Purchase Receipt ─────────────────────────────────────────────────────────
export const purchaseReceiptApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; supplier: string; supplier_name: string; posting_date: string;
      grand_total: number; currency: string; status: string; docstatus: number; company: string;
    }>('Purchase Receipt', params),
  get: (name: string) =>
    getResource<{
      name: string; supplier: string; supplier_name: string; posting_date: string;
      grand_total: number; currency: string; status: string; docstatus: number; company: string;
    }>('Purchase Receipt', name),
  create: (data: unknown) =>
    createResource('Purchase Receipt', data),
  submit: (name: string) =>
    submitDoc('Purchase Receipt', name),
};

// ─── Purchase Invoice ─────────────────────────────────────────────────────────
export const purchaseInvoiceApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; supplier: string; supplier_name: string; posting_date: string;
      due_date: string; grand_total: number; outstanding_amount: number;
      currency: string; status: string; docstatus: number; company: string;
    }>('Purchase Invoice', params),
  get: (name: string) =>
    getResource<{
      name: string; supplier: string; supplier_name: string; posting_date: string;
      due_date: string; grand_total: number; outstanding_amount: number;
      currency: string; status: string; docstatus: number; company: string;
    }>('Purchase Invoice', name),
  create: (data: unknown) =>
    createResource('Purchase Invoice', data),
  submit: (name: string) =>
    submitDoc('Purchase Invoice', name),
};

// ─── Supplier Quotation ───────────────────────────────────────────────────────
export const supplierQuotationApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; supplier: string; supplier_name: string; transaction_date: string;
      valid_till: string; grand_total: number; currency: string;
      status: string; docstatus: number; company: string;
    }>('Supplier Quotation', params),
  get: (name: string) =>
    getResource<{
      name: string; supplier: string; supplier_name: string; transaction_date: string;
      valid_till: string; grand_total: number; currency: string;
      status: string; docstatus: number; company: string;
    }>('Supplier Quotation', name),
  create: (data: unknown) =>
    createResource('Supplier Quotation', data),
};

// ─── Stock Entry ──────────────────────────────────────────────────────────────
export const stockEntryApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; stock_entry_type: string; purpose: string; posting_date: string;
      posting_time: string; docstatus: number; status: string; company: string;
    }>('Stock Entry', params),
  get: (name: string) =>
    getResource<{
      name: string; stock_entry_type: string; purpose: string; posting_date: string;
      posting_time: string; docstatus: number; status: string; company: string;
    }>('Stock Entry', name),
  create: (data: unknown) =>
    createResource('Stock Entry', data),
  update: (name: string, data: unknown) =>
    updateResource('Stock Entry', name, data),
  submit: (name: string) =>
    submitDoc('Stock Entry', name),
};

// ─── Material Request ────────────────────────────────────────────────────────
export const materialRequestApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; title: string; material_request_type: string;
      status: string; docstatus: number; transaction_date: string;
      schedule_date: string; company: string; per_ordered: number;
    }>('Material Request', params),
  get: (name: string) =>
    getResource<{
      name: string; title: string; material_request_type: string;
      status: string; docstatus: number; transaction_date: string;
      schedule_date: string; company: string;
    }>('Material Request', name),
  create: (data: unknown) =>
    createResource('Material Request', data),
  update: (name: string, data: unknown) =>
    updateResource('Material Request', name, data),
  submit: (name: string) =>
    submitDoc('Material Request', name),
};

// ─── Stock Reconciliation ─────────────────────────────────────────────────────
export const stockReconciliationApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; purpose: string; posting_date: string;
      docstatus: number; status: string; company: string;
    }>('Stock Reconciliation', params),
  get: (name: string) =>
    getResource<{
      name: string; purpose: string; posting_date: string;
      docstatus: number; status: string; company: string;
    }>('Stock Reconciliation', name),
  create: (data: unknown) =>
    createResource('Stock Reconciliation', data),
  submit: (name: string) =>
    submitDoc('Stock Reconciliation', name),
};

// ─── Stock Balance ────────────────────────────────────────────────────────────
export const stockBalanceApi = {
  list: (params?: Record<string, unknown>) =>
    callMethod<{ message: Record<string, unknown>[] }>('erpnext.stock.report.stock_balance.stock_balance.get_data', params),
};

// ─── Stock Ledger ─────────────────────────────────────────────────────────────
export const stockLedgerApi = {
  list: (params?: Record<string, unknown>) =>
    callMethod<{ message: Record<string, unknown>[] }>('erpnext.stock.report.stock_ledger.stock_ledger.get_data', params),
};

// ─── Employee ─────────────────────────────────────────────────────────────────
export const employeeApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; employee_name: string; employee_id: string; designation: string;
      department: string; branch: string; status: string;
      date_of_joining: string; company: string;
    }>('Employee', params),
  get: (name: string) =>
    getResource<{
      name: string; employee_name: string; employee_id: string; designation: string;
      department: string; branch: string; status: string;
      date_of_joining: string; company: string;
      gender: string; date_of_birth: string; personal_email: string; cell_number: string;
    }>('Employee', name),
  create: (data: unknown) =>
    createResource('Employee', data),
  update: (name: string, data: unknown) =>
    updateResource('Employee', name, data),
};

// ─── Leave Application ────────────────────────────────────────────────────────
export const leaveApplicationApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; employee: string; employee_name: string; leave_type: string;
      from_date: string; to_date: string; total_leave_days: number;
      status: string; docstatus: number; company: string;
    }>('Leave Application', params),
  get: (name: string) =>
    getResource<{
      name: string; employee: string; employee_name: string; leave_type: string;
      from_date: string; to_date: string; total_leave_days: number;
      status: string; docstatus: number; company: string;
    }>('Leave Application', name),
  create: (data: unknown) =>
    createResource('Leave Application', data),
  update: (name: string, data: unknown) =>
    updateResource('Leave Application', name, data),
  submit: (name: string) =>
    submitDoc('Leave Application', name),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; employee: string; employee_name: string; attendance_date: string;
      status: string; shift: string; in_time: string; out_time: string; company: string;
    }>('Attendance', params),
  get: (name: string) =>
    getResource('Attendance', name),
  create: (data: unknown) =>
    createResource('Attendance', data),
};

// ─── Salary Slip ─────────────────────────────────────────────────────────────
export const salarySlipApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; employee: string; employee_name: string; start_date: string;
      end_date: string; net_pay: number; gross_pay: number; currency: string;
      status: string; docstatus: number; company: string;
    }>('Salary Slip', params),
  get: (name: string) =>
    getResource('Salary Slip', name),
};

// ─── Expense Claim ────────────────────────────────────────────────────────────
export const expenseClaimApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; employee: string; employee_name: string; expense_date: string;
      total_claimed_amount: number; total_sanctioned_amount: number;
      status: string; docstatus: number; company: string;
    }>('Expense Claim', params),
  get: (name: string) =>
    getResource('Expense Claim', name),
  create: (data: unknown) =>
    createResource('Expense Claim', data),
  submit: (name: string) =>
    submitDoc('Expense Claim', name),
};

// ─── Opportunity ──────────────────────────────────────────────────────────────
export const opportunityApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; opportunity_from: string; party_name: string;
      contact_subject: string; opType: string; currency: string;
      'opportunity_amount': number; status: string; docstatus: number; company: string;
    }>('Opportunity', params),
  get: (name: string) =>
    getResource('Opportunity', name),
  create: (data: unknown) =>
    createResource('Opportunity', data),
  update: (name: string, data: unknown) =>
    updateResource('Opportunity', name, data),
};

// ─── Lead ─────────────────────────────────────────────────────────────────────
export const leadApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; lead_name: string; company_name: string; status: string;
      source: string; email_id: string; mobile_no: string; docstatus: number; company: string;
    }>('Lead', params),
  get: (name: string) =>
    getResource('Lead', name),
  create: (data: unknown) =>
    createResource('Lead', data),
  update: (name: string, data: unknown) =>
    updateResource('Lead', name, data),
};

// ─── Project ─────────────────────────────────────────────────────────────────
export const projectApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; project_name: string; status: string;
      project_type: string; percent_complete: number;
      expected_start_date: string; expected_end_date: string; company: string;
    }>('Project', params),
  get: (name: string) =>
    getResource('Project', name),
  create: (data: unknown) =>
    createResource('Project', data),
  update: (name: string, data: unknown) =>
    updateResource('Project', name, data),
};

// ─── Task ─────────────────────────────────────────────────────────────────────
export const taskApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; subject: string; status: string; priority: string;
      project: string; project_name: string; assigned_to: string;
      expStart_date: string; expEnd_date: string; company: string;
    }>('Task', params),
  get: (name: string) =>
    getResource('Task', name),
  create: (data: unknown) =>
    createResource('Task', data),
  update: (name: string, data: unknown) =>
    updateResource('Task', name, data),
};

// ─── Timesheet ────────────────────────────────────────────────────────────────
export const timesheetApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; employee: string; employee_name: string; start_date: string;
      end_date: string; total_billable_hours: number; total_hours: number;
      status: string; docstatus: number; company: string;
    }>('Timesheet', params),
  get: (name: string) =>
    getResource('Timesheet', name),
  create: (data: unknown) =>
    createResource('Timesheet', data),
};

// ─── BOM ─────────────────────────────────────────────────────────────────────
export const bomApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; item: string; item_name: string; BOM_Type: string;
      quantity: number; uom: string; is_active: number; is_default: number; company: string;
    }>('BOM', params),
  get: (name: string) =>
    getResource('BOM', name),
  create: (data: unknown) =>
    createResource('BOM', data),
};

// ─── Work Order ──────────────────────────────────────────────────────────────
export const workOrderApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; production_item: string; item_name: string;
      bom_no: string; status: string; docstatus: number;
      qty: number; produced_qty: number; company: string;
    }>('Work Order', params),
  get: (name: string) =>
    getResource('Work Order', name),
  create: (data: unknown) =>
    createResource('Work Order', data),
  submit: (name: string) =>
    submitDoc('Work Order', name),
};

// ─── Payment Entry ───────────────────────────────────────────────────────────
export const paymentEntryApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; payment_type: string; party_type: string; party: string;
      party_name: string; posting_date: string; paid_amount: number; received_amount: number;
      currency: string; status: string; docstatus: number; company: string;
    }>('Payment Entry', params),
  get: (name: string) =>
    getResource('Payment Entry', name),
  create: (data: unknown) =>
    createResource('Payment Entry', data),
};

// ─── Journal Entry ────────────────────────────────────────────────────────────
export const journalEntryApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; title: string; posting_date: string;
      user_remark: string; total_debit: number; total_credit: number;
      status: string; docstatus: number; company: string;
    }>('Journal Entry', params),
  get: (name: string) =>
    getResource('Journal Entry', name),
  create: (data: unknown) =>
    createResource('Journal Entry', data),
};

// ─── Serial No ───────────────────────────────────────────────────────────────
export const serialNoApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; srNo: string; item_code: string; item_name: string;
      warehouse: string; status: string; purchase_document_type: string;
    }>('Serial No', params),
  get: (name: string) =>
    getResource('Serial No', name),
};

// ─── Batch No ────────────────────────────────────────────────────────────────
export const batchNoApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; batch_id: string; item: string; item_name: string;
      manufacturing_date: string; expiry_date: string; qty: number; warehouse: string;
    }>('Batch', params),
};

// ─── Contact ─────────────────────────────────────────────────────────────────
export const contactApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; first_name: string; last_name: string; email_id: string;
      phone: string; mobile_no: string; is_primary_contact: number; company_name: string;
    }>('Contact', params),
  get: (name: string) =>
    getResource('Contact', name),
};

// ─── Address ─────────────────────────────────────────────────────────────────
export const addressApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; address_title: string; address_type: string; address_line1: string;
      city: string; state: string; country: string; pincode: string; phone: string;
    }>('Address', params),
  get: (name: string) =>
    getResource('Address', name),
};

// ─── Department ───────────────────────────────────────────────────────────────
export const departmentApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{ name: string; department_name: string; parent_department?: string }>('Department', params),
};

// ─── Price List ───────────────────────────────────────────────────────────────
export const priceListApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{ name: string; price_list_name: string; currency: string; enabled: number }>('Price List', params),
};

// ─── Item Price ──────────────────────────────────────────────────────────────
export const itemPriceApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; item_code: string; item_name: string; price_list: string;
      price_list_rate: number; currency: string; uom: string;
    }>('Item Price', params),
  create: (data: unknown) =>
    createResource('Item Price', data),
};

// ─── Session check ─────────────────────────────────────────────────────────────
export async function checkSession(): Promise<string | null> {
  try {
    const res = await authApi.getCurrentUser();
    return res.data?.message || null;
  } catch {
    return null;
  }
}
