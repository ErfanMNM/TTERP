import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
  },
});

// ERPNext /api/method/ expects x-www-form-urlencoded, not JSON
api.interceptors.request.use((config) => {
  if (config.method === 'get' || config.method === 'GET') {
    delete config.headers['Content-Type'];
  }
  // ERPNext doesn't support 100-continue; remove it to avoid 417
  delete config.headers['Expect'];
  return config;
});

// ─── Reportview ───────────────────────────────────────────────────────────────
// ERPNext's frappe.desk.reportview.get_count and get — uses fetch directly
// to avoid axios body-transform quirks (100-continue, JSON-stringifying, etc.)
export async function reportview<T>(method: string, params: Record<string, unknown>): Promise<T> {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    body.set(k, typeof v === 'string' ? v : JSON.stringify(v));
  }
  const headers = new Headers({
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  });
  // Ensure no 100-continue expectation header
  headers.set('Expect', '');

  const res = await fetch(`/api/method/${method}`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body,
  });

  // ERPNext may return error as JSON with "exception" field
  const data = await res.json();
  if (data?.exception) {
    throw new Error(data.message || data.exception || 'API Error');
  }
  return data;
}

// ─── getDoc — load full doctype document + docinfo in one call ──────
export interface DocInfo {
  user_info: Record<string, unknown>;
  comments: Array<{ name: string; content: string; owner: string; creation: string; comment_type: string }>;
  attachments: Array<{ name: string; file_name: string; file_url: string; is_private: number }>;
  shared: Array<Record<string, unknown>>;
  assignment_logs: Array<Record<string, unknown>>;
  attachment_logs: Array<Record<string, unknown>>;
  versions: Array<{ name: string; owner: string; creation: string; data: string }>;
  assignments: Array<{ name: string; owner: string; description: string }>;
}

export interface GetDocResult<T = Record<string, unknown>> {
  docs: T[];
  docinfo: DocInfo;
  _link_titles: Record<string, unknown>;
}

export async function getDoc<T = Record<string, unknown>>(doctype: string, name: string): Promise<GetDocResult<T>> {
  const params = new URLSearchParams({ doctype, name });
  const headers = new Headers({
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  });
  headers.set('Expect', '');

  const res = await fetch(`/api/method/frappe.desk.form.load.getdoc?${params}`, {
    method: 'POST',
    credentials: 'include',
    headers,
  });

  const data = await res.json();
  if (data?.exception) throw new Error(data.message || data.exception);
  return data;
}

// Generic getCount — works for any doctype
export async function getCount(
  doctype: string,
  filters?: unknown[],
): Promise<number> {
  const res = await reportview<{ message: number }>('frappe.desk.reportview.get_count', {
    doctype,
    filters: JSON.stringify(filters ?? []),
    fields: JSON.stringify([]),
    distinct: false,
    limit: 1001,
  });
  return res.message ?? 0;
}

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

export async function callMethod<T = unknown>(method: string, args?: Record<string, unknown>) {
  // ERPNext /api/method/ expects a single "args" key containing a JSON string
  const params = new URLSearchParams({ args: JSON.stringify(args ?? {}) });
  const res = await api.post<T>(`/method/${method}`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data;
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

  // Lấy tổng số Item
  getCount: (params: {
    doctype: string;
    filters?: unknown[];
    fields?: unknown[];
    distinct?: boolean;
    limit?: number;
  }) =>
    reportview<{ message: number }>('frappe.desk.reportview.get_count', {
      doctype: params.doctype,
      filters: JSON.stringify(params.filters ?? [['Item', 'disabled', '=', 0]]),
      fields: JSON.stringify(params.fields ?? []),
      distinct: params.distinct ?? false,
      limit: params.limit ?? 1001,
    }),

  // Lấy danh sách Item
  getList: (params: {
    pageLength?: number;
    start?: number;
    search?: string;
    filters?: unknown[];
  }) =>
    reportview<{
      message: Array<{
        name: string;
        item_name: string;
        item_code: string;
        item_group: string;
        stock_uom: string;
        image?: string;
        disabled: number;
      }>;
    }>('frappe.desk.reportview.get', {
      doctype: 'Item',
      fields: JSON.stringify([
        '`tabItem`.`name`',
        '`tabItem`.`item_name`',
        '`tabItem`.`item_code`',
        '`tabItem`.`item_group`',
        '`tabItem`.`stock_uom`',
        '`tabItem`.`image`',
        '`tabItem`.`disabled`',
      ]),
      filters: JSON.stringify(params.filters ?? [['Item', 'disabled', '=', 0]]),
      order_by: '`tabItem`.`creation` desc',
      start: params.start ?? 0,
      page_length: params.pageLength ?? 20,
      view: 'List',
      group_by: '',
      with_comment_count: false,
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
  list: async (params?: { warehouse?: string; item_code?: string; limit?: number; start?: number; search?: string }) => {
    const filters: string[] = [];
    if (params?.warehouse) filters.push(['Bin', 'warehouse', '=', params.warehouse]);
    if (params?.item_code) filters.push(['Bin', 'item_code', '=', params.item_code]);
    if (params?.search) filters.push(['Bin', 'item_code', 'like', '%' + params.search + '%']);

    const res = await api.get<{ data: Array<{
      item_code: string; warehouse: string;
      actual_qty: number; ordered_qty: number; projected_qty: number;
      reserved_qty: number; stock_uom: string; stock_value: number;
    }> }>('/resource/Bin', {
      params: {
        fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty', 'ordered_qty', 'projected_qty', 'reserved_qty', 'stock_uom', 'stock_value']),
        filters: JSON.stringify(filters),
        limit_page_length: params?.limit ?? 10000,
        limit_start: params?.start ?? 0,
      },
    });
    const bins = res.data.data ?? [];

    // Enrich with item_name, item_group from Item doctype
    const codes = [...new Set(bins.map(b => b.item_code).filter(Boolean))];
    if (codes.length === 0) return { message: bins };

    let itemMap: Record<string, { item_name: string; item_group: string }> = {};
    try {
      const itemRes = await api.get<{ data: Array<{
        name: string; item_name: string; item_group: string;
      }> }>('/resource/Item', {
        params: {
          fields: JSON.stringify(['name', 'item_name', 'item_group']),
          filters: JSON.stringify([['Item', 'name', 'in', codes]]),
          limit_page_length: 10000,
        },
      });
      for (const it of itemRes.data.data ?? []) {
        itemMap[it.name] = { item_name: it.item_name, item_group: it.item_group };
      }
    } catch {
      // Enrichment failed, continue without item_name
    }

    const enriched = bins.map(bin => ({
      ...bin,
      item_name: itemMap[bin.item_code]?.item_name ?? null,
      item_group: itemMap[bin.item_code]?.item_group ?? null,
    }));
    return { message: enriched };
  },
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

export const commentApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; comment_type: string; content: string;
      owner: string; creation: string;
    }>('Comment', params),
  create: (data: { comment_type: string; content: string; reference_doctype: string; reference_name: string }) =>
    createResource('Comment', data),
  update: (name: string, data: { content: string }) =>
    updateResource('Comment', name, data),
  delete: (name: string) =>
    api.delete(`/resource/Comment/${name}`),
};

export const versionApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; owner: string; modified: string;
      ref_doctype: string; docname: string; data: string;
    }>('Version', params),
};

// ─── searchLink — generic autocomplete/search by doctype ────────────────────
export async function searchLink(
  doctype: string,
  txt: string,
  filters?: Record<string, string>,
): Promise<Array<{ value: string; description: string; label: string }>> {
  const params = new URLSearchParams({ doctype, txt });
  if (filters) {
    params.set('filters', JSON.stringify(filters));
  }
  const headers = new Headers({
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  });
  headers.set('Expect', '');
  const res = await fetch(`/api/method/frappe.desk.search.search_link?${params}`, {
    method: 'GET',
    credentials: 'include',
    headers,
  });
  const data = await res.json();
  if (data?.exception) throw new Error(data.message || data.exception);
  return data.message ?? [];
}

// ─── ToDo ─────────────────────────────────────────────────────────────────────
export const toDoApi = {
  list: (params?: Record<string, unknown>) =>
    listResource<{
      name: string; description: string; status: string;
      assigned_by: string;
      reference_type: string; reference_name: string;
      date: string; priority: string; creation: string;
    }>('ToDo', params),
  getList: (params: Record<string, unknown>) =>
    reportview<{
      message: Array<{
        name: string; description: string; status: string;
        assigned_by: string; _assign: string;
        reference_type: string; reference_name: string;
        date: string; priority: string; creation: string;
      }>;
    }>('frappe.desk.reportview.get', {
      doctype: 'ToDo',
      fields: JSON.stringify([
        '`tabToDo`.`name`',
        '`tabToDo`.`description`',
        '`tabToDo`.`status`',
        '`tabToDo`.`assigned_by`',
        '`tabToDo`.`_assign`',
        '`tabToDo`.`reference_type`',
        '`tabToDo`.`reference_name`',
        '`tabToDo`.`date`',
        '`tabToDo`.`priority`',
        '`tabToDo`.`creation`',
      ]),
      ...(params.filters ? { filters: params.filters } : {}),
      order_by: '`tabToDo`.`creation` desc',
      start: (params.start as number) ?? 0,
      page_length: (params.page_length as number) ?? 50,
      view: 'List',
      group_by: '',
      with_comment_count: false,
    }),
  create: (data: unknown) =>
    createResource('ToDo', data),
  update: (name: string, data: unknown) =>
    updateResource('ToDo', name, data),
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
