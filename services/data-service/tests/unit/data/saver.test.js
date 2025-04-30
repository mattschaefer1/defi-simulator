import {
  saveStakingData,
  saveTokenPriceData,
  saveLiquidityPoolData,
} from '../../../src/data/saver.js';

// Mock the database models
const mockCreate = jest.fn();
const app = {
  locals: {
    models: {
      ETHStakingHistorical: { create: mockCreate },
      TokenPrice: { create: mockCreate },
      LPHistorical: { create: mockCreate },
    },
  },
};

// Spy on console methods
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

describe('Data Saving Functions', () => {
  describe('saveStakingData', () => {
    beforeEach(() => {
      mockCreate.mockReset();
      consoleLogSpy.mockClear();
      consoleErrorSpy.mockClear();
      consoleWarnSpy.mockClear();
    });

    it('successfully inserts valid staking records', async () => {
      const apyData = {
        pool1: [
          { timestamp: '2023-01-01', apyPercentage: 5.0 },
          { timestamp: '2023-01-02', apyPercentage: 5.5 },
        ],
      };
      mockCreate.mockResolvedValue({});

      await saveStakingData(apyData, app);

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(mockCreate).toHaveBeenCalledWith({
        timestamp: '2023-01-01',
        apy_percentage: 5.0,
      });
      expect(mockCreate).toHaveBeenCalledWith({
        timestamp: '2023-01-02',
        apy_percentage: 5.5,
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Inserted staking record for timestamp: 2023-01-01',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Inserted staking record for timestamp: 2023-01-02',
      );
    });

    it('skips invalid staking data formats', async () => {
      const apyData = {
        pool1: 'invalid',
        pool2: [{ timestamp: '2023-01-03', apyPercentage: 6.0 }],
      };
      mockCreate.mockResolvedValue({});

      await saveStakingData(apyData, app);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        timestamp: '2023-01-03',
        apy_percentage: 6.0,
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Skipping invalid data for pool 'pool1': not an array",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Inserted staking record for timestamp: 2023-01-03',
      );
    });

    it('skips staking records with missing or invalid fields', async () => {
      const apyData = {
        pool1: [
          { timestamp: '2023-01-01', apyPercentage: 5.0 }, // Valid
          { timestamp: '2023-01-02' }, // Missing apyPercentage
          { apyPercentage: 6.0 }, // Missing timestamp
          { timestamp: '2023-01-04', apyPercentage: 'invalid' }, // Invalid apyPercentage
        ],
      };
      mockCreate.mockResolvedValue({});

      await saveStakingData(apyData, app);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        timestamp: '2023-01-01',
        apy_percentage: 5.0,
      });
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Inserted staking record for timestamp: 2023-01-01',
      );
    });

    it('skips duplicate staking records', async () => {
      const apyData = {
        pool1: [{ timestamp: '2023-01-01', apyPercentage: 5.0 }],
      };
      const uniqueConstraintError = new Error('Unique constraint violation');
      uniqueConstraintError.name = 'SequelizeUniqueConstraintError';
      mockCreate.mockRejectedValueOnce(uniqueConstraintError);

      await saveStakingData(apyData, app);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Skipped duplicate staking record for timestamp: 2023-01-01',
      );
    });

    it('handles unexpected errors during staking record insertion', async () => {
      const apyData = {
        pool1: [{ timestamp: '2023-01-01', apyPercentage: 5.0 }],
      };
      const unexpectedError = new Error('Unexpected error');
      mockCreate.mockRejectedValueOnce(unexpectedError);

      await saveStakingData(apyData, app);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error inserting staking record:',
        unexpectedError,
      );
    });

    it('rejects when ETHStakingHistorical model is not available', async () => {
      const invalidApp = { locals: { models: {} } };
      await expect(saveStakingData({}, invalidApp)).rejects.toThrow(
        'Database model ETHStakingHistorical is not available',
      );
    });

    it('handles null staking data gracefully', async () => {
      await expect(saveStakingData(null, app)).resolves.toEqual([]);
      expect(mockCreate).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('saveTokenPriceData', () => {
    beforeEach(() => {
      mockCreate.mockReset();
      consoleLogSpy.mockClear();
      consoleErrorSpy.mockClear();
      consoleWarnSpy.mockClear();
    });

    it('successfully inserts valid token price records', async () => {
      const priceData = {
        token1: [
          { timestamp: '2023-01-01', tokenSymbol: 'ETH', priceUsd: 1500 },
          { timestamp: '2023-01-02', tokenSymbol: 'ETH', priceUsd: 1550 },
        ],
      };
      mockCreate.mockResolvedValue({});

      await saveTokenPriceData(priceData, app);

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(mockCreate).toHaveBeenCalledWith({
        timestamp: '2023-01-01',
        token_symbol: 'ETH',
        price_usd: 1500,
      });
      expect(mockCreate).toHaveBeenCalledWith({
        timestamp: '2023-01-02',
        token_symbol: 'ETH',
        price_usd: 1550,
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Inserted token price record for ETH at 2023-01-01',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Inserted token price record for ETH at 2023-01-02',
      );
    });

    it('skips invalid token price data formats', async () => {
      const priceData = {
        token1: 'invalid',
        token2: [
          { timestamp: '2023-01-03', tokenSymbol: 'BTC', priceUsd: 30000 },
        ],
      };
      mockCreate.mockResolvedValue({});

      await saveTokenPriceData(priceData, app);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        timestamp: '2023-01-03',
        token_symbol: 'BTC',
        price_usd: 30000,
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Skipping invalid data for token 'token1': not an array",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Inserted token price record for BTC at 2023-01-03',
      );
    });

    it('skips token price records with missing or invalid fields', async () => {
      const priceData = {
        token1: [
          { timestamp: '2023-01-01', tokenSymbol: 'ETH', priceUsd: 1500 }, // Valid
          { timestamp: '2023-01-02', tokenSymbol: 'ETH' }, // Missing priceUsd
          { timestamp: '2023-01-03', priceUsd: 1600 }, // Missing tokenSymbol
          { tokenSymbol: 'ETH', priceUsd: 1700 }, // Missing timestamp
          { timestamp: '2023-01-04', tokenSymbol: 'ETH', priceUsd: 'invalid' }, // Invalid priceUsd
        ],
      };
      mockCreate.mockResolvedValue({});

      await saveTokenPriceData(priceData, app);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        timestamp: '2023-01-01',
        token_symbol: 'ETH',
        price_usd: 1500,
      });
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Inserted token price record for ETH at 2023-01-01',
      );
    });

    it('skips duplicate token price records', async () => {
      const priceData = {
        token1: [
          { timestamp: '2023-01-01', tokenSymbol: 'ETH', priceUsd: 1500 },
        ],
      };
      const uniqueConstraintError = new Error('Unique constraint violation');
      uniqueConstraintError.name = 'SequelizeUniqueConstraintError';
      mockCreate.mockRejectedValueOnce(uniqueConstraintError);

      await saveTokenPriceData(priceData, app);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Skipped duplicate token price record for ETH at 2023-01-01',
      );
    });

    it('handles unexpected errors during token price record insertion', async () => {
      const priceData = {
        token1: [
          { timestamp: '2023-01-01', tokenSymbol: 'ETH', priceUsd: 1500 },
        ],
      };
      const unexpectedError = new Error('Unexpected error');
      mockCreate.mockRejectedValueOnce(unexpectedError);

      await saveTokenPriceData(priceData, app);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error inserting token price record:',
        unexpectedError,
      );
    });

    it('rejects when TokenPrice model is not available', async () => {
      const invalidApp = { locals: { models: {} } };
      await expect(saveTokenPriceData({}, invalidApp)).rejects.toThrow(
        'Database model TokenPrice is not available',
      );
    });

    it('handles null token price data gracefully', async () => {
      await expect(saveTokenPriceData(null, app)).resolves.toEqual([]);
      expect(mockCreate).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('saveLiquidityPoolData', () => {
    beforeEach(() => {
      mockCreate.mockReset();
      consoleLogSpy.mockClear();
      consoleErrorSpy.mockClear();
      consoleWarnSpy.mockClear();
    });

    it('successfully inserts valid liquidity pool records', async () => {
      const liquidityPoolData = {
        pool1: [
          {
            timestamp: '2023-01-01',
            poolAddress: '0x123',
            tvlUsd: 1000000,
            volumeUSD: 50000,
            feesUSD: 1000,
          },
        ],
      };
      mockCreate.mockResolvedValue({});

      await saveLiquidityPoolData(liquidityPoolData, app);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        timestamp: '2023-01-01',
        pool_address: '0x123',
        tvl_usd: 1000000,
        volume_24h_usd: 50000,
        fees_24h_usd: 1000,
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Inserted liquidity pool record for 0x123 at 2023-01-01',
      );
    });

    it('skips invalid liquidity pool data formats', async () => {
      const liquidityPoolData = {
        pool1: 'invalid',
        pool2: [
          {
            timestamp: '2023-01-02',
            poolAddress: '0x456',
            tvlUsd: 2000000,
            volumeUSD: 60000,
            feesUSD: 1200,
          },
        ],
      };
      mockCreate.mockResolvedValue({});

      await saveLiquidityPoolData(liquidityPoolData, app);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        timestamp: '2023-01-02',
        pool_address: '0x456',
        tvl_usd: 2000000,
        volume_24h_usd: 60000,
        fees_24h_usd: 1200,
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Skipping invalid data for pool 'pool1': not an array",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Inserted liquidity pool record for 0x456 at 2023-01-02',
      );
    });

    it('skips liquidity pool records with missing or invalid fields', async () => {
      const liquidityPoolData = {
        pool1: [
          {
            timestamp: '2023-01-01',
            poolAddress: '0x123',
            tvlUsd: 1000000,
            volumeUSD: 50000,
            feesUSD: 1000,
          }, // Valid
          { poolAddress: '0x123', tvlUsd: 1000000 }, // Missing timestamp
          { timestamp: '2023-01-02', tvlUsd: 1000000 }, // Missing poolAddress
          {
            timestamp: '2023-01-03',
            poolAddress: '0x789',
            tvlUsd: 'invalid',
            volumeUSD: 50000,
            feesUSD: 1000,
          }, // Invalid tvlUsd
        ],
      };
      mockCreate.mockResolvedValue({});

      await saveLiquidityPoolData(liquidityPoolData, app);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        timestamp: '2023-01-01',
        pool_address: '0x123',
        tvl_usd: 1000000,
        volume_24h_usd: 50000,
        fees_24h_usd: 1000,
      });
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Inserted liquidity pool record for 0x123 at 2023-01-01',
      );
    });

    it('skips duplicate liquidity pool records', async () => {
      const liquidityPoolData = {
        pool1: [
          {
            timestamp: '2023-01-01',
            poolAddress: '0x123',
            tvlUsd: 1000000,
            volumeUSD: 50000,
            feesUSD: 1000,
          },
        ],
      };
      const uniqueConstraintError = new Error('Unique constraint violation');
      uniqueConstraintError.name = 'SequelizeUniqueConstraintError';
      mockCreate.mockRejectedValueOnce(uniqueConstraintError);

      await saveLiquidityPoolData(liquidityPoolData, app);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Skipped duplicate liquidity pool record for 0x123 at 2023-01-01',
      );
    });

    it('handles unexpected errors during liquidity pool record insertion', async () => {
      const liquidityPoolData = {
        pool1: [
          {
            timestamp: '2023-01-01',
            poolAddress: '0x123',
            tvlUsd: 1000000,
            volumeUSD: 50000,
            feesUSD: 1000,
          },
        ],
      };
      const unexpectedError = new Error('Unexpected error');
      mockCreate.mockRejectedValueOnce(unexpectedError);

      await saveLiquidityPoolData(liquidityPoolData, app);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error inserting liquidity pool record:',
        unexpectedError,
      );
    });

    it('rejects when LPHistorical model is not available', async () => {
      const invalidApp = { locals: { models: {} } };
      await expect(saveLiquidityPoolData({}, invalidApp)).rejects.toThrow(
        'Database model LPHistorical is not available',
      );
    });

    it('handles null liquidity pool data gracefully', async () => {
      await expect(saveLiquidityPoolData(null, app)).resolves.toEqual([]);
      expect(mockCreate).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
