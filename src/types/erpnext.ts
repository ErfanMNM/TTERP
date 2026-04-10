export interface User {
  name: string;
  email: string;
  full_name: string;
  user_image?: string;
  mobile_no?: string;
  department?: string;
  role_profile_name?: string;
}

export interface DocStatus {
  docstatus: number;
  status: string;
  workflow_state?: string;
}

export interface ERPListResponse<T> {
  data: T[];
  count?: number;
  message?: string;
}

export interface ERPDocResponse<T> {
  data: T;
}

export interface TableField {
  item_code: string;
  item_name?: string;
  qty: number;
  rate?: number;
  amount?: number;
  uom?: string;
  stock_uom?: string;
  conversion_factor?: number;
  warehouse?: string;
  basic_rate?: number;
  basic_amount?: number;
  transferred_qty?: number;
  received_qty?: number;
  delivered_qty?: number;
  work_order?: string;
  bom_no?: string;
  description?: string;
  against_sales_order?: string;
  against_sales_order_item?: string;
  purchase_order?: string;
  purchase_order_item?: string;
}

export interface SidebarNavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string | number;
}

export interface SidebarNavGroup {
  title: string;
  icon: string;
  items: SidebarNavItem[];
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T, idx: number) => React.ReactNode;
}

export interface FilterConfig {
  field: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number';
  options?: { value: string; label: string }[];
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
