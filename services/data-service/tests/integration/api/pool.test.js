import {
  setupTestEnvironment,
  teardownTestEnvironment,
  seedTestData,
  initializeApp,
  testClient,
} from '../../setup.js';

describe('GET /api/data/pool', () => {
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

  it('should retrieve pool data for valid address without date filters', async () => {
    await seedTestData();

    const response = await testClient.request
      .get('/api/data/pool')
      .query({ address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      poolData: [
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          pool_address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
          tvl_usd: '1000000.123457',
          volume_24h_usd: '500000.654321',
          fees_24h_usd: '1500.123457',
        },
        {
          timestamp: '2023-01-02T00:00:00.000Z',
          pool_address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
          tvl_usd: '1010000.987654',
          volume_24h_usd: '510000.123457',
          fees_24h_usd: '1520.654321',
        },
      ],
    });
  });

  it('should retrieve pool data with valid start and end dates', async () => {
    await seedTestData();

    const response = await testClient.request.get('/api/data/pool').query({
      address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      start: '2023-01-01',
      end: '2023-01-01',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      poolData: [
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          pool_address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
          tvl_usd: '1000000.123457',
          volume_24h_usd: '500000.654321',
          fees_24h_usd: '1500.123457',
        },
      ],
    });
  });

  it('should return 400 for invalid start date format', async () => {
    const response = await testClient.request.get('/api/data/pool').query({
      address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      start: 'invalid-date',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid start date' });
  });

  it('should return 400 for invalid end date format', async () => {
    const response = await testClient.request.get('/api/data/pool').query({
      address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      end: 'invalid-date',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid end date' });
  });

  it('should return 400 when start date is after end date', async () => {
    const response = await testClient.request.get('/api/data/pool').query({
      address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      start: '2023-01-03',
      end: '2023-01-01',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Start date must be before end date',
    });
  });

  it('should return 400 for missing address parameter', async () => {
    const response = await testClient.request.get('/api/data/pool');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing address parameter' });
  });

  it('should return 400 for invalid address', async () => {
    const response = await testClient.request
      .get('/api/data/pool')
      .query({ address: '0xinvalid' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid address parameter' });
  });

  it('should return 500 when LPHistorical model is missing', async () => {
    const originalModel = app.locals.models.LPHistorical;
    app.locals.models.LPHistorical = undefined;

    try {
      const response = await testClient.request
        .get('/api/data/pool')
        .query({ address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: 'An unexpected error occurred.',
      });
    } finally {
      app.locals.models.LPHistorical = originalModel;
    }
  });

  it('should return an empty array when no pool data is present', async () => {
    const response = await testClient.request
      .get('/api/data/pool')
      .query({ address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ poolData: [] });
  });
});
