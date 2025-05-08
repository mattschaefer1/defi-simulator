import {
  setupTestEnvironment,
  teardownTestEnvironment,
  initializeApp,
  testClient,
} from '../../setup.js';

describe('GET /api/data/apy-history', () => {
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

  it('should retrieve APY history without date filters', async () => {
    await app.locals.models.ETHStakingHistorical.bulkCreate([
      { timestamp: '2023-01-01T00:00:00.000Z', apy_percentage: 5.12 },
      { timestamp: '2023-01-02T00:00:00.000Z', apy_percentage: 5.26 },
    ]);

    const response = await testClient.request.get('/api/data/apy-history');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      apyHistory: [
        { timestamp: '2023-01-01T00:00:00.000Z', apy_percentage: '5.12' },
        { timestamp: '2023-01-02T00:00:00.000Z', apy_percentage: '5.26' },
      ],
    });
  });

  it('should retrieve APY history with valid start and end dates', async () => {
    await app.locals.models.ETHStakingHistorical.bulkCreate([
      { timestamp: '2023-01-01T00:00:00.000Z', apy_percentage: 5.0 },
      { timestamp: '2023-01-02T00:00:00.000Z', apy_percentage: 5.1 },
      { timestamp: '2023-01-03T00:00:00.000Z', apy_percentage: 5.2 },
      { timestamp: '2023-01-04T00:00:00.000Z', apy_percentage: 5.3 },
    ]);

    const response = await testClient.request
      .get('/api/data/apy-history')
      .query({ start: '2023-01-02', end: '2023-01-03' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      apyHistory: [
        { timestamp: '2023-01-02T00:00:00.000Z', apy_percentage: '5.10' },
        { timestamp: '2023-01-03T00:00:00.000Z', apy_percentage: '5.20' },
      ],
    });
  });

  it('should return 400 for invalid start date format', async () => {
    const response = await testClient.request
      .get('/api/data/apy-history')
      .query({ start: 'invalid-date' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid start date' });
  });

  it('should return 400 for invalid end date format', async () => {
    const response = await testClient.request
      .get('/api/data/apy-history')
      .query({ end: 'invalid-date' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid end date' });
  });

  it('should return 400 when start date is after end date', async () => {
    const response = await testClient.request
      .get('/api/data/apy-history')
      .query({ start: '2023-01-03', end: '2023-01-01' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Start date must be before end date',
    });
  });

  it('should return 500 when ETHStakingHistorical model is missing', async () => {
    const originalModel = app.locals.models.ETHStakingHistorical;
    app.locals.models.ETHStakingHistorical = undefined;

    try {
      const response = await testClient.request.get('/api/data/apy-history');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: 'An unexpected error occurred.',
      });
    } finally {
      app.locals.models.ETHStakingHistorical = originalModel;
    }
  });

  it('should return an empty array when no data is present', async () => {
    const response = await testClient.request.get('/api/data/apy-history');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ apyHistory: [] });
  });
});
