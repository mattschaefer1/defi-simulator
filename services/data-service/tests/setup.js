import { GenericContainer } from 'testcontainers';
import supertest from 'supertest';
import axios from 'axios';
import { request } from 'graphql-request';

process.env.NODE_ENV = 'test';
process.env.DATA_SERVICE_PORT = '3001';
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
  container = await new GenericContainer('postgres:13')
    .withEnvironment({
      POSTGRES_USER: 'postgres',
      POSTGRES_PASSWORD: 'postgres',
      POSTGRES_DB: 'defi_simulator_test',
    })
    .withExposedPorts(5432)
    .start();

  process.env.DB_URL = `postgres://postgres:postgres@localhost:${container.getMappedPort(5432)}/defi_simulator_test`;

  await loadModels();

  await sequelize.authenticate();
  await sequelize.sync({ force: true });
}

export async function teardownTestEnvironment() {
  if (container) {
    await container.stop();
  }
  if (sequelize) {
    await sequelize.close();
  }
}

export async function seedTestData() {
  if (!models) {
    await loadModels();
  }
  await models.Token.bulkCreate([
    { token_symbol: 'WETH' },
    { token_symbol: 'USDC' },
    { token_symbol: 'WBTC' },
    { token_symbol: 'DAI' },
  ]);

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

  await models.ETHStakingHistorical.bulkCreate([
    {
      timestamp: '2023-01-01T00:00:00.000Z',
      apy_percentage: 5.12,
    },
    {
      timestamp: '2023-01-02T00:00:00.000Z',
      apy_percentage: 5.25,
    },
  ]);

  await models.TokenPrice.bulkCreate([
    {
      timestamp: '2023-01-01T00:00:00.000Z',
      token_symbol: 'WETH',
      price_usd: 1200.123456,
    },
    {
      timestamp: '2023-01-02T00:00:00.000Z',
      token_symbol: 'WETH',
      price_usd: 1210.654321,
    },
  ]);

  await models.LPHistorical.bulkCreate([
    {
      timestamp: '2023-01-01T00:00:00.000Z',
      pool_address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      tvl_usd: 1000000.123456,
      volume_24h_usd: 500000.654321,
      fees_24h_usd: 1500.123456,
    },
    {
      timestamp: '2023-01-02T00:00:00.000Z',
      pool_address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      tvl_usd: 1010000.987654,
      volume_24h_usd: 510000.123456,
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
    if (url.includes('DEFILLAMA_API_URL')) {
      return {
        data: {
          data: [
            { timestamp: '2023-01-01', apy: 5.123, tvlUsd: 1000000 },
            { timestamp: '2023-01-02', apy: 5.256, tvlUsd: 1010000 },
          ],
        },
      };
    }
    if (url.includes('COINGECKO_API_URL')) {
      return {
        data: {
          prices: [
            [1672531200000, 1200.123456], // 2023-01-01
            [1672617600000, 1210.654321], // 2023-01-02
          ],
        },
      };
    }
    throw new Error(`Unexpected URL: ${url}`);
  });

  request.mockImplementation(async (url) => {
    if (url.includes('GRAPH_API_URL')) {
      return {
        poolDayDatas: [
          {
            date: 1672531200, // 2023-01-01
            feesUSD: '1500.123456',
            volumeUSD: '500000.654321',
          },
          {
            date: 1672617600, // 2023-01-02
            feesUSD: '1520.654321',
            volumeUSD: '510000.123456',
          },
        ],
      };
    }
    throw new Error(`Unexpected GraphQL URL: ${url}`);
  });
}

export const testClient = { request: null };

export async function initializeApp() {
  const { default: expressApp } = await import('../app.js');
  testClient.request = supertest(expressApp);
  return expressApp;
}
