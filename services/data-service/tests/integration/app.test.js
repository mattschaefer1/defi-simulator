import { Sequelize } from 'sequelize';
import * as setup from '../setup.js';
import {
  runDataFetch,
  errorHandler,
  startServer,
  stopServer,
} from '../../app.js';
import dataHandler from '../../src/data/handler.js';
import retry from '../../src/utils/retry.js';

jest.mock('../../src/utils/retry.js', () =>
  jest.fn().mockImplementation((fn) => fn()),
);

jest.mock('../../src/data/handler.js');

describe('App.js Integration Tests', () => {
  let app;
  let consoleLogSpy;
  let consoleErrorSpy;
  let server;

  beforeAll(async () => {
    await setup.setupTestEnvironment();
    app = await setup.initializeApp();
  });

  afterAll(async () => {
    await setup.teardownTestEnvironment();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(async () => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    stopServer();
  });

  describe('runDataFetch', () => {
    it('logs correctly on success', async () => {
      dataHandler.mockImplementationOnce(async (appInstance) => {
        expect(appInstance).toBe(app);
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      });

      await runDataFetch();

      const logCalls = consoleLogSpy.mock.calls.map((call) => call[0]);
      expect(
        logCalls.some((log) => log.includes('Starting data fetch at')),
      ).toBe(true);
      expect(
        logCalls.some((log) =>
          log.includes('Data fetch completed successfully in'),
        ),
      ).toBe(true);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(dataHandler).toHaveBeenCalledTimes(1);
    });

    it('handles errors correctly', async () => {
      dataHandler.mockImplementationOnce(async (appInstance) => {
        expect(appInstance).toBe(app);
        throw new Error('Test error');
      });

      await runDataFetch();

      const logCalls = consoleLogSpy.mock.calls.map((call) => call[0]);
      expect(
        logCalls.some((log) => log.includes('Starting data fetch at')),
      ).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching data:',
        expect.any(Error),
      );
      expect(
        logCalls.some((log) =>
          log.includes('Data fetch completed successfully in'),
        ),
      ).toBe(false);
      expect(dataHandler).toHaveBeenCalledTimes(1);
    });

    it('skips if already running', async () => {
      dataHandler.mockImplementationOnce(async (appInstance) => {
        expect(appInstance).toBe(app);
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
      });

      const firstCall = runDataFetch();
      const secondCall = runDataFetch();
      await Promise.all([firstCall, secondCall]);

      const logCalls = consoleLogSpy.mock.calls.map((call) => call[0]);
      expect(
        logCalls.filter((log) => log.includes('Starting data fetch at')).length,
      ).toBe(1);
      expect(
        logCalls.filter(
          (log) => log === 'Previous run still in progress, skipping...',
        ).length,
      ).toBe(1);
      expect(
        logCalls.filter((log) =>
          log.includes('Data fetch completed successfully in'),
        ).length,
      ).toBe(1);
      expect(dataHandler).toHaveBeenCalledTimes(1);
    });

    it('resets isRunning on error', async () => {
      dataHandler.mockImplementationOnce(async (appInstance) => {
        expect(appInstance).toBe(app);
        throw new Error('Test error');
      });

      await runDataFetch();

      dataHandler.mockImplementationOnce(async (appInstance) => {
        expect(appInstance).toBe(app);
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      });

      await runDataFetch();

      const logCalls = consoleLogSpy.mock.calls.map((call) => call[0]);
      expect(
        logCalls.filter((log) => log.includes('Starting data fetch at')).length,
      ).toBe(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching data:',
        expect.any(Error),
      );
      expect(
        logCalls.filter((log) =>
          log.includes('Data fetch completed successfully in'),
        ).length,
      ).toBe(1);
      expect(dataHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('errorHandler middleware', () => {
    let req;
    let res;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('logs the stack and sends 500 JSON', () => {
      const err = new Error('Simulated error');
      errorHandler(err, req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(err.stack);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });
  });

  describe('startServer', () => {
    beforeEach(async () => {
      if (app.locals.models) {
        await app.locals.models.ETHStakingHistorical.destroy({ where: {} });
        await app.locals.models.TokenPrice.destroy({ where: {} });
        await app.locals.models.LPHistorical.destroy({ where: {} });
        await app.locals.models.Pool.destroy({ where: {} });
        await app.locals.models.Token.destroy({ where: {} });
      }
    });

    it('should connect to the database, sync schema, and start the server', async () => {
      const mockListen = jest
        .spyOn(app, 'listen')
        .mockImplementation((port, callback) => {
          callback();
          server = {
            close: jest.fn(),
          };
          return server;
        });

      await startServer();

      expect(retry).toHaveBeenCalledWith(expect.any(Function), {
        verbose: true,
        retries: 5,
        initialDelay: 5000,
      });
      expect(consoleLogSpy).toHaveBeenCalledWith('Connected to TimescaleDB');
      expect(consoleLogSpy).toHaveBeenCalledWith('Database schema synced');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Data Service running on port ${process.env.DATA_SERVICE_PORT}`,
      );
      expect(mockListen).toHaveBeenCalledWith(
        process.env.DATA_SERVICE_PORT,
        expect.any(Function),
      );
      mockListen.mockRestore();
    });

    it('should seed data if database is empty', async () => {
      const mockListen = jest
        .spyOn(app, 'listen')
        .mockImplementation((port, callback) => {
          callback();
          server = {
            close: jest.fn(),
          };
          return server;
        });

      dataHandler.mockImplementationOnce(async () => {
        await setup.seedTokenData();
        await setup.seedPoolData();
        await setup.seedStakingData();
        await setup.seedPriceData();
        await setup.seedLpData();
      });

      await startServer();

      const ethCount = await app.locals.models.ETHStakingHistorical.count();
      const priceCount = await app.locals.models.TokenPrice.count();
      const lpCount = await app.locals.models.LPHistorical.count();

      expect(ethCount).toBeGreaterThan(0);
      expect(priceCount).toBeGreaterThan(0);
      expect(lpCount).toBeGreaterThan(0);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Database is empty or partially seeded, seeding historical data...',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database seeded successfully in'),
      );

      mockListen.mockRestore();
    });

    it('should skip seeding if database already contains data', async () => {
      const mockListen = jest
        .spyOn(app, 'listen')
        .mockImplementation((port, callback) => {
          callback();
          server = {
            close: jest.fn(),
          };
          return server;
        });

      await setup.seedTokenData();
      await setup.seedPoolData();
      await setup.seedStakingData();
      await setup.seedPriceData();
      await setup.seedLpData();

      await startServer();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Database already contains data, skipping seeding',
      );
      expect(dataHandler).not.toHaveBeenCalled();

      mockListen.mockRestore();
    });

    it('should throw an error if models are missing', async () => {
      const { validateModels } = await import('../../app.js');

      expect(() => validateModels({})).toThrow(
        'Database models are not available',
      );
      expect(() => validateModels(null)).toThrow(
        'Database models are not available',
      );
      expect(() =>
        validateModels({
          SomeModel: {},
        }),
      ).toThrow('Database models are not available');

      expect(() =>
        validateModels({
          ETHStakingHistorical: {},
          TokenPrice: {},
          LPHistorical: {},
        }),
      ).not.toThrow();
    });

    it('should handle database connection failure', async () => {
      const mockAuthenticate = jest
        .spyOn(Sequelize.prototype, 'authenticate')
        .mockRejectedValue(new Error('Connection error'));

      await expect(startServer()).rejects.toThrow('Connection error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error during startup:',
        expect.any(Error),
      );

      mockAuthenticate.mockRestore();
    });
  });
});
