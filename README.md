# ERP MT&E — React Frontend for ERPNext

## Giới thiệu

Giao diện web hiện đại cho ERPNext (`erp.mte.vn`), được xây dựng bằng React + Vite + TypeScript + TailwindCSS.

## Tính năng

- **Đăng nhập** — Xác thực qua session cookie của ERPNext
- **Dashboard** — Thống kê tổng quan, thao tác nhanh, đơn hàng gần đây
- **Bán hàng** — Báo giá, Đơn hàng bán, Giao hàng, Hóa đơn, Khách hàng
- **Mua hàng** — Báo giá NCC, Đơn mua, Nhận hàng, Hóa đơn, Nhà cung cấp
- **Kho & Vật tư** — Vật tư, Tồn kho, Nhập/Xuất kho, Yêu cầu vật tư, Sổ kho
- **Nhân sự** — Nhân viên, Xin nghỉ, Chấm công, Bảng lương, Chi phí
- **CRM** — Cơ hội, Khách hàng tiềm năng, Liên hệ
- **Dự án** — Dự án, Công việc, Bảng công
- **Kế toán** — Hóa đơn, Thanh toán, Bút toán
- **Sản xuất** — Định mức (BOM), Lệnh sản xuất

## Cài đặt

```bash
npm install
npm run dev
```

Mở trình duyệt: http://localhost:5173

## Kiến trúc

- **Dev**: Vite proxy `/api/*` → `https://erp.mte.vn/api/*`
- **Styling**: TailwindCSS v4, Google Material Design 3 style
- **Icons**: lucide-react
- **HTTP**: axios với `withCredentials: true`
- **Routing**: React Router v7

## Cấu trúc thư mục

```
src/
├── components/     # Layout, DataTable, StatusBadge, FormDialog...
├── contexts/       # AuthContext, AppContext
├── hooks/         # useDebounce, useTableState, useLocalStorage
├── lib/           # utils.ts — cn(), formatCurrency, formatDate
├── pages/         # Tất cả các trang theo module
├── services/      # api.ts — tất cả API gọi đến ERPNext
└── types/         # erpnext.ts — TypeScript interfaces
```
