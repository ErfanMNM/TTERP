import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataTable from '../components/DataTable';

const COLUMNS = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Tên', sortable: false },
];

const ROWS = [
  { id: '001', name: 'Vật tư A' },
  { id: '002', name: 'Vật tư B' },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={COLUMNS} data={ROWS} rowKey="id" />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Tên')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<DataTable columns={COLUMNS} data={ROWS} rowKey="id" />);
    expect(screen.getByText('Vật tư A')).toBeInTheDocument();
    expect(screen.getByText('Vật tư B')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={[]}
        rowKey="id"
        emptyText="Không có dữ liệu"
        emptyIcon={<span>📦</span>}
      />
    );
    expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
  });

  it('shows search input when showSearch is true', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={ROWS}
        rowKey="id"
        showSearch={true}
        searchValue=""
        onSearchChange={() => {}}
      />
    );
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders loading skeleton', () => {
    render(<DataTable columns={COLUMNS} data={[]} rowKey="id" loading={true} rows={5} />);
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders pagination when showPagination is true', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={ROWS}
        rowKey="id"
        showPagination={true}
        page={1}
        pageSize={10}
        onPageChange={() => {}}
        total={50}
      />
    );
    expect(screen.getByText('Hiển thị 1–10 của 50 bản ghi')).toBeInTheDocument();
    expect(screen.getByText(/Trang 1 \/ 5/)).toBeInTheDocument();
  });
});