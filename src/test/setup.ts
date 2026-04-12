import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// ─── Mock ERPNext API via MSW ────────────────────────────────────────────────

export const server = setupServer(
  // Auth
  http.post('/api/method/login', () =>
    HttpResponse.json({ message: 'Logged In' })
  ),
  http.post('/api/method/logout', () =>
    HttpResponse.json({ message: 'Logged Out' })
  ),
  http.get('/api/method/frappe.auth.get_logged_user', () =>
    HttpResponse.json({ message: 'Administrator' })
  ),

  // Stock Balance (via /resource/Bin)
  http.get('/api/resource/Bin', () =>
    HttpResponse.json({
      data: [
        { item_code: 'MAT001', warehouse: 'Kho 1', actual_qty: 100, ordered_qty: 50, projected_qty: 150, reserved_qty: 0, stock_uom: 'Cái', stock_value: 500000 },
        { item_code: 'MAT002', warehouse: 'Kho 1', actual_qty: 0, ordered_qty: 200, projected_qty: 200, reserved_qty: 0, stock_uom: 'Cái', stock_value: 0 },
        { item_code: 'MAT003', warehouse: 'Kho 2', actual_qty: -5, ordered_qty: 10, projected_qty: 5, reserved_qty: 0, stock_uom: 'Cái', stock_value: -50000 },
      ],
    })
  ),

  // Stock Ledger
  http.get('/api/resource/Stock%20Ledger%20Entry', () =>
    HttpResponse.json({
      message: [
        { item_code: 'MAT001', posting_date: '2026-04-10', voucher_type: 'Stock Entry', voucher_no: 'STE-001', qty_in: 100, qty_out: 0, balance_qty: 100 },
        { item_code: 'MAT001', posting_date: '2026-04-11', voucher_type: 'Stock Entry', voucher_no: 'STE-002', qty_in: 0, qty_out: 20, balance_qty: 80 },
      ],
    })
  ),

  // Resource endpoints
  http.get('/api/resource/Company', () =>
    HttpResponse.json({
      data: [
        { name: 'C001', company_name: 'MTE Corp', default_currency: 'VND' },
      ],
    })
  ),

  http.get('/api/resource/Warehouse', () =>
    HttpResponse.json({
      data: [
        { name: 'W001', warehouse_name: 'Kho 1', company: 'C001' },
        { name: 'W002', warehouse_name: 'Kho 2', company: 'C001' },
      ],
    })
  ),

  // Catch-all: log unexpected requests, return empty success
  http.all('/*', ({ request }) => {
    console.warn('[MSW] Unhandled request:', request.method, request.url);
    return HttpResponse.json({ message: null });
  }),
);

// Start server before all tests, stop after all
export function setup() {
  server.listen({ onUnhandledRequest: 'warn' });
}

export function teardown() {
  server.close();
}
