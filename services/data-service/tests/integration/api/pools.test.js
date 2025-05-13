import {
  setupTestEnvironment,
  teardownTestEnvironment,
  seedTokenData,
  seedPoolData,
  initializeApp,
  testClient,
} from '../../setup.js';

describe('GET /api/data/pools', () => {
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

  it('should return all pools when data is present', async () => {
    await seedTokenData();
    await seedPoolData();

    const response = await testClient.request.get('/api/data/pools');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      pools: [
        {
          pool_address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
          token0_symbol: 'WETH',
          token1_symbol: 'USDC',
        },
        {
          pool_address: '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35',
          token0_symbol: 'WBTC',
          token1_symbol: 'USDC',
        },
      ],
    });
  });

  it('should return an empty array when no pools are present', async () => {
    const response = await testClient.request.get('/api/data/pools');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ pools: [] });
  });

  it('should return 500 when Pool model is missing', async () => {
    const originalPoolModel = app.locals.models.Pool;
    app.locals.models.Pool = undefined;

    const response = await testClient.request.get('/api/data/pools');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'An unexpected error occurred.',
    });

    app.locals.models.Pool = originalPoolModel;
  });
});
