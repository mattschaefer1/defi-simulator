// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATA_SERVICE_PORT = '3001';
process.env.DB_URL =
  'postgres://postgres:postgres@localhost:5432/defi_simulator_test';

// Mock console methods to keep test output clean
global.console = {
  ...console,
  // Suppress console logs during tests
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Increase timeout for tests that might take longer
jest.setTimeout(10000);
