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

  describe('formatPoolData', () => {
    it('should format APY data correctly', () => {
      const rawData = [
        { timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 },
        { timestamp: '2023-01-02T10:00:00.000Z', apy: 2.34567 },
      ];
      const result = processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', apyPercentage: 1.23 },
        { timestamp: '2023-01-02T00:00:00.000Z', apyPercentage: 2.35 },
      ]);
    });

    it('should format TVL data correctly', () => {
      const rawData = [
        { timestamp: '2023-01-01T10:00:00.000Z', tvlUsd: 123456.7890123 },
        { timestamp: '2023-01-02T10:00:00.000Z', tvlUsd: 234567.8901234 },
      ];
      const result = processor.formatPoolData(rawData, {
        valueField: 'tvlUsd',
        outputField: 'tvlUsd',
        decimalPlaces: 6,
      });
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', tvlUsd: 123456.789012 },
        { timestamp: '2023-01-02T00:00:00.000Z', tvlUsd: 234567.890123 },
      ]);
    });

    it('should return an empty array for non-array input', () => {
      const result = processor.formatPoolData('not-an-array', {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });
      expect(result).toEqual([]);
    });

    it('should log warnings if rawData is not an array', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      processor.formatPoolData('not-an-array', {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('rawData is not an array'),
      );

      consoleSpy.mockRestore();
    });

    it('should return an empty array for empty input', () => {
      const result = processor.formatPoolData([], {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });
      expect(result).toEqual([]);
    });

    it('should filter out objects with missing properties', () => {
      const rawData = [
        { timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 },
        { timestamp: '2023-01-02T10:00:00.000Z' },
        { apy: 3.45678 },
        { timestamp: '2023-01-04T10:00:00.000Z', apy: 4.56789 },
      ];
      const result = processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', apyPercentage: 1.23 },
        { timestamp: '2023-01-04T00:00:00.000Z', apyPercentage: 4.57 },
      ]);
    });

    it('should filter out objects with wrong property types', () => {
      const rawData = [
        { timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 },
        { timestamp: 1234567890, apy: 2.34567 }, // timestamp as number
        { timestamp: '2023-01-03T10:00:00.000Z', apy: '3.45678' }, // apy as string
        { timestamp: '2023-01-04T10:00:00.000Z', apy: 4.56789 },
      ];
      const result = processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', apyPercentage: 1.23 },
        { timestamp: '2023-01-04T00:00:00.000Z', apyPercentage: 4.57 },
      ]);
    });

    it('should filter out objects with invalid timestamp formats', () => {
      const rawData = [
        { timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 },
        { timestamp: 'invalid-date', apy: 2.34567 },
        { timestamp: '2023-13-45', apy: 3.45678 }, // Invalid date
        { timestamp: '2023-01-04T10:00:00.000Z', apy: 4.56789 },
      ];
      const result = processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', apyPercentage: 1.23 },
        { timestamp: '2023-01-04T00:00:00.000Z', apyPercentage: 4.57 },
      ]);
    });

    it('should filter out objects with invalid APY values', () => {
      const rawData = [
        { timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 },
        { timestamp: '2023-01-02T10:00:00.000Z', apy: NaN },
        { timestamp: '2023-01-03T10:00:00.000Z', apy: Infinity },
        { timestamp: '2023-01-04T10:00:00.000Z', apy: -Infinity },
        { timestamp: '2023-01-05T10:00:00.000Z', apy: 5.6789 },
      ];
      const result = processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', apyPercentage: 1.23 },
        { timestamp: '2023-01-05T00:00:00.000Z', apyPercentage: 5.68 },
      ]);
    });

    it('should log warnings for invalid APY data', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const rawData = [
        { timestamp: 'invalid-date', apy: 1.23456 },
        { timestamp: '2023-01-02T10:00:00.000Z', apy: NaN },
      ];

      processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid apy data'),
      );

      consoleSpy.mockRestore();
    });

    it('should handle edge cases with APY values', () => {
      const rawData = [
        { timestamp: '2023-01-01T10:00:00.000Z', apy: 0 },
        { timestamp: '2023-01-02T10:00:00.000Z', apy: -1.23456 },
        { timestamp: '2023-01-03T10:00:00.000Z', apy: 999999.99999 },
        { timestamp: '2023-01-04T10:00:00.000Z', apy: 0.00001 },
      ];
      const result = processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', apyPercentage: 0 },
        { timestamp: '2023-01-02T00:00:00.000Z', apyPercentage: -1.23 },
        { timestamp: '2023-01-03T00:00:00.000Z', apyPercentage: 1000000 },
        { timestamp: '2023-01-04T00:00:00.000Z', apyPercentage: 0 },
      ]);
    });

    it('should handle mixed valid and invalid data correctly', () => {
      const rawData = [
        { timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }, // Valid
        null, // Invalid
        undefined, // Invalid
        { timestamp: 'invalid-date', apy: 2.34567 }, // Invalid timestamp
        { timestamp: '2023-01-05T10:00:00.000Z', apy: 'not-a-number' }, // Invalid apy
        { timestamp: '2023-01-06T10:00:00.000Z', apy: NaN }, // Invalid apy
        { timestamp: '2023-01-07T10:00:00.000Z', apy: 7.89012 }, // Valid
      ];
      const result = processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', apyPercentage: 1.23 },
        { timestamp: '2023-01-07T00:00:00.000Z', apyPercentage: 7.89 },
      ]);
    });

    it('should handle TVL data with different decimal places', () => {
      const rawData = [
        { timestamp: '2023-01-01T10:00:00.000Z', tvlUsd: 123456.7890123 },
        { timestamp: '2023-01-02T10:00:00.000Z', tvlUsd: 234567.8901234 },
      ];
      const result = processor.formatPoolData(rawData, {
        valueField: 'tvlUsd',
        outputField: 'tvlUsd',
        decimalPlaces: 6,
      });
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', tvlUsd: 123456.789012 },
        { timestamp: '2023-01-02T00:00:00.000Z', tvlUsd: 234567.890123 },
      ]);
    });

    it('should handle TVL data with different output field name', () => {
      const rawData = [
        { timestamp: '2023-01-01T10:00:00.000Z', tvlUsd: 123456.7890123 },
        { timestamp: '2023-01-02T10:00:00.000Z', tvlUsd: 234567.8901234 },
      ];
      const result = processor.formatPoolData(rawData, {
        valueField: 'tvlUsd',
        outputField: 'totalValueLocked',
        decimalPlaces: 6,
      });
      expect(result).toEqual([
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          totalValueLocked: 123456.789012,
        },
        {
          timestamp: '2023-01-02T00:00:00.000Z',
          totalValueLocked: 234567.890123,
        },
      ]);
    });

    it('should return an empty array when options parameter is missing', () => {
      const rawData = [
        { timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 },
        { timestamp: '2023-01-02T10:00:00.000Z', apy: 2.34567 },
      ];
      const result = processor.formatPoolData(rawData);
      expect(result).toEqual([]);
    });

    it('should log a warning when options parameter is missing', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const rawData = [{ timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }];

      processor.formatPoolData(rawData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'options parameter is missing or not an object',
        ),
      );

      consoleSpy.mockRestore();
    });

    it('should return an empty array when options is not an object', () => {
      const rawData = [{ timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }];
      const result = processor.formatPoolData(rawData, 'not-an-object');
      expect(result).toEqual([]);
    });

    it('should return an empty array when valueField is missing', () => {
      const rawData = [{ timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }];
      const result = processor.formatPoolData(rawData, {
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });
      expect(result).toEqual([]);
    });

    it('should log a warning when valueField is missing', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const rawData = [{ timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }];

      processor.formatPoolData(rawData, {
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'options.valueField is missing or not a string',
        ),
      );

      consoleSpy.mockRestore();
    });

    it('should return an empty array when valueField is not a string', () => {
      const rawData = [{ timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }];
      const result = processor.formatPoolData(rawData, {
        valueField: 123,
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });
      expect(result).toEqual([]);
    });

    it('should return an empty array when outputField is missing', () => {
      const rawData = [{ timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }];
      const result = processor.formatPoolData(rawData, {
        valueField: 'apy',
        decimalPlaces: 2,
      });
      expect(result).toEqual([]);
    });

    it('should log a warning when outputField is missing', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const rawData = [{ timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }];

      processor.formatPoolData(rawData, {
        valueField: 'apy',
        decimalPlaces: 2,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'options.outputField is missing or not a string',
        ),
      );

      consoleSpy.mockRestore();
    });

    it('should return an empty array when outputField is not a string', () => {
      const rawData = [{ timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }];
      const result = processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 123,
        decimalPlaces: 2,
      });
      expect(result).toEqual([]);
    });

    it('should return an empty array when decimalPlaces is missing', () => {
      const rawData = [{ timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }];
      const result = processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 'apyPercentage',
      });
      expect(result).toEqual([]);
    });

    it('should log a warning when decimalPlaces is missing', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const rawData = [{ timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }];

      processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 'apyPercentage',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'options.decimalPlaces is missing, not an integer, or negative',
        ),
      );

      consoleSpy.mockRestore();
    });

    it('should return an empty array when decimalPlaces is not a number', () => {
      const rawData = [{ timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }];
      const result = processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: '2',
      });
      expect(result).toEqual([]);
    });

    it('should return an empty array when decimalPlaces is not an integer', () => {
      const rawData = [{ timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }];
      const result = processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: 2.5,
      });
      expect(result).toEqual([]);
    });

    it('should return an empty array when decimalPlaces is negative', () => {
      const rawData = [{ timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 }];
      const result = processor.formatPoolData(rawData, {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: -1,
      });
      expect(result).toEqual([]);
    });
  });
});
