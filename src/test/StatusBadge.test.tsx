import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders status text', () => {
    render(<StatusBadge status="Draft" />);
    expect(screen.getByText('Nháp')).toBeInTheDocument();
  });

  it('applies chip-gray for Draft', () => {
    const { container } = render(<StatusBadge status="Draft" />);
    expect(container.querySelector('.chip-gray')).toBeInTheDocument();
  });

  it('applies chip-green for Submitted', () => {
    const { container } = render(<StatusBadge status="Submitted" />);
    expect(container.querySelector('.chip-green')).toBeInTheDocument();
  });

  it('applies chip-red for Cancelled', () => {
    const { container } = render(<StatusBadge status="Cancelled" />);
    expect(container.querySelector('.chip-red')).toBeInTheDocument();
  });

  it('applies chip-blue for Open', () => {
    const { container } = render(<StatusBadge status="Open" />);
    expect(container.querySelector('.chip-blue')).toBeInTheDocument();
  });

  it('returns null for undefined status', () => {
    const { container } = render(<StatusBadge status={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders dot variant', () => {
    const { container } = render(<StatusBadge status="Draft" dot={true} />);
    expect(container.querySelector('.status-dot')).toBeInTheDocument();
  });

  it('uses custom label when provided', () => {
    render(<StatusBadge status="Draft" label="Bản nháp" />);
    expect(screen.getByText('Bản nháp')).toBeInTheDocument();
  });

  it('falls back to raw key for unknown status', () => {
    render(<StatusBadge status="UnknownStatus" />);
    expect(screen.getByText('UnknownStatus')).toBeInTheDocument();
  });
});
