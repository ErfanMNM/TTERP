import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import StockBalance from '../pages/stock/StockBalance';
import { setup as setupServer, teardown as teardownServer } from './setup';

beforeAll(() => setupServer());
afterAll(() => teardownServer());

describe('StockBalance', () => {
  it('renders page title', async () => {
    render(<StockBalance />, { wrapper: MemoryRouter });
    expect(screen.getByText('Tồn kho')).toBeInTheDocument();
    expect(screen.getByText('Báo cáo số dư tồn kho theo vật tư và kho')).toBeInTheDocument();
  });

  it('renders summary cards after data loads', async () => {
    render(<StockBalance />, { wrapper: MemoryRouter });
    await screen.findByText('Tổng vật tư');
    // Cards: label + value pair
    const cardLabels = screen.getAllByText('Tổng vật tư');
    expect(cardLabels.length).toBeGreaterThan(0);
    // Check value of summary cards by class - verify data rendered
    const cardValues = document.querySelectorAll('.text-xl.font-bold');
    expect(cardValues.length).toBeGreaterThanOrEqual(4); // 4 summary cards
  });

  it('renders stock data rows', async () => {
    render(<StockBalance />, { wrapper: MemoryRouter });
    await screen.findByText('MAT001');
    expect(screen.getByText('MAT001')).toBeInTheDocument();
    expect(screen.getByText('MAT002')).toBeInTheDocument();
    expect(screen.getByText('MAT003')).toBeInTheDocument();
  });

  it('renders action buttons', async () => {
    render(<StockBalance />, { wrapper: MemoryRouter });
    expect(screen.getByText('Làm mới')).toBeInTheDocument();
    expect(screen.getByText('Xuất CSV')).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    const user = userEvent.setup();
    render(<StockBalance />, { wrapper: MemoryRouter });
    const refreshBtn = screen.getByTitle('Làm mới');
    await user.click(refreshBtn);
    // No error should occur
  });
});
