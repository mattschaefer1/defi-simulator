import {
  setupTestEnvironment,
  teardownTestEnvironment,
  seedTokenData,
  seedPoolData,
  initializeApp,
  mockExternalApis,
} from '../setup.js';
import dataHandler from '../../src/data/handler.js';
import * as fetcher from '../../src/data/fetcher.js';

describe('dataHandler Integration Tests', () => {
  let app;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeAll(async () => {
    await setupTestEnvironment();
    app = await initializeApp();
    mockExternalApis();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await app.locals.sequelize.sync({ force: true });
    await seedTokenData();
    await seedPoolData();

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(async () => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should successfully fetch, process, and save data', async () => {
    await dataHandler(app);

    const stakingData = await app.locals.models.ETHStakingHistorical.findAll();
    const tokenPriceData = await app.locals.models.TokenPrice.findAll();
    const lpHistoricalData = await app.locals.models.LPHistorical.findAll();

    expect(stakingData.length).toBeGreaterThan(0);
    expect(tokenPriceData.length).toBeGreaterThan(0);
    expect(lpHistoricalData.length).toBeGreaterThan(0);

    expect(stakingData[0].timestamp).toBeInstanceOf(Date);
    expect(typeof stakingData[0].apy_percentage).toBe('string');
    expect(stakingData[0].apy_percentage).toMatch(/^\d+\.\d{2}$/);

    expect(tokenPriceData[0].timestamp).toBeInstanceOf(Date);
    expect(typeof tokenPriceData[0].price_usd).toBe('string');
    expect(tokenPriceData[0].price_usd).toMatch(/^\d+\.\d+$/);

    expect(lpHistoricalData[0].timestamp).toBeInstanceOf(Date);
    expect(typeof lpHistoricalData[0].tvl_usd).toBe('string');
    expect(lpHistoricalData[0].tvl_usd).toMatch(/^\d+\.\d+$/);

    expect(consoleLogSpy).toHaveBeenCalledWith('All data saved successfully');
  });

  it('should handle duplicate timestamps by saving only the last occurrence', async () => {
    jest.spyOn(fetcher, 'fetchPoolData').mockResolvedValueOnce({
      lidoEth: [
        { timestamp: '2023-01-01', apy: 5.0 },
        { timestamp: '2023-01-01', apy: 5.1 },
      ],
    });

    await dataHandler(app);

    const stakingData = await app.locals.models.ETHStakingHistorical.findAll({
      where: { timestamp: new Date('2023-01-01T00:00:00.000Z') },
    });

    expect(stakingData.length).toBe(1);
    expect(stakingData[0].apy_percentage).toBe('5.10');
  });

  it('should handle missing dates by filling with simulated metrics', async () => {
    jest.spyOn(fetcher, 'fetchPoolData').mockResolvedValueOnce({
      lidoEth: [
        { timestamp: '2023-01-01', apy: 5.0, tvlUsd: 1000000 },
        { timestamp: '2023-01-03', apy: 5.2, tvlUsd: 1010000 },
      ],
      wethUsdc: [
        { timestamp: '2023-01-01', apy: 4.0, tvlUsd: 2000000 },
        { timestamp: '2023-01-03', apy: 4.2, tvlUsd: 2010000 },
      ],
    });

    jest.spyOn(fetcher, 'fetchPriceData').mockResolvedValueOnce({
      weth: [
        [1672531200000, 1200.1234567], // 2023-01-01
        [1672704000000, 1210.654321], // 2023-01-03
      ],
    });

    jest.spyOn(fetcher, 'fetchUniswapPoolData').mockResolvedValueOnce({
      wethUsdc: [
        {
          date: 1672531200,
          feesUSD: '1500.1234567',
          volumeUSD: '500000.6543210',
        }, // 2023-01-01
        {
          date: 1672704000,
          feesUSD: '1520.6543210',
          volumeUSD: '510000.1234567',
        }, // 2023-01-03
      ],
    });

    await dataHandler(app);

    const stakingData = await app.locals.models.ETHStakingHistorical.findAll({
      where: { timestamp: new Date('2023-01-02T00:00:00.000Z') },
    });
    expect(stakingData.length).toBe(1);
    expect(stakingData[0].apy_percentage).toMatch(/^\d+\.\d{2}$/);

    const tokenPriceData = await app.locals.models.TokenPrice.findAll({
      where: {
        timestamp: new Date('2023-01-02T00:00:00.000Z'),
        token_symbol: 'WETH',
      },
    });
    expect(tokenPriceData.length).toBe(1);
    expect(tokenPriceData[0].price_usd).toMatch(/^\d+\.\d+$/);

    const lpHistoricalData = await app.locals.models.LPHistorical.findAll({
      where: {
        timestamp: new Date('2023-01-02T00:00:00.000Z'),
        pool_address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      },
    });
    expect(lpHistoricalData.length).toBe(1);
    expect(lpHistoricalData[0].tvl_usd).toMatch(/^\d+\.\d+$/);
    expect(lpHistoricalData[0].volume_24h_usd).toMatch(/^\d+\.\d+$/);
    expect(lpHistoricalData[0].fees_24h_usd).toMatch(/^\d+\.\d+$/);
  });

  it('should handle fetch failure and throw an error', async () => {
    jest
      .spyOn(fetcher, 'fetchPoolData')
      .mockRejectedValueOnce(new Error('Fetch error'));

    await expect(dataHandler(app)).rejects.toThrow('Fetch error');

    const stakingData = await app.locals.models.ETHStakingHistorical.findAll();
    const tokenPriceData = await app.locals.models.TokenPrice.findAll();
    const lpHistoricalData = await app.locals.models.LPHistorical.findAll();

    expect(stakingData.length).toBe(0);
    expect(tokenPriceData.length).toBe(0);
    expect(lpHistoricalData.length).toBe(0);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error in dataHandler:',
      expect.any(Error),
    );
  });

  it('should throw an error when database models are missing', async () => {
    const originalModels = app.locals.models;
    app.locals.models = undefined;

    await expect(dataHandler(app)).rejects.toThrow('Database model');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error in dataHandler:',
      expect.any(Error),
    );

    app.locals.models = originalModels;
  });

  it('should handle empty data from fetch functions gracefully', async () => {
    jest.spyOn(fetcher, 'fetchPoolData').mockResolvedValueOnce({});
    jest.spyOn(fetcher, 'fetchPriceData').mockResolvedValueOnce({});
    jest.spyOn(fetcher, 'fetchUniswapPoolData').mockResolvedValueOnce({});

    await dataHandler(app);

    const stakingData = await app.locals.models.ETHStakingHistorical.findAll();
    const tokenPriceData = await app.locals.models.TokenPrice.findAll();
    const lpHistoricalData = await app.locals.models.LPHistorical.findAll();

    expect(stakingData.length).toBe(0);
    expect(tokenPriceData.length).toBe(0);
    expect(lpHistoricalData.length).toBe(0);

    expect(consoleLogSpy).toHaveBeenCalledWith('All data saved successfully');
  });

  it('should log and rethrow error when saving token price data fails', async () => {
    const originalCreate = app.locals.models.TokenPrice.create;
    app.locals.models.TokenPrice.create = jest
      .fn()
      .mockRejectedValue(new Error('TokenPrice save error'));

    await expect(dataHandler(app)).rejects.toThrow('TokenPrice save error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to save token price data:',
      expect.any(Error),
    );

    app.locals.models.TokenPrice.create = originalCreate;
  });

  it('should log and rethrow error when saving liquidity pool data fails', async () => {
    const originalCreate = app.locals.models.LPHistorical.create;
    app.locals.models.LPHistorical.create = jest
      .fn()
      .mockRejectedValue(new Error('LPHistorical save error'));

    await expect(dataHandler(app)).rejects.toThrow('LPHistorical save error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to save liquidity pool data:',
      expect.any(Error),
    );

    app.locals.models.LPHistorical.create = originalCreate;
  });
});
