import { Op } from 'sequelize';
import router from '../../../src/routes/dataRoutes.js';
import { poolAddresses, tokenAddresses } from '../../../src/config/pools.js';

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

function getHandler(path) {
  const layer = router.stack.find((l) => l.route && l.route.path === path);
  if (!layer) throw new Error(`Route ${path} not found`);
  return layer.route.stack[0].handle;
}

describe('dataRoutes', () => {
  describe('GET /apy-history', () => {
    let req;
    let res;
    let models;

    beforeEach(() => {
      models = {
        ETHStakingHistorical: {
          findAll: jest.fn(),
        },
      };
      req = {
        query: {},
        app: {
          locals: {
            models,
          },
        },
      };
      res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
    });

    const handler = getHandler('/apy-history');

    it('should return APY history without date filters', async () => {
      const sampleData = [
        { timestamp: new Date('2023-01-01'), apy_percentage: 5 },
      ];
      models.ETHStakingHistorical.findAll.mockResolvedValue(sampleData);

      await handler(req, res);

      expect(models.ETHStakingHistorical.findAll).toHaveBeenCalledWith({
        where: {},
        order: [['timestamp', 'ASC']],
      });
      expect(res.json).toHaveBeenCalledWith({ apyHistory: sampleData });
    });

    it('should return APY history with valid start and end dates', async () => {
      req.query = { start: '2023-01-01', end: '2023-01-31' };
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const sampleData = [
        { timestamp: new Date('2023-01-15'), apy_percentage: 6 },
      ];
      models.ETHStakingHistorical.findAll.mockResolvedValue(sampleData);

      await handler(req, res);

      expect(models.ETHStakingHistorical.findAll).toHaveBeenCalledWith({
        where: {
          timestamp: { [Op.gte]: startDate, [Op.lte]: endDate },
        },
        order: [['timestamp', 'ASC']],
      });
      expect(res.json).toHaveBeenCalledWith({ apyHistory: sampleData });
    });

    it('should return APY history with only end date', async () => {
      req.query.end = '2023-01-31';
      const endDate = new Date('2023-01-31');
      const sampleData = [
        { timestamp: new Date('2023-01-15'), apy_percentage: 6 },
      ];
      models.ETHStakingHistorical.findAll.mockResolvedValue(sampleData);

      await handler(req, res);

      expect(models.ETHStakingHistorical.findAll).toHaveBeenCalledWith({
        where: {
          timestamp: { [Op.lte]: endDate },
        },
        order: [['timestamp', 'ASC']],
      });
      expect(res.json).toHaveBeenCalledWith({ apyHistory: sampleData });
    });

    it('should return 400 for invalid start date', async () => {
      req.query.start = 'invalid-date';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid start date' });
    });

    it('should return 400 for invalid end date', async () => {
      req.query.end = 'invalid-date';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid end date' });
    });

    it('should return 400 if start date is after end date', async () => {
      req.query = { start: '2023-02-01', end: '2023-01-01' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Start date must be before end date',
      });
    });

    it('should return 500 if model is not available', async () => {
      req.app.locals.models = undefined;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'An unexpected error occurred.',
      });
    });

    it('should return 500 if database query fails', async () => {
      models.ETHStakingHistorical.findAll.mockRejectedValue(
        new Error('Database error'),
      );

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'An unexpected error occurred.',
      });
    });
  });

  describe('GET /pools', () => {
    let req;
    let res;
    let models;

    beforeEach(() => {
      models = {
        Pool: {
          findAll: jest.fn(),
        },
      };
      req = {
        app: {
          locals: {
            models,
          },
        },
      };
      res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
    });

    const handler = getHandler('/pools');

    it('should return pools', async () => {
      const samplePools = [
        { pool_address: '0x123', token0_symbol: 'WETH', token1_symbol: 'USDC' },
      ];
      models.Pool.findAll.mockResolvedValue(samplePools);

      await handler(req, res);

      expect(models.Pool.findAll).toHaveBeenCalledWith();
      expect(res.json).toHaveBeenCalledWith({ pools: samplePools });
    });

    it('should return 500 if model is not available', async () => {
      req.app.locals.models = undefined;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'An unexpected error occurred.',
      });
    });

    it('should return 500 if database query fails', async () => {
      models.Pool.findAll.mockRejectedValue(new Error('Database error'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'An unexpected error occurred.',
      });
    });
  });

  describe('GET /pool', () => {
    let req;
    let res;
    let models;
    const validAddress = Object.values(poolAddresses)[0];
    const invalidAddress = 'invalid_address';

    beforeEach(() => {
      models = {
        LPHistorical: {
          findAll: jest.fn(),
        },
      };
      req = {
        query: { address: validAddress },
        app: {
          locals: {
            models,
          },
        },
      };
      res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
    });

    const handler = getHandler('/pool');

    it('should return 400 if address is missing', async () => {
      req.query = {};

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing address parameter',
      });
    });

    it('should return 400 if address is invalid', async () => {
      req.query.address = invalidAddress;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid address parameter',
      });
    });

    it('should return pool data without date filters', async () => {
      req.query.address = validAddress;
      const sampleData = [
        {
          timestamp: new Date('2023-01-01'),
          pool_address: validAddress,
          tvl_usd: 1000,
          volume_24h_usd: 500,
          fees_24h_usd: 50,
        },
      ];
      models.LPHistorical.findAll.mockResolvedValue(sampleData);

      await handler(req, res);

      expect(models.LPHistorical.findAll).toHaveBeenCalledWith({
        where: { pool_address: validAddress },
        order: [['timestamp', 'ASC']],
      });
      expect(res.json).toHaveBeenCalledWith({ poolData: sampleData });
    });

    it('should return pool data with valid start and end dates', async () => {
      req.query = {
        address: validAddress,
        start: '2023-01-01',
        end: '2023-01-31',
      };
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const sampleData = [
        {
          timestamp: new Date('2023-01-15'),
          pool_address: validAddress,
          tvl_usd: 1500,
          volume_24h_usd: 600,
          fees_24h_usd: 60,
        },
      ];
      models.LPHistorical.findAll.mockResolvedValue(sampleData);

      await handler(req, res);

      expect(models.LPHistorical.findAll).toHaveBeenCalledWith({
        where: {
          pool_address: validAddress,
          timestamp: { [Op.gte]: startDate, [Op.lte]: endDate },
        },
        order: [['timestamp', 'ASC']],
      });
      expect(res.json).toHaveBeenCalledWith({ poolData: sampleData });
    });

    it('should return pool data with only end date', async () => {
      req.query = { address: validAddress, end: '2023-01-31' };
      const endDate = new Date('2023-01-31');
      const sampleData = [
        {
          timestamp: new Date('2023-01-15'),
          pool_address: validAddress,
          tvl_usd: 1500,
          volume_24h_usd: 600,
          fees_24h_usd: 60,
        },
      ];
      models.LPHistorical.findAll.mockResolvedValue(sampleData);

      await handler(req, res);

      expect(models.LPHistorical.findAll).toHaveBeenCalledWith({
        where: {
          pool_address: validAddress,
          timestamp: { [Op.lte]: endDate },
        },
        order: [['timestamp', 'ASC']],
      });
      expect(res.json).toHaveBeenCalledWith({ poolData: sampleData });
    });

    it('should return 400 for invalid start date', async () => {
      req.query.start = 'invalid-date';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid start date' });
    });

    it('should return 400 for invalid end date', async () => {
      req.query.end = 'invalid-date';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid end date' });
    });

    it('should return 400 if start date is after end date', async () => {
      req.query = {
        address: validAddress,
        start: '2023-02-01',
        end: '2023-01-01',
      };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Start date must be before end date',
      });
    });

    it('should return 500 if model is not available', async () => {
      req.app.locals.models = undefined;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'An unexpected error occurred.',
      });
    });

    it('should return 500 if database query fails', async () => {
      models.LPHistorical.findAll.mockRejectedValue(
        new Error('Database error'),
      );

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'An unexpected error occurred.',
      });
    });
  });

  describe('GET /price-history', () => {
    let req;
    let res;
    let models;
    const validToken = Object.keys(tokenAddresses)[0]?.toLowerCase();
    const invalidToken = 'invalid_token';

    beforeEach(() => {
      models = {
        TokenPrice: {
          findAll: jest.fn(),
        },
      };
      req = {
        query: { token: validToken },
        app: {
          locals: {
            models,
          },
        },
      };
      res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
    });

    const handler = getHandler('/price-history');

    it('should return 400 if token is missing', async () => {
      req.query = {};

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing token parameter',
      });
    });

    it('should return 400 if token is invalid', async () => {
      req.query.token = invalidToken;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid token parameter',
      });
    });

    it('should return price data without date filters', async () => {
      req.query.token = validToken;
      const sampleData = [
        {
          timestamp: new Date('2023-01-01'),
          token_symbol: validToken.toUpperCase(),
          price_usd: 2000,
        },
      ];
      models.TokenPrice.findAll.mockResolvedValue(sampleData);

      await handler(req, res);

      expect(models.TokenPrice.findAll).toHaveBeenCalledWith({
        where: { token_symbol: validToken.toUpperCase() },
        order: [['timestamp', 'ASC']],
      });
      expect(res.json).toHaveBeenCalledWith({ priceData: sampleData });
    });

    it('should return price data with valid start and end dates', async () => {
      req.query = {
        token: validToken,
        start: '2023-01-01',
        end: '2023-01-31',
      };
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const sampleData = [
        {
          timestamp: new Date('2023-01-15'),
          token_symbol: validToken.toUpperCase(),
          price_usd: 2100,
        },
      ];
      models.TokenPrice.findAll.mockResolvedValue(sampleData);

      await handler(req, res);

      expect(models.TokenPrice.findAll).toHaveBeenCalledWith({
        where: {
          token_symbol: validToken.toUpperCase(),
          timestamp: { [Op.gte]: startDate, [Op.lte]: endDate },
        },
        order: [['timestamp', 'ASC']],
      });
      expect(res.json).toHaveBeenCalledWith({ priceData: sampleData });
    });

    it('should return price history with only end date', async () => {
      req.query = { token: validToken, end: '2023-01-31' };
      const endDate = new Date('2023-01-31');
      const sampleData = [
        {
          timestamp: new Date('2023-01-15'),
          token_symbol: validToken.toUpperCase(),
          price_usd: 2100,
        },
      ];
      models.TokenPrice.findAll.mockResolvedValue(sampleData);

      await handler(req, res);

      expect(models.TokenPrice.findAll).toHaveBeenCalledWith({
        where: {
          token_symbol: validToken.toUpperCase(),
          timestamp: { [Op.lte]: endDate },
        },
        order: [['timestamp', 'ASC']],
      });
      expect(res.json).toHaveBeenCalledWith({ priceData: sampleData });
    });

    it('should handle token case insensitivity', async () => {
      req.query.token = validToken.toUpperCase();
      const sampleData = [
        {
          timestamp: new Date('2023-01-01'),
          token_symbol: validToken.toUpperCase(),
          price_usd: 2000,
        },
      ];
      models.TokenPrice.findAll.mockResolvedValue(sampleData);

      await handler(req, res);

      expect(models.TokenPrice.findAll).toHaveBeenCalledWith({
        where: { token_symbol: validToken.toUpperCase() },
        order: [['timestamp', 'ASC']],
      });
      expect(res.json).toHaveBeenCalledWith({ priceData: sampleData });
    });

    it('should return 400 for invalid start date', async () => {
      req.query.start = 'invalid-date';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid start date' });
    });

    it('should return 400 for invalid end date', async () => {
      req.query.end = 'invalid-date';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid end date' });
    });

    it('should return 400 if start date is after end date', async () => {
      req.query = { token: validToken, start: '2023-02-01', end: '2023-01-01' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Start date must be before end date',
      });
    });

    it('should return 500 if model is not available', async () => {
      req.app.locals.models = undefined;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'An unexpected error occurred.',
      });
    });

    it('should return 500 if database query fails', async () => {
      models.TokenPrice.findAll.mockRejectedValue(new Error('Database error'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'An unexpected error occurred.',
      });
    });
  });
});
