import * as processor from '../../../src/data/processor.js';

describe('Data Processing Functions', () => {
  describe('convertToISOString', () => {
    it('should convert a date string to an ISO string', () => {
      const date = '2023-01-01';
      const result = processor.convertToISOString(date);
      expect(result).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should convert a timestamp to an ISO string', () => {
      const timestamp = 1672531200000;
      const result = processor.convertToISOString(timestamp);
      expect(result).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should return null for invalid date input', () => {
      const result = processor.convertToISOString('invalid-date');
      expect(result).toBeNull();
    });

    it('should return null for non-string/non-number inputs', () => {
      const result = processor.convertToISOString({});
      expect(result).toBeNull();
    });

    it('should return null for empty string input', () => {
      const result = processor.convertToISOString('');
      expect(result).toBeNull();
    });

    it('should return null for invalid timestamp', () => {
      const result = processor.convertToISOString(NaN);
      expect(result).toBeNull();
    });

    it('should log warnings for invalid input types', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      processor.convertToISOString({});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid date input type'),
      );

      consoleSpy.mockRestore();
    });

    it('should handle edge case with very large timestamp', () => {
      const result = processor.convertToISOString(Number.MAX_SAFE_INTEGER);
      expect(result).toBeNull();
    });

    it('should handle edge case with very small timestamp', () => {
      const result = processor.convertToISOString(Number.MIN_SAFE_INTEGER);
      expect(result).toBeNull();
    });
  });

  describe('roundToDecimal', () => {
    it('should round a number to a specified number of decimal places', () => {
      const result = processor.roundToDecimal(1.23456, 2);
      expect(result).toBe(1.23);
    });

    it('should return null for invalid inputs', () => {
      const result = processor.roundToDecimal('not-a-number', 2);
      expect(result).toBeNull();
    });

    it('should return null for invalid number of decimal places', () => {
      const result = processor.roundToDecimal(1.23456, 'not-a-number');
      expect(result).toBeNull();
    });

    it('should return null for negative number of decimal places', () => {
      const result = processor.roundToDecimal(1.23456, -1);
      expect(result).toBeNull();
    });

    it('should return null for non-integer decimal places', () => {
      const result = processor.roundToDecimal(1.23456, 2.5);
      expect(result).toBeNull();
    });

    it('should round to zero decimal places', () => {
      const result = processor.roundToDecimal(1.23456, 0);
      expect(result).toBe(1);
    });

    it('should round to a large number of decimal places', () => {
      const result = processor.roundToDecimal(1.23456789, 5);
      expect(result).toBe(1.23457);
    });

    it('should handle very large numbers', () => {
      const result = processor.roundToDecimal(1e15, 2);
      expect(result).toBe(1e15);
    });

    it('should handle very small numbers', () => {
      const result = processor.roundToDecimal(1e-15, 10);
      expect(result).toBe(0);
    });

    it('should log warnings for invalid inputs', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      processor.roundToDecimal('not-a-number', 2);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid inputs for rounding'),
      );

      consoleSpy.mockRestore();
    });

    it('should handle NaN input', () => {
      const result = processor.roundToDecimal(NaN, 2);
      expect(result).toBeNull();
    });

    it('should handle Infinity input', () => {
      const result = processor.roundToDecimal(Infinity, 2);
      expect(result).toBeNull();
    });
  });
});
