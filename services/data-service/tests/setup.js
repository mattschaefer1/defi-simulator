import { GenericContainer } from 'testcontainers';
import supertest from 'supertest';
import axios from 'axios';
import { request } from 'graphql-request';
import { poolIds } from '../src/config/pools.js';

process.env.NODE_ENV = 'test';
process.env.DB_URL =
  process.env.DB_URL ||
  'postgres://postgres:postgres@localhost:5432/defi_simulator_test';

global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.setTimeout(10000);

let container;
let sequelize;
let models;
async function loadModels() {
  const { sequelize: seq, models: mdl } = await import(
    '../src/models/index.js'
  );
  sequelize = seq;
  models = mdl;
}

export async function setupTestEnvironment() {
  try {
    container = await new GenericContainer('postgres:13')
      .withEnvironment({
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
        POSTGRES_DB: 'defi_simulator_test',
      })
      .withExposedPorts(5432)
      .start();
    process.env.DB_URL = `postgres://postgres:postgres@localhost:${container.getMappedPort(5432)}/defi_simulator_test`;
  } catch (error) {
    console.warn('Testcontainers failed, using local PostgreSQL:', error);
    process.env.DB_URL =
      'postgres://postgres:postgres@localhost:5432/defi_simulator_test';
  }

  await loadModels();

  process.env.DEFILLAMA_API_URL = 'http://mock-defillama.com/';
  process.env.COINGECKO_API_URL = 'http://mock-coingecko.com/';
  process.env.COINGECKO_API_KEY = 'mock-key';
  process.env.GRAPH_API_URL = 'http://mock-graph.com/';

  await sequelize.authenticate();
  await sequelize.sync({ force: true });
}

export async function teardownTestEnvironment() {
  try {
    const { stopServer } = await import('../app.js');
    stopServer();
    if (container) {
      await container.stop();
      container = null;
    }
    if (sequelize) {
      await sequelize.close();
      sequelize = null;
    }
  } catch (error) {
    console.error('Error during teardown:', error);
  }
}

export async function seedTokenData() {
  if (!models) {
    await loadModels();
  }
  await models.Token.bulkCreate([
    { token_symbol: 'WETH' },
    { token_symbol: 'USDC' },
    { token_symbol: 'WBTC' },
    { token_symbol: 'DAI' },
  ]);
}

export async function seedPoolData() {
  if (!models) {
    await loadModels();
  }
  await models.Pool.bulkCreate([
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
  ]);
}

export async function seedStakingData() {
  if (!models) {
    await loadModels();
  }
  await models.ETHStakingHistorical.bulkCreate([
    { timestamp: '2023-01-01T00:00:00.000Z', apy_percentage: 5.01 },
    { timestamp: '2023-01-02T00:00:00.000Z', apy_percentage: 5.12 },
  ]);
}

export async function seedPriceData() {
  if (!models) {
    await loadModels();
  }
  await models.TokenPrice.bulkCreate([
    {
      timestamp: '2023-01-01T00:00:00.000Z',
      token_symbol: 'WETH',
      price_usd: 1200.123457,
    },
    {
      timestamp: '2023-01-02T00:00:00.000Z',
      token_symbol: 'WETH',
      price_usd: 1210.654321,
    },
  ]);
}

export async function seedLpData() {
  if (!models) {
    await loadModels();
  }
  await models.LPHistorical.bulkCreate([
    {
      timestamp: '2023-01-01T00:00:00.000Z',
      pool_address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      tvl_usd: 1000000.123457,
      volume_24h_usd: 500000.654321,
      fees_24h_usd: 1500.123457,
    },
    {
      timestamp: '2023-01-02T00:00:00.000Z',
      pool_address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      tvl_usd: 1010000.987654,
      volume_24h_usd: 510000.123457,
      fees_24h_usd: 1520.654321,
    },
  ]);
}

jest.mock('axios');
jest.mock('graphql-request', () => ({
  request: jest.fn(),
  gql: jest.fn().mockImplementation((strings, ...values) => {
    let result = '';
    strings.forEach((str, i) => {
      result += str;
      if (i < values.length) {
        result += values[i];
      }
    });
    return result;
  }),
}));

export function mockExternalApis() {
  axios.get.mockImplementation(async (url) => {
    if (url.startsWith(process.env.DEFILLAMA_API_URL)) {
      const poolId = url.split('/').pop();
      if (
        poolId === poolIds.wethUsdc ||
        poolId === poolIds.wbtcUsdc ||
        poolId === poolIds.lidoEth
      ) {
        return {
          data: {
            data: [
              { timestamp: '2023-01-01', apy: 5.012, tvlUsd: 1000000.1234567 },
              { timestamp: '2023-01-02', apy: 5.123, tvlUsd: 1010000.9876543 },
            ],
          },
        };
      }
      return { data: { data: [] } };
    }
    if (url.startsWith(process.env.COINGECKO_API_URL)) {
      return {
        data: {
          prices: [
            [1672531200000, 1200.1234567], // 2023-01-01
            [1672617600000, 1210.654321], // 2023-01-02
          ],
        },
      };
    }
    throw new Error(`Unexpected URL: ${url}`);
  });

  request.mockImplementation(async (url, query) => {
    if (url === process.env.GRAPH_API_URL) {
      const address = query.match(/pool: "([^"]+)"/)?.[1];
      if (
        address === '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' ||
        address === '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35'
      ) {
        return {
          poolDayDatas: [
            {
              date: 1672531200, // 2023-01-01
              feesUSD: '1500.1234567',
              volumeUSD: '500000.6543210',
            },
            {
              date: 1672617600, // 2023-01-02
              feesUSD: '1520.6543210',
              volumeUSD: '510000.1234567',
            },
          ],
        };
      }
      return { poolDayDatas: [] };
    }
    throw new Error(`Unexpected GraphQL URL: ${url}`);
  });
}

export const testClient = { request: null };

export async function initializeApp() {
  await loadModels();
  const { default: expressApp } = await import('../app.js');
  expressApp.locals.models = models;
  expressApp.locals.sequelize = sequelize;
  testClient.request = supertest(expressApp);
  return expressApp;
}
