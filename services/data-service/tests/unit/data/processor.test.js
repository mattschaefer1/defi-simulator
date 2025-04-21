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

  describe('formatPriceData', () => {
    it('should format price data correctly', () => {
      const rawData = [
        [1672531200000, 123456.7890123],
        [1672617600000, 234567.8901234],
      ];
      const result = processor.formatPriceData(rawData);
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 123456.789012 },
        { timestamp: '2023-01-02T00:00:00.000Z', priceUsd: 234567.890123 },
      ]);
    });

    it('should return an empty array for non-array input', () => {
      const result = processor.formatPriceData('not-an-array');
      expect(result).toEqual([]);
    });

    it('should log warnings if rawData is not an array', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      processor.formatPriceData('not-an-array');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('rawData is not an array'),
      );

      consoleSpy.mockRestore();
    });

    it('should return an empty array for empty input', () => {
      const result = processor.formatPriceData([]);
      expect(result).toEqual([]);
    });

    it('should filter out non-array items', () => {
      const rawData = [
        [1672531200000, 123456.7890123],
        'not-an-array',
        123,
        { timestamp: 1672531200000, price: 123456.7890123 },
        [1672876800000, 234567.8901234],
      ];
      const result = processor.formatPriceData(rawData);
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 123456.789012 },
        { timestamp: '2023-01-05T00:00:00.000Z', priceUsd: 234567.890123 },
      ]);
    });

    it('should filter out arrays with wrong length', () => {
      const rawData = [
        [1672531200000, 123456.7890123],
        [1672617600000], // Missing price
        [1672704000000, 345678.9012345, 456789.0123456], // Extra element
        [1672790400000, 567890.1234567],
      ];
      const result = processor.formatPriceData(rawData);
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 123456.789012 },
        { timestamp: '2023-01-04T00:00:00.000Z', priceUsd: 567890.123457 },
      ]);
    });

    it('should filter out arrays with wrong element types', () => {
      const rawData = [
        [1672531200000, 123456.7890123],
        ['1672617600000', 234567.8901234], // timestamp as string
        [1672704000000, '345678.9012345'], // price as string
        [1672790400000, 567890.1234567],
      ];
      const result = processor.formatPriceData(rawData);
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 123456.789012 },
        { timestamp: '2023-01-04T00:00:00.000Z', priceUsd: 567890.123457 },
      ]);
    });

    it('should filter out arrays with invalid timestamp values', () => {
      const rawData = [
        [1672531200000, 123456.7890123],
        [NaN, 234567.8901234],
        [Infinity, 345678.9012345],
        [-Infinity, 456789.0123456],
        [1672876800000, 567890.1234567],
      ];
      const result = processor.formatPriceData(rawData);
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 123456.789012 },
        { timestamp: '2023-01-05T00:00:00.000Z', priceUsd: 567890.123457 },
      ]);
    });

    it('should filter out arrays with invalid price values', () => {
      const rawData = [
        [1672531200000, 123456.7890123],
        [1672617600000, NaN],
        [1672704000000, Infinity],
        [1672790400000, -Infinity],
        [1672876800000, 567890.1234567],
      ];
      const result = processor.formatPriceData(rawData);
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 123456.789012 },
        { timestamp: '2023-01-05T00:00:00.000Z', priceUsd: 567890.123457 },
      ]);
    });

    it('should log warnings for invalid price data', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const rawData = [
        [NaN, 123456.7890123],
        [1672617600000, Infinity],
      ];

      processor.formatPriceData(rawData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid price data'),
      );

      consoleSpy.mockRestore();
    });

    it('should handle edge cases with price values', () => {
      const rawData = [
        [1672531200000, 0],
        [1672617600000, -1.2345678],
        [1672704000000, 999999.9999999],
        [1672790400000, 0.0000001],
      ];
      const result = processor.formatPriceData(rawData);
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 0 },
        { timestamp: '2023-01-02T00:00:00.000Z', priceUsd: -1.234568 },
        { timestamp: '2023-01-03T00:00:00.000Z', priceUsd: 1000000 },
        { timestamp: '2023-01-04T00:00:00.000Z', priceUsd: 0 },
      ]);
    });

    it('should handle mixed valid and invalid data correctly', () => {
      const rawData = [
        [1672531200000, 1234.5678901],
        'not-an-array',
        123,
        [NaN, 2345.6789012],
        [1672704000000, '3456.7890123'],
        [1672790400000, Infinity],
        [1672876800000, 56789.0123456],
      ];
      const result = processor.formatPriceData(rawData);
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 1234.56789 },
        { timestamp: '2023-01-05T00:00:00.000Z', priceUsd: 56789.012346 },
      ]);
    });

    it('should handle invalid data within arrays', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const priceData = {
        token1: [
          [1672531200000, 1234.5678],
          'not-an-array',
          [1672704000000, 'not-a-number'],
          [1672790400000, 3456.789],
        ],
        token2: [
          [1672531200000, 45678.9012],
          [1672617600000, 56789.0123],
        ],
      };

      const result = processor.processPriceDataResponse(priceData);

      expect(result).toEqual({
        token1: [
          { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 1234.5678 },
          { timestamp: '2023-01-04T00:00:00.000Z', priceUsd: 3456.789 },
        ],
        token2: [
          { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 45678.9012 },
          { timestamp: '2023-01-02T00:00:00.000Z', priceUsd: 56789.0123 },
        ],
      });

      // The formatPriceData function silently filters out invalid entries
      // without logging warnings
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('formatUniswapPoolData', () => {
    it('should format Uniswap pool data correctly', () => {
      const rawData = [
        {
          date: 1672617600,
          feesUSD: '234.5678901',
          volumeUSD: '23456.7890123',
        },
        {
          date: 1672531200,
          feesUSD: '123.4567890',
          volumeUSD: '12345.6789012',
        },
      ];
      const result = processor.formatUniswapPoolData(rawData);
      expect(result).toEqual([
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          feesUSD: 123.456789,
          volumeUSD: 12345.678901,
        },
        {
          timestamp: '2023-01-02T00:00:00.000Z',
          feesUSD: 234.56789,
          volumeUSD: 23456.789012,
        },
      ]);
    });

    it('should return an empty array for non-array input', () => {
      const result = processor.formatUniswapPoolData('not-an-array');
      expect(result).toEqual([]);
    });

    it('should log an error if rawData is not an array', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      processor.formatUniswapPoolData('not-an-array');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('rawData is not an array'),
      );

      consoleSpy.mockRestore();
    });

    it('should return an empty array for empty input', () => {
      const result = processor.formatUniswapPoolData([]);
      expect(result).toEqual([]);
    });

    it('should filter out objects with missing properties', () => {
      const rawData = [
        {
          date: 1672876800,
          feesUSD: '567.8901234',
          volumeUSD: '56789.0123456',
        },
        { feesUSD: '456.7890123', volumeUSD: '45678.90123455' }, // Missing date
        { date: 1672704000, volumeUSD: '34567.89012344' }, // Missing feesUSD
        { date: 1672617600, feesUSD: '234.5678901' }, // Missing volumeUSD
        {
          date: 1672531200,
          feesUSD: '123.4567890',
          volumeUSD: '12345.6789012',
        },
      ];
      const result = processor.formatUniswapPoolData(rawData);
      expect(result).toEqual([
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          feesUSD: 123.456789,
          volumeUSD: 12345.678901,
        },
        {
          timestamp: '2023-01-05T00:00:00.000Z',
          feesUSD: 567.890123,
          volumeUSD: 56789.012346,
        },
      ]);
    });

    it('should filter out objects with wrong property types', () => {
      const rawData = [
        {
          date: 1672876800,
          feesUSD: '567.8901234',
          volumeUSD: '56789.0123456',
        },
        { date: 1672790400, feesUSD: '456.7890123', volumeUSD: 45678.9012345 }, // volumeUSD as number
        { date: 1672704000, feesUSD: 345.6789012, volumeUSD: '34567.8901234' }, // feesUSD as number
        {
          date: '1672617600',
          feesUSD: '234.5678901',
          volumeUSD: '23456.7890123',
        }, // date as string
        {
          date: 1672531200,
          feesUSD: '123.4567890',
          volumeUSD: '12345.6789012',
        },
      ];
      const result = processor.formatUniswapPoolData(rawData);
      expect(result).toEqual([
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          feesUSD: 123.456789,
          volumeUSD: 12345.678901,
        },
        {
          timestamp: '2023-01-05T00:00:00.000Z',
          feesUSD: 567.890123,
          volumeUSD: 56789.012346,
        },
      ]);
    });

    it('should filter out objects with invalid date values', () => {
      const rawData = [
        {
          date: 1672876800,
          feesUSD: '567.8901234',
          volumeUSD: '56789.0123456',
        },
        { date: -Infinity, feesUSD: '456.7890123', volumeUSD: '45678.9012345' },
        { date: Infinity, feesUSD: '345.6789012', volumeUSD: '34567.8901234' },
        { date: NaN, feesUSD: '234.5678901', volumeUSD: '23456.7890123' },
        {
          date: 1672531200,
          feesUSD: '123.4567890',
          volumeUSD: '12345.6789012',
        },
      ];
      const result = processor.formatUniswapPoolData(rawData);
      expect(result).toEqual([
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          feesUSD: 123.456789,
          volumeUSD: 12345.678901,
        },
        {
          timestamp: '2023-01-05T00:00:00.000Z',
          feesUSD: 567.890123,
          volumeUSD: 56789.012346,
        },
      ]);
    });

    it('should filter out objects with invalid feesUSD values', () => {
      const rawData = [
        {
          date: 1672876800,
          feesUSD: '567.8901234',
          volumeUSD: '56789.0123456',
        },
        { date: 1672790400, feesUSD: 'Infinity', volumeUSD: '45678.9012345' },
        { date: 1672704000, feesUSD: 'NaN', volumeUSD: '34567.8901234' },
        {
          date: 1672617600,
          feesUSD: 'not-a-number',
          volumeUSD: '23456.7890123',
        },
        {
          date: 1672531200,
          feesUSD: '123.4567890',
          volumeUSD: '12345.6789012',
        },
      ];
      const result = processor.formatUniswapPoolData(rawData);
      expect(result).toEqual([
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          feesUSD: 123.456789,
          volumeUSD: 12345.678901,
        },
        {
          timestamp: '2023-01-05T00:00:00.000Z',
          feesUSD: 567.890123,
          volumeUSD: 56789.012346,
        },
      ]);
    });

    it('should filter out objects with invalid volumeUSD values', () => {
      const rawData = [
        {
          date: 1672876800,
          feesUSD: '567.8901234',
          volumeUSD: '56789.0123456',
        },
        { date: 1672790400, feesUSD: '456.7890123', volumeUSD: 'Infinity' },
        { date: 1672704000, feesUSD: '345.6789012', volumeUSD: 'NaN' },
        { date: 1672617600, feesUSD: '234.5678901', volumeUSD: 'not-a-number' },
        {
          date: 1672531200,
          feesUSD: '123.4567890',
          volumeUSD: '12345.6789012',
        },
      ];
      const result = processor.formatUniswapPoolData(rawData);
      expect(result).toEqual([
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          feesUSD: 123.456789,
          volumeUSD: 12345.678901,
        },
        {
          timestamp: '2023-01-05T00:00:00.000Z',
          feesUSD: 567.890123,
          volumeUSD: 56789.012346,
        },
      ]);
    });

    it('should log warnings for invalid Uniswap pool data', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const rawData = [
        {
          date: 1672531200,
          feesUSD: 'not-a-number',
          volumeUSD: '12345.6789012',
        },
      ];

      processor.formatUniswapPoolData(rawData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid Uniswap pool data'),
      );

      consoleSpy.mockRestore();
    });

    it('should handle edge cases with feesUSD and volumeUSD values', () => {
      const rawData = [
        { date: 1672790400, feesUSD: '0.0000001', volumeUSD: '0.0000001' },
        {
          date: 1672704000,
          feesUSD: '999999.9999999',
          volumeUSD: '99999999.9999999',
        },
        {
          date: 1672617600,
          feesUSD: '-1.2345678',
          volumeUSD: '-12345.6789012',
        },
        { date: 1672531200, feesUSD: '0', volumeUSD: '0' },
      ];
      const result = processor.formatUniswapPoolData(rawData);
      expect(result).toEqual([
        { timestamp: '2023-01-01T00:00:00.000Z', feesUSD: 0, volumeUSD: 0 },
        {
          timestamp: '2023-01-02T00:00:00.000Z',
          feesUSD: -1.234568,
          volumeUSD: -12345.678901,
        },
        {
          timestamp: '2023-01-03T00:00:00.000Z',
          feesUSD: 1000000,
          volumeUSD: 100000000,
        },
        { timestamp: '2023-01-04T00:00:00.000Z', feesUSD: 0, volumeUSD: 0 },
      ]);
    });

    it('should handle mixed valid and invalid data correctly', () => {
      const rawData = [
        {
          date: 1672876800,
          feesUSD: '567.8901234',
          volumeUSD: '56789.0123456',
        }, // Valid
        { date: 1672790400, feesUSD: '456.7890123', volumeUSD: 'NaN' }, // Invalid volumeUSD
        {
          date: 1672704000,
          feesUSD: 'not-a-number',
          volumeUSD: '34567.890123',
        }, // Invalid feesUSD
        {
          date: 'invalid-date',
          feesUSD: '234.567890',
          volumeUSD: '23456.789012',
        }, // Invalid date
        undefined, // Invalid
        null, // Invalid
        {
          date: 1672531200,
          feesUSD: '123.4567890',
          volumeUSD: '12345.6789012',
        }, // Valid
      ];
      const result = processor.formatUniswapPoolData(rawData);
      expect(result).toEqual([
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          feesUSD: 123.456789,
          volumeUSD: 12345.678901,
        },
        {
          timestamp: '2023-01-05T00:00:00.000Z',
          feesUSD: 567.890123,
          volumeUSD: 56789.012346,
        },
      ]);
    });

    it('should reverse the order of the data (oldest to most recent)', () => {
      const rawData = [
        {
          date: 1672876800,
          feesUSD: '567.8901234',
          volumeUSD: '56789.0123456',
        }, // Jan 5
        {
          date: 1672790400,
          feesUSD: '456.7890123',
          volumeUSD: '45678.9012345',
        }, // Jan 4
        {
          date: 1672704000,
          feesUSD: '345.6789012',
          volumeUSD: '34567.8901234',
        }, // Jan 3
        {
          date: 1672617600,
          feesUSD: '234.5678901',
          volumeUSD: '23456.7890123',
        }, // Jan 2
        {
          date: 1672531200,
          feesUSD: '123.4567890',
          volumeUSD: '12345.6789012',
        }, // Jan 1
      ];
      const result = processor.formatUniswapPoolData(rawData);
      expect(result).toEqual([
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          feesUSD: 123.456789,
          volumeUSD: 12345.678901,
        },
        {
          timestamp: '2023-01-02T00:00:00.000Z',
          feesUSD: 234.56789,
          volumeUSD: 23456.789012,
        },
        {
          timestamp: '2023-01-03T00:00:00.000Z',
          feesUSD: 345.678901,
          volumeUSD: 34567.890123,
        },
        {
          timestamp: '2023-01-04T00:00:00.000Z',
          feesUSD: 456.789012,
          volumeUSD: 45678.901235,
        },
        {
          timestamp: '2023-01-05T00:00:00.000Z',
          feesUSD: 567.890123,
          volumeUSD: 56789.012346,
        },
      ]);
    });
  });

  describe('processPoolDataResponse', () => {
    it('should process APY and TVL data correctly', () => {
      const apyTvlData = {
        lidoEth: [
          { timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 },
          { timestamp: '2023-01-02T10:00:00.000Z', apy: 2.34567 },
        ],
        pool1: [
          { timestamp: '2023-01-01T10:00:00.000Z', tvlUsd: 123456.7890123 },
          { timestamp: '2023-01-02T10:00:00.000Z', tvlUsd: 234567.8901234 },
        ],
        pool2: [
          { timestamp: '2023-01-01T10:00:00.000Z', tvlUsd: 345678.9012345 },
          { timestamp: '2023-01-02T10:00:00.000Z', tvlUsd: 456789.0123456 },
        ],
      };

      const [processedApyData, processedTvlData] =
        processor.processPoolDataResponse(apyTvlData);

      expect(processedApyData).toEqual({
        lidoEth: [
          { timestamp: '2023-01-01T00:00:00.000Z', apyPercentage: 1.23 },
          { timestamp: '2023-01-02T00:00:00.000Z', apyPercentage: 2.35 },
        ],
      });

      expect(processedTvlData).toEqual({
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', tvlUsd: 123456.789012 },
          { timestamp: '2023-01-02T00:00:00.000Z', tvlUsd: 234567.890123 },
        ],
        pool2: [
          { timestamp: '2023-01-01T00:00:00.000Z', tvlUsd: 345678.901235 },
          { timestamp: '2023-01-02T00:00:00.000Z', tvlUsd: 456789.012346 },
        ],
      });
    });

    it('should handle empty input object', () => {
      const apyTvlData = {};
      const [processedApyData, processedTvlData] =
        processor.processPoolDataResponse(apyTvlData);

      expect(processedApyData).toEqual({});
      expect(processedTvlData).toEqual({});
    });

    it('should handle non-array data for a pool', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const apyTvlData = {
        lidoEth: 'not-an-array',
        pool1: [
          { timestamp: '2023-01-01T10:00:00.000Z', tvlUsd: 123456.7890123 },
        ],
      };

      const [processedApyData, processedTvlData] =
        processor.processPoolDataResponse(apyTvlData);

      expect(processedApyData).toEqual({});
      expect(processedTvlData).toEqual({
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', tvlUsd: 123456.789012 },
        ],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Data for pool lidoEth is not an array',
      );
      consoleSpy.mockRestore();
    });

    it('should handle multiple pools with non-array data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const apyTvlData = {
        lidoEth: 'not-an-array',
        pool1: null,
        pool2: undefined,
        pool3: 123,
        pool4: [
          { timestamp: '2023-01-01T10:00:00.000Z', tvlUsd: 123456.7890123 },
        ],
      };

      const [processedApyData, processedTvlData] =
        processor.processPoolDataResponse(apyTvlData);

      expect(processedApyData).toEqual({});
      expect(processedTvlData).toEqual({
        pool4: [
          { timestamp: '2023-01-01T00:00:00.000Z', tvlUsd: 123456.789012 },
        ],
      });

      expect(consoleSpy).toHaveBeenCalledTimes(4);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Data for pool lidoEth is not an array',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Data for pool pool1 is not an array',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Data for pool pool2 is not an array',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Data for pool pool3 is not an array',
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty arrays for pools', () => {
      const apyTvlData = {
        lidoEth: [],
        pool1: [],
        pool2: [],
      };

      const [processedApyData, processedTvlData] =
        processor.processPoolDataResponse(apyTvlData);

      expect(processedApyData).toEqual({
        lidoEth: [],
      });
      expect(processedTvlData).toEqual({
        pool1: [],
        pool2: [],
      });
    });

    it('should handle invalid data within arrays', () => {
      const apyTvlData = {
        lidoEth: [
          { timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 },
          { timestamp: 'invalid-date', apy: 2.34567 },
          { timestamp: '2023-01-03T10:00:00.000Z', apy: 'not-a-number' },
          { timestamp: '2023-01-04T10:00:00.000Z', apy: 4.56789 },
        ],
        pool1: [
          { timestamp: '2023-01-01T10:00:00.000Z', tvlUsd: 123456.7890123 },
          { timestamp: 'invalid-date', tvlUsd: 234567.8901234 },
          { timestamp: '2023-01-03T10:00:00.000Z', tvlUsd: 'not-a-number' },
          { timestamp: '2023-01-04T10:00:00.000Z', tvlUsd: 456789.0123456 },
        ],
      };

      const [processedApyData, processedTvlData] =
        processor.processPoolDataResponse(apyTvlData);

      expect(processedApyData).toEqual({
        lidoEth: [
          { timestamp: '2023-01-01T00:00:00.000Z', apyPercentage: 1.23 },
          { timestamp: '2023-01-04T00:00:00.000Z', apyPercentage: 4.57 },
        ],
      });

      expect(processedTvlData).toEqual({
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', tvlUsd: 123456.789012 },
          { timestamp: '2023-01-04T00:00:00.000Z', tvlUsd: 456789.012346 },
        ],
      });
    });

    it('should handle null or undefined input', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const [processedApyData1, processedTvlData1] =
        processor.processPoolDataResponse(null);
      expect(processedApyData1).toEqual({});
      expect(processedTvlData1).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'apyTvlData must be a non-null object',
      );

      const [processedApyData2, processedTvlData2] =
        processor.processPoolDataResponse(undefined);
      expect(processedApyData2).toEqual({});
      expect(processedTvlData2).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'apyTvlData must be a non-null object',
      );

      consoleSpy.mockRestore();
    });

    it('should handle non-object input', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const [processedApyData1, processedTvlData1] =
        processor.processPoolDataResponse('not-an-object');
      expect(processedApyData1).toEqual({});
      expect(processedTvlData1).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'apyTvlData must be a non-null object',
      );

      const [processedApyData2, processedTvlData2] =
        processor.processPoolDataResponse(123);
      expect(processedApyData2).toEqual({});
      expect(processedTvlData2).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'apyTvlData must be a non-null object',
      );

      const [processedApyData3, processedTvlData3] =
        processor.processPoolDataResponse(true);
      expect(processedApyData3).toEqual({});
      expect(processedTvlData3).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'apyTvlData must be a non-null object',
      );

      const [processedApyData4, processedTvlData4] =
        processor.processPoolDataResponse([]);
      expect(processedApyData4).toEqual({});
      expect(processedTvlData4).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'apyTvlData must be a non-null object',
      );

      consoleSpy.mockRestore();
    });

    it('should handle multiple lidoEth pools correctly', () => {
      const apyTvlData = {
        lidoEth: [
          { timestamp: '2023-01-01T10:00:00.000Z', apy: 1.23456 },
          { timestamp: '2023-01-02T10:00:00.000Z', apy: 2.34567 },
        ],
        lidoEthV2: [
          { timestamp: '2023-01-01T10:00:00.000Z', tvlUsd: 3.45678 },
          { timestamp: '2023-01-02T10:00:00.000Z', tvlUsd: 4.56789 },
        ],
        aaveUsdc: [
          { timestamp: '2023-01-01T10:00:00.000Z', tvlUsd: 123456.7890123 },
          { timestamp: '2023-01-02T10:00:00.000Z', tvlUsd: 234567.8901234 },
        ],
      };

      const [processedApyData, processedTvlData] =
        processor.processPoolDataResponse(apyTvlData);

      expect(processedApyData).toEqual({
        lidoEth: [
          { timestamp: '2023-01-01T00:00:00.000Z', apyPercentage: 1.23 },
          { timestamp: '2023-01-02T00:00:00.000Z', apyPercentage: 2.35 },
        ],
      });

      expect(processedTvlData).toEqual({
        lidoEthV2: [
          { timestamp: '2023-01-01T00:00:00.000Z', tvlUsd: 3.45678 },
          { timestamp: '2023-01-02T00:00:00.000Z', tvlUsd: 4.56789 },
        ],
        aaveUsdc: [
          { timestamp: '2023-01-01T00:00:00.000Z', tvlUsd: 123456.789012 },
          { timestamp: '2023-01-02T00:00:00.000Z', tvlUsd: 234567.890123 },
        ],
      });
    });
  });

  describe('processPriceDataResponse', () => {
    it('should process price data correctly', () => {
      const priceData = {
        token1: [
          [1672531200000, 1234.5678901],
          [1672617600000, 2345.6789012],
        ],
        token2: [
          [1672531200000, 45678.9012345],
          [1672617600000, 56789.0123456],
        ],
      };

      const result = processor.processPriceDataResponse(priceData);

      expect(result).toEqual({
        token1: [
          { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 1234.56789 },
          { timestamp: '2023-01-02T00:00:00.000Z', priceUsd: 2345.678901 },
        ],
        token2: [
          { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 45678.901235 },
          { timestamp: '2023-01-02T00:00:00.000Z', priceUsd: 56789.012346 },
        ],
      });
    });

    it('should handle empty input object', () => {
      const priceData = {};
      const result = processor.processPriceDataResponse(priceData);
      expect(result).toEqual({});
    });

    it('should handle non-array data for a token', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const priceData = {
        token1: 'not-an-array',
        token2: [
          [1672531200000, 45678.9012345],
          [1672617600000, 56789.0123456],
        ],
      };

      const result = processor.processPriceDataResponse(priceData);

      expect(result).toEqual({
        token1: [],
        token2: [
          { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 45678.901235 },
          { timestamp: '2023-01-02T00:00:00.000Z', priceUsd: 56789.012346 },
        ],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Data for token token1 is not an array',
      );
      consoleSpy.mockRestore();
    });

    it('should handle multiple tokens with non-array data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const priceData = {
        token1: null,
        token2: undefined,
        token3: 123,
        token4: [
          [1672531200000, 0.1234],
          [1672617600000, 0.2345],
        ],
      };

      const result = processor.processPriceDataResponse(priceData);

      expect(result).toEqual({
        token1: [],
        token2: [],
        token3: [],
        token4: [
          { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 0.1234 },
          { timestamp: '2023-01-02T00:00:00.000Z', priceUsd: 0.2345 },
        ],
      });

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Data for token token1 is not an array',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Data for token token2 is not an array',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Data for token token3 is not an array',
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty arrays for tokens', () => {
      const priceData = {
        token1: [],
        token2: [],
        token3: [],
      };

      const result = processor.processPriceDataResponse(priceData);

      expect(result).toEqual({
        token1: [],
        token2: [],
        token3: [],
      });
    });

    it('should handle invalid data within arrays', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const priceData = {
        token1: [
          [1672531200000, 1234.5678],
          'not-an-array',
          [1672704000000, 'not-a-number'],
          [1672790400000, 3456.789],
        ],
        token2: [
          [1672531200000, 45678.9012],
          [1672617600000, 56789.0123],
        ],
      };

      const result = processor.processPriceDataResponse(priceData);

      expect(result).toEqual({
        token1: [
          { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 1234.5678 },
          { timestamp: '2023-01-04T00:00:00.000Z', priceUsd: 3456.789 },
        ],
        token2: [
          { timestamp: '2023-01-01T00:00:00.000Z', priceUsd: 45678.9012 },
          { timestamp: '2023-01-02T00:00:00.000Z', priceUsd: 56789.0123 },
        ],
      });

      // The formatPriceData function silently filters out invalid entries
      // without logging warnings
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle null or undefined input', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result1 = processor.processPriceDataResponse(null);
      expect(result1).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'priceData must be a non-null object',
      );

      const result2 = processor.processPriceDataResponse(undefined);
      expect(result2).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'priceData must be a non-null object',
      );

      consoleSpy.mockRestore();
    });

    it('should handle non-object input', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result1 = processor.processPriceDataResponse('not-an-object');
      expect(result1).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'priceData must be a non-null object',
      );

      const result2 = processor.processPriceDataResponse(123);
      expect(result2).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'priceData must be a non-null object',
      );

      const result3 = processor.processPriceDataResponse(true);
      expect(result3).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'priceData must be a non-null object',
      );

      const result4 = processor.processPriceDataResponse([]);
      expect(result4).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'priceData must be a non-null object',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('processUniswapPoolDataResponse', () => {
    it('should process Uniswap pool data correctly', () => {
      const uniswapPoolsData = {
        pool1: [
          {
            date: 1672531200,
            feesUSD: '123.456789',
            volumeUSD: '12345.678901',
          },
          {
            date: 1672617600,
            feesUSD: '234.567890',
            volumeUSD: '23456.789012',
          },
        ],
        pool2: [
          {
            date: 1672531200,
            feesUSD: '345.678901',
            volumeUSD: '34567.890123',
          },
          {
            date: 1672617600,
            feesUSD: '456.789012',
            volumeUSD: '45678.901234',
          },
        ],
      };

      const result = processor.processUniswapPoolDataResponse(uniswapPoolsData);

      expect(result).toEqual({
        pool1: [
          {
            timestamp: '2023-01-02T00:00:00.000Z',
            feesUSD: 234.56789,
            volumeUSD: 23456.789012,
          },
          {
            timestamp: '2023-01-01T00:00:00.000Z',
            feesUSD: 123.456789,
            volumeUSD: 12345.678901,
          },
        ],
        pool2: [
          {
            timestamp: '2023-01-02T00:00:00.000Z',
            feesUSD: 456.789012,
            volumeUSD: 45678.901234,
          },
          {
            timestamp: '2023-01-01T00:00:00.000Z',
            feesUSD: 345.678901,
            volumeUSD: 34567.890123,
          },
        ],
      });
    });

    it('should handle empty input object', () => {
      const uniswapPoolsData = {};
      const result = processor.processUniswapPoolDataResponse(uniswapPoolsData);
      expect(result).toEqual({});
    });

    it('should handle non-array data for a pool', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const uniswapPoolsData = {
        pool1: 'not-an-array',
        pool2: [
          {
            date: 1672531200,
            feesUSD: '345.678901',
            volumeUSD: '34567.890123',
          },
        ],
      };

      const result = processor.processUniswapPoolDataResponse(uniswapPoolsData);

      expect(result).toEqual({
        pool1: [],
        pool2: [
          {
            timestamp: '2023-01-01T00:00:00.000Z',
            feesUSD: 345.678901,
            volumeUSD: 34567.890123,
          },
        ],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Data for Uniswap pool pool1 is not an array',
      );

      consoleSpy.mockRestore();
    });

    it('should handle multiple pools with non-array data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const uniswapPoolsData = {
        pool1: null,
        pool2: undefined,
        pool3: 123,
        pool4: [
          {
            date: 1672531200,
            feesUSD: '567.890123',
            volumeUSD: '56789.012345',
          },
        ],
      };

      const result = processor.processUniswapPoolDataResponse(uniswapPoolsData);

      expect(result).toEqual({
        pool1: [],
        pool2: [],
        pool3: [],
        pool4: [
          {
            timestamp: '2023-01-01T00:00:00.000Z',
            feesUSD: 567.890123,
            volumeUSD: 56789.012345,
          },
        ],
      });

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Data for Uniswap pool pool1 is not an array',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Data for Uniswap pool pool2 is not an array',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Data for Uniswap pool pool3 is not an array',
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty arrays for pools', () => {
      const uniswapPoolsData = {
        pool1: [],
        pool2: [],
        pool3: [],
      };

      const result = processor.processUniswapPoolDataResponse(uniswapPoolsData);

      expect(result).toEqual({
        pool1: [],
        pool2: [],
        pool3: [],
      });
    });

    it('should handle invalid data within arrays', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const uniswapPoolsData = {
        pool1: [
          {
            date: 1672531200,
            feesUSD: '123.456789',
            volumeUSD: '12345.678901',
          },
          {
            date: 'invalid-date',
            feesUSD: '234.567890',
            volumeUSD: '23456.789012',
          },
          {
            date: 1672704000,
            feesUSD: 'not-a-number',
            volumeUSD: '34567.890123',
          },
          {
            date: 1672790400,
            feesUSD: '456.789012',
            volumeUSD: '45678.901234',
          },
        ],
        pool2: [
          {
            date: 1672531200,
            feesUSD: '567.890123',
            volumeUSD: '56789.012345',
          },
          {
            date: 1672617600,
            feesUSD: '678.901234',
            volumeUSD: '67890.123456',
          },
        ],
      };

      const result = processor.processUniswapPoolDataResponse(uniswapPoolsData);

      expect(result).toEqual({
        pool1: [
          {
            timestamp: '2023-01-04T00:00:00.000Z',
            feesUSD: 456.789012,
            volumeUSD: 45678.901234,
          },
          {
            timestamp: '2023-01-01T00:00:00.000Z',
            feesUSD: 123.456789,
            volumeUSD: 12345.678901,
          },
        ],
        pool2: [
          {
            timestamp: '2023-01-02T00:00:00.000Z',
            feesUSD: 678.901234,
            volumeUSD: 67890.123456,
          },
          {
            timestamp: '2023-01-01T00:00:00.000Z',
            feesUSD: 567.890123,
            volumeUSD: 56789.012345,
          },
        ],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid Uniswap pool data'),
      );

      consoleSpy.mockRestore();
    });

    it('should handle null or undefined input', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result1 = processor.processUniswapPoolDataResponse(null);
      expect(result1).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'uniswapPoolsData must be a non-null object',
      );

      const result2 = processor.processUniswapPoolDataResponse(undefined);
      expect(result2).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'uniswapPoolsData must be a non-null object',
      );

      consoleSpy.mockRestore();
    });

    it('should handle non-object input', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result1 = processor.processUniswapPoolDataResponse('not-an-object');
      expect(result1).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'uniswapPoolsData must be a non-null object',
      );

      const result2 = processor.processUniswapPoolDataResponse(123);
      expect(result2).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'uniswapPoolsData must be a non-null object',
      );

      const result3 = processor.processUniswapPoolDataResponse(true);
      expect(result3).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'uniswapPoolsData must be a non-null object',
      );

      const result4 = processor.processUniswapPoolDataResponse([]);
      expect(result4).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'uniswapPoolsData must be a non-null object',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('removeDuplicateTimestamps', () => {
    it('should remove duplicate timestamps and keep the last occurrence', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 200 },
          { timestamp: '2023-01-01T00:00:00.000Z', value: 150 }, // Duplicate timestamp, should keep this one
          { timestamp: '2023-01-03T00:00:00.000Z', value: 300 },
        ],
        pool2: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 400 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 500 },
          { timestamp: '2023-01-01T00:00:00.000Z', value: 450 }, // Duplicate timestamp, should keep this one
        ],
      };

      const result = processor.removeDuplicateTimestamps(data);

      expect(result).toEqual({
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 150 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 200 },
          { timestamp: '2023-01-03T00:00:00.000Z', value: 300 },
        ],
        pool2: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 450 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 500 },
        ],
      });
    });

    it('should sort timestamps in ascending order', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-03T00:00:00.000Z', value: 300 },
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 200 },
        ],
      };

      const result = processor.removeDuplicateTimestamps(data);

      expect(result).toEqual({
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 200 },
          { timestamp: '2023-01-03T00:00:00.000Z', value: 300 },
        ],
      });
    });

    it('should handle empty input object', () => {
      const data = {};
      const result = processor.removeDuplicateTimestamps(data);
      expect(result).toEqual({});
    });

    it('should handle non-array data for a key', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const data = {
        pool1: 'not-an-array',
        pool2: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 400 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 500 },
        ],
      };

      const result = processor.removeDuplicateTimestamps(data);

      expect(result).toEqual({
        pool1: [],
        pool2: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 400 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 500 },
        ],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Data for key 'pool1' is not an array",
      );

      consoleSpy.mockRestore();
    });

    it('should handle multiple keys with non-array data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const data = {
        pool1: null,
        pool2: undefined,
        pool3: 123,
        pool4: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 400 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 500 },
        ],
      };

      const result = processor.removeDuplicateTimestamps(data);

      expect(result).toEqual({
        pool1: [],
        pool2: [],
        pool3: [],
        pool4: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 400 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 500 },
        ],
      });

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Data for key 'pool1' is not an array",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Data for key 'pool2' is not an array",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Data for key 'pool3' is not an array",
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty arrays for keys', () => {
      const data = {
        pool1: [],
        pool2: [],
        pool3: [],
      };

      const result = processor.removeDuplicateTimestamps(data);

      expect(result).toEqual({
        pool1: [],
        pool2: [],
        pool3: [],
      });
    });

    it('should handle invalid elements within arrays', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const data = {
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: 'invalid-date', value: 200 }, // Invalid ISO timestamp format
          { timestamp: 1234567890, value: 300 }, // timestamp as number
          { value: 400 }, // missing timestamp
          null, // null element
          undefined, // undefined element
          { timestamp: '2023-01-03T00:00:00.000Z', value: 500 },
        ],
        pool2: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 600 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 700 },
        ],
      };

      const result = processor.removeDuplicateTimestamps(data);

      expect(result).toEqual({
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-03T00:00:00.000Z', value: 500 },
        ],
        pool2: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 600 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 700 },
        ],
      });

      expect(consoleSpy).toHaveBeenCalledTimes(5);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Invalid or missing timestamp in element for key 'pool1'",
        ),
      );

      consoleSpy.mockRestore();
    });

    it('should handle null or undefined input', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result1 = processor.removeDuplicateTimestamps(null);
      expect(result1).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid data: must be a non-null object',
      );

      const result2 = processor.removeDuplicateTimestamps(undefined);
      expect(result2).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid data: must be a non-null object',
      );

      consoleSpy.mockRestore();
    });

    it('should handle non-object input', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result1 = processor.removeDuplicateTimestamps('not-an-object');
      expect(result1).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid data: must be a non-null object',
      );

      const result2 = processor.removeDuplicateTimestamps(123);
      expect(result2).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid data: must be a non-null object',
      );

      const result3 = processor.removeDuplicateTimestamps(true);
      expect(result3).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid data: must be a non-null object',
      );

      const result4 = processor.removeDuplicateTimestamps([]);
      expect(result4).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid data: must be a non-null object',
      );

      consoleSpy.mockRestore();
    });

    it('should handle complex objects with multiple properties', () => {
      const data = {
        pool1: [
          {
            timestamp: '2023-01-01T00:00:00.000Z',
            value: 100,
            name: 'Item 1',
            category: 'A',
          },
          {
            timestamp: '2023-01-02T00:00:00.000Z',
            value: 200,
            name: 'Item 2',
            category: 'B',
          },
          {
            timestamp: '2023-01-01T00:00:00.000Z',
            value: 150,
            name: 'Item 3',
            category: 'C',
          }, // Duplicate timestamp
          {
            timestamp: '2023-01-03T00:00:00.000Z',
            value: 300,
            name: 'Item 4',
            category: 'D',
          },
        ],
      };

      const result = processor.removeDuplicateTimestamps(data);

      expect(result).toEqual({
        pool1: [
          {
            timestamp: '2023-01-01T00:00:00.000Z',
            value: 150,
            name: 'Item 3',
            category: 'C',
          },
          {
            timestamp: '2023-01-02T00:00:00.000Z',
            value: 200,
            name: 'Item 2',
            category: 'B',
          },
          {
            timestamp: '2023-01-03T00:00:00.000Z',
            value: 300,
            name: 'Item 4',
            category: 'D',
          },
        ],
      });
    });
  });

  describe('trimData', () => {
    it('should trim arrays to the specified maxLength, keeping the most recent entries', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 200 },
          { timestamp: '2023-01-03T00:00:00.000Z', value: 300 },
          { timestamp: '2023-01-04T00:00:00.000Z', value: 400 },
          { timestamp: '2023-01-05T00:00:00.000Z', value: 500 },
        ],
        pool2: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 600 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 700 },
        ],
      };

      const result = processor.trimData(data, 3);

      expect(result).toEqual({
        pool1: [
          { timestamp: '2023-01-03T00:00:00.000Z', value: 300 },
          { timestamp: '2023-01-04T00:00:00.000Z', value: 400 },
          { timestamp: '2023-01-05T00:00:00.000Z', value: 500 },
        ],
        pool2: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 600 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 700 },
        ],
      });
    });

    it('should use default maxLength of 365 when not specified', () => {
      const data = {
        pool1: Array.from({ length: 400 }, (_, i) => ({
          timestamp: `2023-01-${(i % 30) + 1}T00:00:00.000Z`,
          value: i,
        })),
      };

      const result = processor.trimData(data);

      expect(result.pool1.length).toBe(365);
      expect(result.pool1[0].value).toBe(35); // First value should be the 35th element
      expect(result.pool1[364].value).toBe(399); // Last value should be the 399th element
    });

    it('should return an empty object for null input', () => {
      const result = processor.trimData(null);
      expect(result).toEqual({});
    });

    it('should return an empty object for undefined input', () => {
      const result = processor.trimData(undefined);
      expect(result).toEqual({});
    });

    it('should return an empty object for array input', () => {
      const result = processor.trimData([1, 2, 3]);
      expect(result).toEqual({});
    });

    it('should return an empty object for primitive input', () => {
      const result = processor.trimData('not an object');
      expect(result).toEqual({});
    });

    it('should return the original data for invalid maxLength', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 200 },
        ],
      };

      const result = processor.trimData(data, -1);
      expect(result).toEqual(data);
    });

    it('should return the original data for non-integer maxLength', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 200 },
        ],
      };

      const result = processor.trimData(data, 3.5);
      expect(result).toEqual(data);
    });

    it('should set non-array values to empty arrays', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 200 },
        ],
        pool2: 'not an array',
        pool3: 123,
        pool4: null,
        pool5: undefined,
        pool6: { key: 'value' },
      };

      const result = processor.trimData(data, 3);

      expect(result).toEqual({
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 200 },
        ],
        pool2: [],
        pool3: [],
        pool4: [],
        pool5: [],
        pool6: [],
      });
    });

    it('should handle empty arrays', () => {
      const data = {
        pool1: [],
        pool2: [{ timestamp: '2023-01-01T00:00:00.000Z', value: 100 }],
      };

      const result = processor.trimData(data, 3);

      expect(result).toEqual({
        pool1: [],
        pool2: [{ timestamp: '2023-01-01T00:00:00.000Z', value: 100 }],
      });
    });

    it('should handle empty object', () => {
      const data = {};
      const result = processor.trimData(data, 3);
      expect(result).toEqual({});
    });

    it('should log error for invalid data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      processor.trimData(null);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid data: must be a non-null object',
      );

      consoleSpy.mockRestore();
    });

    it('should log error for invalid maxLength', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      processor.trimData({ pool1: [1, 2, 3] }, -1);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid maxLength: -1, must be a non-negative integer; returning original data',
      );

      consoleSpy.mockRestore();
    });

    it('should log warning for non-array values', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      processor.trimData({ pool1: 'not an array' }, 3);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Value for key 'pool1' is not an array; setting to empty array",
      );

      consoleSpy.mockRestore();
    });
  });

  describe('findMissingDates', () => {
    it('should identify missing dates between consecutive dates', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-03T00:00:00.000Z', value: 300 },
          { timestamp: '2023-01-05T00:00:00.000Z', value: 500 },
        ],
        pool2: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 600 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 700 },
        ],
      };

      const result = processor.findMissingDates(data);

      expect(result).toEqual({
        pool1: ['2023-01-02T00:00:00.000Z', '2023-01-04T00:00:00.000Z'],
      });
    });

    it('should handle consecutive dates with no gaps', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 200 },
          { timestamp: '2023-01-03T00:00:00.000Z', value: 300 },
        ],
      };

      const result = processor.findMissingDates(data);

      expect(result).toEqual({});
    });

    it('should handle dates with large gaps', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-10T00:00:00.000Z', value: 1000 },
        ],
      };

      const result = processor.findMissingDates(data);

      expect(result).toEqual({
        pool1: [
          '2023-01-02T00:00:00.000Z',
          '2023-01-03T00:00:00.000Z',
          '2023-01-04T00:00:00.000Z',
          '2023-01-05T00:00:00.000Z',
          '2023-01-06T00:00:00.000Z',
          '2023-01-07T00:00:00.000Z',
          '2023-01-08T00:00:00.000Z',
          '2023-01-09T00:00:00.000Z',
        ],
      });
    });

    it('should handle dates across month boundaries', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-30T00:00:00.000Z', value: 300 },
          { timestamp: '2023-02-02T00:00:00.000Z', value: 600 },
        ],
      };

      const result = processor.findMissingDates(data);

      expect(result).toEqual({
        pool1: ['2023-01-31T00:00:00.000Z', '2023-02-01T00:00:00.000Z'],
      });
    });

    it('should handle dates across year boundaries', () => {
      const data = {
        pool1: [
          { timestamp: '2023-12-30T00:00:00.000Z', value: 300 },
          { timestamp: '2024-01-02T00:00:00.000Z', value: 600 },
        ],
      };

      const result = processor.findMissingDates(data);

      expect(result).toEqual({
        pool1: ['2023-12-31T00:00:00.000Z', '2024-01-01T00:00:00.000Z'],
      });
    });

    it('should handle dates with different times but same day', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-01T10:00:00.000Z', value: 100 },
          { timestamp: '2023-01-01T15:30:00.000Z', value: 200 },
          { timestamp: '2023-01-02T00:00:00.000Z', value: 300 },
        ],
      };

      const result = processor.findMissingDates(data);

      expect(result).toEqual({});
    });

    it('should return an empty object for null input', () => {
      const result = processor.findMissingDates(null);
      expect(result).toEqual({});
    });

    it('should return an empty object for undefined input', () => {
      const result = processor.findMissingDates(undefined);
      expect(result).toEqual({});
    });

    it('should return an empty object for array input', () => {
      const result = processor.findMissingDates([1, 2, 3]);
      expect(result).toEqual({});
    });

    it('should return an empty object for primitive input', () => {
      const result = processor.findMissingDates('not an object');
      expect(result).toEqual({});
    });

    it('should handle non-array values for keys', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-03T00:00:00.000Z', value: 300 },
        ],
        pool2: 'not an array',
        pool3: 123,
        pool4: null,
        pool5: undefined,
        pool6: { key: 'value' },
      };

      const result = processor.findMissingDates(data);

      expect(result).toEqual({
        pool1: ['2023-01-02T00:00:00.000Z'],
      });
    });

    it('should handle empty arrays', () => {
      const data = {
        pool1: [],
        pool2: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: '2023-01-03T00:00:00.000Z', value: 300 },
        ],
      };

      const result = processor.findMissingDates(data);

      expect(result).toEqual({
        pool2: ['2023-01-02T00:00:00.000Z'],
      });
    });

    it('should handle arrays with less than 2 valid dates', () => {
      const data = {
        pool1: [{ timestamp: '2023-01-01T00:00:00.000Z', value: 100 }],
        pool2: [
          { timestamp: 'invalid-date', value: 200 },
          { timestamp: '2023-01-03T00:00:00.000Z', value: 300 },
        ],
      };

      const result = processor.findMissingDates(data);

      expect(result).toEqual({});
    });

    it('should handle records with invalid timestamps', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { timestamp: 'invalid-date', value: 200 },
          { timestamp: '2023-01-03T00:00:00.000Z', value: 300 },
          { timestamp: 1234567890, value: 400 },
          { timestamp: null, value: 500 },
          { timestamp: undefined, value: 600 },
          { timestamp: '2023-01-05T00:00:00.000Z', value: 700 },
        ],
      };

      const result = processor.findMissingDates(data);

      expect(result).toEqual({
        pool1: ['2023-01-02T00:00:00.000Z', '2023-01-04T00:00:00.000Z'],
      });
    });

    it('should handle records with missing timestamp property', () => {
      const data = {
        pool1: [
          { timestamp: '2023-01-01T00:00:00.000Z', value: 100 },
          { value: 200 },
          { timestamp: '2023-01-03T00:00:00.000Z', value: 300 },
        ],
      };

      const result = processor.findMissingDates(data);

      expect(result).toEqual({
        pool1: ['2023-01-02T00:00:00.000Z'],
      });
    });

    it('should handle empty object', () => {
      const data = {};
      const result = processor.findMissingDates(data);
      expect(result).toEqual({});
    });

    it('should log error for invalid data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      processor.findMissingDates(null);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid data: must be a non-null object',
      );

      consoleSpy.mockRestore();
    });

    it('should log warning for non-array values', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      processor.findMissingDates({ pool1: 'not an array' });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Data for key 'pool1' is not an array",
      );

      consoleSpy.mockRestore();
    });

    it('should log warning for invalid timestamps', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      processor.findMissingDates({
        pool1: [{ timestamp: 'invalid-date', value: 100 }],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid timestamp in record for key 'pool1'"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('findDateOffset', () => {
    it('should calculate a date a specified number of days after the given date', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = processor.findDateOffset(date, 5);
      expect(result).toBe('2023-01-06T00:00:00.000Z');
    });

    it('should calculate a date a specified number of days before the given date', () => {
      const date = new Date('2023-01-10T00:00:00.000Z');
      const result = processor.findDateOffset(date, -3);
      expect(result).toBe('2023-01-07T00:00:00.000Z');
    });

    it('should handle zero days offset', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = processor.findDateOffset(date, 0);
      expect(result).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should handle dates across month boundaries', () => {
      const date = new Date('2023-01-30T00:00:00.000Z');
      const result = processor.findDateOffset(date, 5);
      expect(result).toBe('2023-02-04T00:00:00.000Z');
    });

    it('should handle dates across year boundaries', () => {
      const date = new Date('2023-12-30T00:00:00.000Z');
      const result = processor.findDateOffset(date, 5);
      expect(result).toBe('2024-01-04T00:00:00.000Z');
    });

    it('should handle dates with different times', () => {
      const date = new Date('2023-01-01T15:30:45.123Z');
      const result = processor.findDateOffset(date, 3);
      expect(result).toBe('2023-01-04T00:00:00.000Z');
    });

    it('should return null for invalid date', () => {
      const result = processor.findDateOffset('not a date', 5);
      expect(result).toBeNull();
    });

    it('should return null for NaN date', () => {
      const date = new Date('invalid date');
      const result = processor.findDateOffset(date, 5);
      expect(result).toBeNull();
    });

    it('should return null for non-integer numDays', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = processor.findDateOffset(date, 5.5);
      expect(result).toBeNull();
    });

    it('should log warning for invalid inputs', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      processor.findDateOffset('not a date', 5);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid inputs: date=not a date, numDays=5'),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('findDateBefore', () => {
    it('should calculate a date a specified number of days before the given date', () => {
      const date = new Date('2023-01-10T00:00:00.000Z');
      const result = processor.findDateBefore(date, 3);
      expect(result).toBe('2023-01-07T00:00:00.000Z');
    });

    it('should handle zero days', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = processor.findDateBefore(date, 0);
      expect(result).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should handle dates across month boundaries', () => {
      const date = new Date('2023-02-02T00:00:00.000Z');
      const result = processor.findDateBefore(date, 5);
      expect(result).toBe('2023-01-28T00:00:00.000Z');
    });

    it('should handle dates across year boundaries', () => {
      const date = new Date('2024-01-02T00:00:00.000Z');
      const result = processor.findDateBefore(date, 5);
      expect(result).toBe('2023-12-28T00:00:00.000Z');
    });

    it('should handle dates with different times', () => {
      const date = new Date('2023-01-10T15:30:45.123Z');
      const result = processor.findDateBefore(date, 3);
      expect(result).toBe('2023-01-07T00:00:00.000Z');
    });

    it('should return null for negative numDays', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = processor.findDateBefore(date, -3);
      expect(result).toBeNull();
    });

    it('should return null for invalid date', () => {
      const result = processor.findDateBefore('not a date', 5);
      expect(result).toBeNull();
    });

    it('should return null for NaN date', () => {
      const date = new Date('invalid date');
      const result = processor.findDateBefore(date, 5);
      expect(result).toBeNull();
    });

    it('should return null for non-integer numDays', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = processor.findDateBefore(date, 5.5);
      expect(result).toBeNull();
    });

    it('should log warning for negative numDays', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      processor.findDateBefore(new Date('2023-01-01T00:00:00.000Z'), -3);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid numDays: -3, must be non-negative',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('findDateAfter', () => {
    it('should calculate a date a specified number of days after the given date', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = processor.findDateAfter(date, 5);
      expect(result).toBe('2023-01-06T00:00:00.000Z');
    });

    it('should handle zero days', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = processor.findDateAfter(date, 0);
      expect(result).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should handle dates across month boundaries', () => {
      const date = new Date('2023-01-30T00:00:00.000Z');
      const result = processor.findDateAfter(date, 5);
      expect(result).toBe('2023-02-04T00:00:00.000Z');
    });

    it('should handle dates across year boundaries', () => {
      const date = new Date('2023-12-30T00:00:00.000Z');
      const result = processor.findDateAfter(date, 5);
      expect(result).toBe('2024-01-04T00:00:00.000Z');
    });

    it('should handle dates with different times', () => {
      const date = new Date('2023-01-01T15:30:45.123Z');
      const result = processor.findDateAfter(date, 3);
      expect(result).toBe('2023-01-04T00:00:00.000Z');
    });

    it('should return null for negative numDays', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = processor.findDateAfter(date, -3);
      expect(result).toBeNull();
    });

    it('should return null for invalid date', () => {
      const result = processor.findDateAfter('not a date', 5);
      expect(result).toBeNull();
    });

    it('should return null for NaN date', () => {
      const date = new Date('invalid date');
      const result = processor.findDateAfter(date, 5);
      expect(result).toBeNull();
    });

    it('should return null for non-integer numDays', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = processor.findDateAfter(date, 5.5);
      expect(result).toBeNull();
    });

    it('should log warning for negative numDays', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      processor.findDateAfter(new Date('2023-01-01T00:00:00.000Z'), -3);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid numDays: -3, must be non-negative',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('findValidDates', () => {
    it('should find valid dates before and after a missing date', () => {
      const missingDate = new Date('2023-01-05T00:00:00.000Z');
      const timestamps = [
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        '2023-01-07T00:00:00.000Z',
        '2023-01-08T00:00:00.000Z',
        '2023-01-10T00:00:00.000Z',
      ];

      const [beforeDates, afterDates] = processor.findValidDates(
        missingDate,
        timestamps,
      );

      expect(beforeDates).toEqual([
        '2023-01-02T00:00:00.000Z',
        '2023-01-01T00:00:00.000Z',
      ]);
      expect(afterDates).toEqual([
        '2023-01-07T00:00:00.000Z',
        '2023-01-08T00:00:00.000Z',
      ]);
    });

    it('should find up to two valid dates before and after a missing date', () => {
      const missingDate = new Date('2023-01-05T00:00:00.000Z');
      const timestamps = [
        '2023-01-03T00:00:00.000Z',
        '2023-01-04T00:00:00.000Z',
        '2023-01-06T00:00:00.000Z',
        '2023-01-07T00:00:00.000Z',
      ];

      const [beforeDates, afterDates] = processor.findValidDates(
        missingDate,
        timestamps,
      );

      expect(beforeDates).toEqual([
        '2023-01-04T00:00:00.000Z',
        '2023-01-03T00:00:00.000Z',
      ]);
      expect(afterDates).toEqual([
        '2023-01-06T00:00:00.000Z',
        '2023-01-07T00:00:00.000Z',
      ]);
    });

    it('should respect the maxDays parameter', () => {
      const missingDate = new Date('2023-01-05T00:00:00.000Z');
      const timestamps = [
        '2023-01-02T00:00:00.000Z',
        '2023-01-03T00:00:00.000Z',
        '2023-01-07T00:00:00.000Z',
        '2023-01-08T00:00:00.000Z',
      ];

      const [beforeDates, afterDates] = processor.findValidDates(
        missingDate,
        timestamps,
        2,
      );

      expect(beforeDates).toEqual(['2023-01-03T00:00:00.000Z']);
      expect(afterDates).toEqual(['2023-01-07T00:00:00.000Z']);
    });

    it('should handle dates across month boundaries', () => {
      const missingDate = new Date('2023-02-02T00:00:00.000Z');
      const timestamps = [
        '2023-01-31T00:00:00.000Z',
        '2023-02-01T00:00:00.000Z',
        '2023-02-03T00:00:00.000Z',
        '2023-02-04T00:00:00.000Z',
      ];

      const [beforeDates, afterDates] = processor.findValidDates(
        missingDate,
        timestamps,
      );

      expect(beforeDates).toEqual([
        '2023-02-01T00:00:00.000Z',
        '2023-01-31T00:00:00.000Z',
      ]);
      expect(afterDates).toEqual([
        '2023-02-03T00:00:00.000Z',
        '2023-02-04T00:00:00.000Z',
      ]);
    });

    it('should handle dates across year boundaries', () => {
      const missingDate = new Date('2024-01-02T00:00:00.000Z');
      const timestamps = [
        '2023-12-31T00:00:00.000Z',
        '2024-01-01T00:00:00.000Z',
        '2024-01-03T00:00:00.000Z',
        '2024-01-04T00:00:00.000Z',
      ];

      const [beforeDates, afterDates] = processor.findValidDates(
        missingDate,
        timestamps,
      );

      expect(beforeDates).toEqual([
        '2024-01-01T00:00:00.000Z',
        '2023-12-31T00:00:00.000Z',
      ]);
      expect(afterDates).toEqual([
        '2024-01-03T00:00:00.000Z',
        '2024-01-04T00:00:00.000Z',
      ]);
    });

    it('should not handle dates with different times', () => {
      const missingDate = new Date('2023-01-05T12:00:00.000Z');
      const timestamps = [
        '2023-01-03T15:30:45.123Z',
        '2023-01-04T10:20:30.456Z',
        '2023-01-06T08:15:22.789Z',
        '2023-01-07T23:45:10.321Z',
      ];

      const [beforeDates, afterDates] = processor.findValidDates(
        missingDate,
        timestamps,
      );

      expect(beforeDates).toEqual([]);
      expect(afterDates).toEqual([]);
    });

    it('should return empty arrays when no valid dates are found', () => {
      const missingDate = new Date('2023-01-05T00:00:00.000Z');
      const timestamps = [
        '2023-01-10T00:00:00.000Z',
        '2023-01-11T00:00:00.000Z',
        '2023-01-12T00:00:00.000Z',
      ];

      const [beforeDates, afterDates] = processor.findValidDates(
        missingDate,
        timestamps,
        3,
      );

      expect(beforeDates).toEqual([]);
      expect(afterDates).toEqual([]);
    });

    it('should return empty arrays for invalid missingDate', () => {
      const timestamps = [
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        '2023-01-07T00:00:00.000Z',
        '2023-01-08T00:00:00.000Z',
      ];

      const [beforeDates1, afterDates1] = processor.findValidDates(
        'not a date',
        timestamps,
      );
      expect(beforeDates1).toEqual([]);
      expect(afterDates1).toEqual([]);

      const [beforeDates2, afterDates2] = processor.findValidDates(
        new Date('invalid date'),
        timestamps,
      );
      expect(beforeDates2).toEqual([]);
      expect(afterDates2).toEqual([]);

      const [beforeDates3, afterDates3] = processor.findValidDates(
        null,
        timestamps,
      );
      expect(beforeDates3).toEqual([]);
      expect(afterDates3).toEqual([]);

      const [beforeDates4, afterDates4] = processor.findValidDates(
        undefined,
        timestamps,
      );
      expect(beforeDates4).toEqual([]);
      expect(afterDates4).toEqual([]);
    });

    it('should return empty arrays for invalid timestamps', () => {
      const missingDate = new Date('2023-01-05T00:00:00.000Z');

      const [beforeDates1, afterDates1] = processor.findValidDates(
        missingDate,
        'not an array',
      );
      expect(beforeDates1).toEqual([]);
      expect(afterDates1).toEqual([]);

      const [beforeDates2, afterDates2] = processor.findValidDates(
        missingDate,
        null,
      );
      expect(beforeDates2).toEqual([]);
      expect(afterDates2).toEqual([]);

      const [beforeDates3, afterDates3] = processor.findValidDates(
        missingDate,
        undefined,
      );
      expect(beforeDates3).toEqual([]);
      expect(afterDates3).toEqual([]);
    });

    it('should return empty arrays for invalid maxDays', () => {
      const missingDate = new Date('2023-01-05T00:00:00.000Z');
      const timestamps = [
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        '2023-01-07T00:00:00.000Z',
        '2023-01-08T00:00:00.000Z',
      ];

      const [beforeDates1, afterDates1] = processor.findValidDates(
        missingDate,
        timestamps,
        0,
      );
      expect(beforeDates1).toEqual([]);
      expect(afterDates1).toEqual([]);

      const [beforeDates2, afterDates2] = processor.findValidDates(
        missingDate,
        timestamps,
        -1,
      );
      expect(beforeDates2).toEqual([]);
      expect(afterDates2).toEqual([]);

      const [beforeDates3, afterDates3] = processor.findValidDates(
        missingDate,
        timestamps,
        5.5,
      );
      expect(beforeDates3).toEqual([]);
      expect(afterDates3).toEqual([]);

      const [beforeDates4, afterDates4] = processor.findValidDates(
        missingDate,
        timestamps,
        '7',
      );
      expect(beforeDates4).toEqual([]);
      expect(afterDates4).toEqual([]);
    });

    it('should log warning for invalid inputs', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      processor.findValidDates('not a date', 'not an array', 'invalid');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Invalid inputs: missingDate=not a date, timestamps=not an array, maxDays=invalid',
        ),
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty timestamps array', () => {
      const missingDate = new Date('2023-01-05T00:00:00.000Z');
      const timestamps = [];

      const [beforeDates, afterDates] = processor.findValidDates(
        missingDate,
        timestamps,
      );

      expect(beforeDates).toEqual([]);
      expect(afterDates).toEqual([]);
    });

    it('should handle timestamps with invalid ISO format', () => {
      const missingDate = new Date('2023-01-05T00:00:00.000Z');
      const timestamps = [
        '2023-01-02', // Missing time part
        'invalid-date',
        '2023-01-08T00:00:00.000Z',
      ];

      const [beforeDates, afterDates] = processor.findValidDates(
        missingDate,
        timestamps,
      );

      // Only the valid ISO timestamp should be found
      expect(beforeDates).toEqual([]);
      expect(afterDates).toEqual(['2023-01-08T00:00:00.000Z']);
    });
  });
});

describe('getMetrics', () => {
  test('should return empty object for empty inputs', () => {
    const result = processor.getMetrics([], new Map());
    expect(result).toEqual({});
  });

  test('should return empty object for invalid inputs', () => {
    expect(processor.getMetrics(null, new Map())).toEqual({});
    expect(processor.getMetrics([], null)).toEqual({});
    expect(processor.getMetrics('not an array', new Map())).toEqual({});
    expect(processor.getMetrics([], 'not a map')).toEqual({});
  });

  test('should correctly process valid records with metrics', () => {
    const validDates = ['2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z'];
    const recordMap = new Map([
      [
        '2024-01-01T00:00:00Z',
        { timestamp: '2024-01-01T00:00:00Z', price: 100, volume: 1000 },
      ],
      [
        '2024-01-02T00:00:00Z',
        { timestamp: '2024-01-02T00:00:00Z', price: 110, volume: 2000 },
      ],
    ]);

    const result = processor.getMetrics(validDates, recordMap);
    expect(result).toEqual({
      price: [100, 110],
      volume: [1000, 2000],
    });
  });

  test('should handle missing records for some dates', () => {
    const validDates = [
      '2024-01-01T00:00:00Z',
      '2024-01-02T00:00:00Z',
      '2024-01-03T00:00:00Z',
    ];
    const recordMap = new Map([
      [
        '2024-01-01T00:00:00Z',
        { timestamp: '2024-01-01T00:00:00Z', price: 100 },
      ],
      [
        '2024-01-03T00:00:00Z',
        { timestamp: '2024-01-03T00:00:00Z', price: 120 },
      ],
    ]);

    const result = processor.getMetrics(validDates, recordMap);
    expect(result).toEqual({
      price: [100, 120],
    });
  });

  test('should handle records with different metric keys', () => {
    const validDates = ['2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z'];
    const recordMap = new Map([
      [
        '2024-01-01T00:00:00Z',
        { timestamp: '2024-01-01T00:00:00Z', price: 100 },
      ],
      [
        '2024-01-02T00:00:00Z',
        { timestamp: '2024-01-02T00:00:00Z', volume: 2000 },
      ],
    ]);

    const result = processor.getMetrics(validDates, recordMap);
    expect(result).toEqual({
      price: [100],
      volume: [2000],
    });
  });

  test('should ignore timestamp field in records', () => {
    const validDates = ['2024-01-01T00:00:00Z'];
    const recordMap = new Map([
      [
        '2024-01-01T00:00:00Z',
        {
          timestamp: '2024-01-01T00:00:00Z',
          price: 100,
          volume: 1000,
        },
      ],
    ]);

    const result = processor.getMetrics(validDates, recordMap);
    expect(result).toEqual({
      price: [100],
      volume: [1000],
    });
  });
});
