import axios from 'axios';
import { request } from 'graphql-request';
import {
  fetchPoolData,
  fetchPriceData,
  fetchUniswapPoolData,
} from '../../../src/data/fetcher.js';

// Mock external dependencies
jest.mock('../../../src/utils/retry', () => (fn) => fn());

// Spy on console methods
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

describe('Data Fetching Functions', () => {
  describe('fetchPoolData', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.DEFILLAMA_API_URL = 'https://yields.llama.fi/chart/';
    });

    afterEach(() => {
      delete process.env.DEFILLAMA_API_URL;
    });

    it('should throw if DEFILLAMA_API_URL is not set', async () => {
      delete process.env.DEFILLAMA_API_URL;
      await expect(fetchPoolData()).rejects.toThrow(
        'DEFILLAMA_API_URL is not set in the environment variables.',
      );
    });

    it('should return empty object and warn if no pools', async () => {
      jest.spyOn(Object, 'keys').mockReturnValueOnce([]);
      const result = await fetchPoolData();
      expect(result).toEqual({});
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'No pools to fetch data for.',
      );
    });

    it('should fetch data successfully', async () => {
      axios.get.mockResolvedValue({
        data: { data: [{ timestamp: 1, tvlUsd: 100, apy: 5 }] },
      });
      const result = await fetchPoolData();
      expect(result).toEqual({
        lidoEth: [{ timestamp: 1, tvlUsd: 100, apy: 5 }],
        wethUsdc: [{ timestamp: 1, tvlUsd: 100, apy: 5 }],
        wbtcUsdc: [{ timestamp: 1, tvlUsd: 100, apy: 5 }],
        wbtcWeth: [{ timestamp: 1, tvlUsd: 100, apy: 5 }],
        daiUsdc: [{ timestamp: 1, tvlUsd: 100, apy: 5 }],
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Fetching data for 5 pools...',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Successfully fetched data for 5 out of 5 pools.',
      );
    });

    it('should handle failed API calls', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));
      const result = await fetchPoolData();
      expect(result).toEqual({
        lidoEth: null,
        wethUsdc: null,
        wbtcUsdc: null,
        wbtcWeth: null,
        daiUsdc: null,
      });
      expect(consoleErrorSpy).toHaveBeenCalledTimes(5);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Successfully fetched data for 0 out of 5 pools.',
      );
    });

    it('should handle partial success', async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { data: [{ timestamp: 1, tvlUsd: 100, apy: 5 }] },
        })
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValue({
          data: { data: [{ timestamp: 2, tvlUsd: 200, apy: 6 }] },
        });
      const result = await fetchPoolData();
      expect(Object.values(result).filter((data) => data !== null).length).toBe(
        4,
      );
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Successfully fetched data for 4 out of 5 pools.',
      );
    });

    it('should handle invalid response format', async () => {
      axios.get.mockResolvedValue({
        data: { data: {} }, // Non-array data
      });
      const result = await fetchPoolData();
      expect(result).toEqual({
        lidoEth: null,
        wethUsdc: null,
        wbtcUsdc: null,
        wbtcWeth: null,
        daiUsdc: null,
      });
      expect(consoleErrorSpy).toHaveBeenCalledTimes(5); // Once for each pool
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching APY and TVL data for lidoEth after retries:',
        'Invalid response format',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Successfully fetched data for 0 out of 5 pools.',
      );
    });
  });

  describe('fetchPriceData', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.COINGECKO_API_URL =
        'https://api.coingecko.com/api/v3/coins/ethereum/contract/';
      process.env.COINGECKO_API_KEY = 'test-key';
    });

    afterEach(() => {
      delete process.env.COINGECKO_API_URL;
      delete process.env.COINGECKO_API_KEY;
    });

    it('should throw if environment variables are not set', async () => {
      delete process.env.COINGECKO_API_URL;
      await expect(fetchPriceData()).rejects.toThrow(
        'COINGECKO_API_URL or COINGECKO_API_KEY is not set in the environment variables.',
      );
    });

    it('should return empty object and warn if no tokens', async () => {
      jest.spyOn(Object, 'keys').mockReturnValueOnce([]);
      const result = await fetchPriceData();
      expect(result).toEqual({});
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'No tokens to fetch data for.',
      );
    });

    it('should fetch data successfully', async () => {
      axios.get.mockResolvedValue({
        data: { prices: [[1620000000, 2000]] },
      });
      const result = await fetchPriceData(30);
      expect(result).toEqual({
        weth: [[1620000000, 2000]],
        wbtc: [[1620000000, 2000]],
        dai: [[1620000000, 2000]],
        usdc: [[1620000000, 2000]],
      });
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { vs_currency: 'usd', days: 30, interval: 'daily' },
        }),
      );
    });

    it('should handle failed API calls', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));
      const result = await fetchPriceData();
      expect(result).toEqual({
        weth: null,
        wbtc: null,
        dai: null,
        usdc: null,
      });
      expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
    });

    it('should handle partial success', async () => {
      axios.get
        .mockResolvedValueOnce({ data: { prices: [[1620000000, 2000]] } })
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValue({ data: { prices: [[1620000000, 2000]] } });
      const result = await fetchPriceData();
      expect(Object.values(result).filter((data) => data !== null).length).toBe(
        3,
      );
    });

    it('should handle invalid response format', async () => {
      axios.get.mockResolvedValue({
        data: { data: {} }, // Non-array data
      });
      const result = await fetchPriceData();
      expect(result).toEqual({
        weth: null,
        wbtc: null,
        dai: null,
        usdc: null,
      });
      expect(consoleErrorSpy).toHaveBeenCalledTimes(4); // Once for each token
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching price data for weth after retries:',
        'Invalid prices format',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Successfully fetched price data for 0 out of 4 tokens.',
      );
    });
  });

  describe('fetchUniswapPoolData', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.GRAPH_API_URL =
        'https://gateway.thegraph.com/api/2af7556c840f06e139f826930c8cdb57/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV';
    });

    afterEach(() => {
      delete process.env.GRAPH_API_URL;
    });

    it('should throw if GRAPH_API_URL is not set', async () => {
      delete process.env.GRAPH_API_URL;
      await expect(fetchUniswapPoolData()).rejects.toThrow(
        'GRAPH_API_URL is not set in the environment variables.',
      );
    });

    it('should return empty object and warn if no pools', async () => {
      jest.spyOn(Object, 'keys').mockReturnValueOnce([]);
      const result = await fetchUniswapPoolData();
      expect(result).toEqual({});
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'No pools to fetch Uniswap data for.',
      );
    });

    it('should fetch data successfully', async () => {
      request.mockResolvedValue({
        poolDayDatas: [{ date: 1620086400, feesUSD: '100', volumeUSD: '1000' }],
      });
      const result = await fetchUniswapPoolData(30, 1620086400);
      expect(result).toEqual({
        wethUsdc: [{ date: 1620086400, feesUSD: '100', volumeUSD: '1000' }],
        wbtcUsdc: [{ date: 1620086400, feesUSD: '100', volumeUSD: '1000' }],
        wbtcWeth: [{ date: 1620086400, feesUSD: '100', volumeUSD: '1000' }],
        daiUsdc: [{ date: 1620086400, feesUSD: '100', volumeUSD: '1000' }],
      });
      expect(request).toHaveBeenCalledTimes(4);
      expect(request).toHaveBeenCalledWith(
        process.env.GRAPH_API_URL,
        expect.stringContaining('first: 30'),
      );
      expect(request.mock.calls[0][1]).toMatch(/first: 30/);
      expect(request.mock.calls[0][1]).toMatch(/date_gt: 1620086400/);
    });

    it('should handle failed API calls', async () => {
      request.mockRejectedValue(new Error('Network Error'));
      const result = await fetchUniswapPoolData();
      expect(result).toEqual({
        wethUsdc: null,
        wbtcUsdc: null,
        wbtcWeth: null,
        daiUsdc: null,
      });
      expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
    });

    it('should handle partial success', async () => {
      request
        .mockResolvedValueOnce({
          poolDayDatas: [
            { date: 1620000000, feesUSD: '100', volumeUSD: '1000' },
          ],
        })
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValue({
          poolDayDatas: [
            { date: 1620000000, feesUSD: '100', volumeUSD: '1000' },
          ],
        });
      const result = await fetchUniswapPoolData();
      expect(Object.values(result).filter((data) => data !== null).length).toBe(
        3,
      );
    });

    it('should handle invalid response format', async () => {
      request.mockResolvedValue({
        data: { data: {} }, // Non-array data
      });
      const result = await fetchUniswapPoolData();
      expect(result).toEqual({
        wethUsdc: null,
        wbtcUsdc: null,
        wbtcWeth: null,
        daiUsdc: null,
      });
      expect(consoleErrorSpy).toHaveBeenCalledTimes(4); // Once for each pool
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching Uniswap pool data for wethUsdc after retries:',
        'Invalid poolDayDatas format',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Successfully fetched Uniswap data for 0 out of 4 pools.',
      );
    });
  });
});
