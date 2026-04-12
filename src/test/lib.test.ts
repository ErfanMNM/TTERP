import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, formatNumber, debounce } from '../lib/utils';

describe('utils', () => {
  describe('cn()', () => {
    it('merges class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      const flag = true;
      expect(cn('base', flag && 'active', !flag && 'hidden')).toBe('base active');
    });

    it('handles undefined and false', () => {
      expect(cn('foo', undefined, false, 'bar')).toBe('foo bar');
    });
  });

  describe('formatNumber()', () => {
    it('formats integer with locale', () => {
      expect(formatNumber(1234)).toBe('1.234');
    });

    it('formats with decimals', () => {
      expect(formatNumber(1234.5, 2)).toBe('1.234,50');
    });

    it('formats negative numbers', () => {
      expect(formatNumber(-1234.5, 2)).toBe('-1.234,50');
    });

    it('formats zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatCurrency()', () => {
    it('formats VND with currency symbol', () => {
      const result = formatCurrency(1000000);
      expect(result).toMatch(/1/);
      expect(result).toMatch(/₫/);
    });

    it('formats with decimals', () => {
      const result = formatCurrency(1000000.5, 'VND', 2);
      expect(result).toMatch(/1\.000\.000/);
    });
  });

  describe('formatDate()', () => {
    it('formats date string', () => {
      const result = formatDate('2026-04-13');
      expect(result).toMatch(/13/);
      expect(result).toMatch(/04/);
      expect(result).toMatch(/2026/);
    });

    it('formats Date object', () => {
      const result = formatDate(new Date('2026-04-13'));
      expect(result).toMatch(/13/);
    });
  });

  describe('debounce()', async () => {
    it('delays execution', async () => {
      let count = 0;
      const fn = debounce(() => { count++; }, 100);
      fn();
      fn();
      fn();
      expect(count).toBe(0);
      await new Promise(r => setTimeout(r, 150));
      expect(count).toBe(1);
    });
  });
});
