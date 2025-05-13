import {
  setupTestEnvironment,
  teardownTestEnvironment,
  seedTokenData,
  seedPriceData,
  initializeApp,
  testClient,
} from '../../setup.js';

describe('GET /api/data/price-history', () => {
  let app;

  beforeAll(async () => {
    await setupTestEnvironment();
    app = await initializeApp();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await app.locals.sequelize.sync({ force: true });
  });

  it('should retrieve price history for valid token without date filters', async () => {
    await seedTokenData();
    await seedPriceData();

    const response = await testClient.request
      .get('/api/data/price-history')
      .query({ token: 'WETH' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      priceData: [
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          token_symbol: 'WETH',
          price_usd: '1200.123457',
        },
        {
          timestamp: '2023-01-02T00:00:00.000Z',
          token_symbol: 'WETH',
          price_usd: '1210.654321',
        },
      ],
    });
  });

  it('should retrieve price history with valid start and end dates', async () => {
    await seedTokenData();
    await seedPriceData();

    const response = await testClient.request
      .get('/api/data/price-history')
      .query({ token: 'WETH', start: '2023-01-01', end: '2023-01-01' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      priceData: [
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          token_symbol: 'WETH',
          price_usd: '1200.123457',
        },
      ],
    });
  });

  it('should return 400 for invalid start date format', async () => {
    const response = await testClient.request
      .get('/api/data/price-history')
      .query({ token: 'WETH', start: 'invalid-date' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid start date' });
  });

  it('should return 400 for invalid end date format', async () => {
    const response = await testClient.request
      .get('/api/data/price-history')
      .query({ token: 'WETH', end: 'invalid-date' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid end date' });
  });

  it('should return 400 when start date is after end date', async () => {
    const response = await testClient.request
      .get('/api/data/price-history')
      .query({ token: 'WETH', start: '2023-01-03', end: '2023-01-01' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Start date must be before end date',
    });
  });

  it('should return 400 for missing token parameter', async () => {
    const response = await testClient.request.get('/api/data/price-history');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing token parameter' });
  });

  it('should return 400 for invalid token', async () => {
    const response = await testClient.request
      .get('/api/data/price-history')
      .query({ token: 'INVALID' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid token parameter' });
  });

  it('should return 500 when TokenPrice model is missing', async () => {
    const originalModel = app.locals.models.TokenPrice;
    app.locals.models.TokenPrice = undefined;

    try {
      const response = await testClient.request
        .get('/api/data/price-history')
        .query({ token: 'WETH' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: 'An unexpected error occurred.',
      });
    } finally {
      app.locals.models.TokenPrice = originalModel;
    }
  });

  it('should return an empty array when no price data is present', async () => {
    await app.locals.models.Token.bulkCreate([{ token_symbol: 'WETH' }]);

    const response = await testClient.request
      .get('/api/data/price-history')
      .query({ token: 'WETH' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ priceData: [] });
  });
});
