import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercentage, formatPrediction } from '../utils/formatters';

describe('Frontend Formatters', () => {
  it('should format percentage', () => {
    expect(formatPercentage(0.825)).toBe('82.50%');
    expect(formatPercentage(1)).toBe('100.00%');
    expect(formatPercentage(0)).toBe('0.00%');
  });

  it('should format predictions with appropriate status color', () => {
    const eligible = formatPrediction('Likely Eligible');
    expect(eligible.label).toBe('Likely Eligible');
    expect(eligible.color).toBe('success');

    const notEligible = formatPrediction('Likely Not Eligible');
    expect(notEligible.label).toBe('Likely Not Eligible');
    expect(notEligible.color).toBe('danger');
  });
});
