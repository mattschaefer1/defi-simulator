import axios from 'axios';
import { request, gql } from 'graphql-request';
import { poolIds, tokenAddresses, poolAddresses } from '../config/pools.js';

/**
 * Fetches APY and TVL data from DeFi Llama for each pool in poolIds.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object where keys are pool names
 *                            and values are the fetched data (e.g., APY and TVL). If a request
 *                            fails, the corresponding pool's value is set to null.
 * @throws {Error} If DEFILLAMA_API_URL is not set in the environment variables.
 */
async function fetchPoolData() {
  if (!process.env.DEFILLAMA_API_URL) {
    throw new Error('DEFILLAMA_API_URL is not set in the environment variables.');
  }

  const poolsData = {};
  await Promise.all(
    Object.entries(poolIds).map(async ([poolName, id]) => {
      try {
        const url = `${process.env.DEFILLAMA_API_URL}${id}`;
        const response = await axios.get(url);
        poolsData[poolName] = response.data.data;
      } catch (error) {
        console.error(`Error fetching APY and TVL data for ${poolName}:`, error.message);
        poolsData[poolName] = null;
      }
    })
  );
  return poolsData;
}

/**
 * Fetches historical price data from CoinGecko for each token in tokenAddresses.
 *
 * @param {number} [numDaysAgo=1] - Number of days of historical data to fetch (default: 1).
 * @returns {Promise<Object>} A promise that resolves to an object where keys are token names
 *                            and values are arrays of price data. If a request fails, the
 *                            corresponding token's value is set to null.
 * @throws {Error} If COINGECKO_API_URL or COINGECKO_API_KEY is not set in the environment variables.
 */
async function fetchPriceData(numDaysAgo = 1) {
  if (!process.env.COINGECKO_API_URL || !process.env.COINGECKO_API_KEY) {
    throw new Error('COINGECKO_API_URL or COINGECKO_API_KEY is not set in the environment variables.');
  }

  const pricesData = {};
  await Promise.all(
    Object.entries(tokenAddresses).map(async ([tokenName, address]) => {
      try {
        const url = `${process.env.COINGECKO_API_URL}${address}/market_chart`;
        const response = await axios.get(url, {
          headers: { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY },
          params: { vs_currency: 'usd', days: numDaysAgo, interval: 'daily' }
        });
        pricesData[tokenName] = response.data.prices;
      } catch (error) {
        console.error(`Error fetching price data for ${tokenName}:`, error.message);
        pricesData[tokenName] = null;
      }
    })
  );
  return pricesData;
}

/**
 * Fetches historical data from Uniswap Subgraph for each pool in poolAddresses.
 *
 * @param {number} [numDaysAgo=1] - Number of days of historical data to fetch (default: 1).
 * @param {number} [startTimestamp=1620086400] - Unix timestamp to filter data after this date (default: May 4, 2021).
 * @returns {Promise<Object>} A promise that resolves to an object where keys are pool names
 *                            and values are arrays of pool data (date, feesUSD, volumeUSD).
 *                            If a request fails, the corresponding pool's value is set to null.
 * @throws {Error} If GRAPH_API_URL is not set in the environment variables.
 */
async function fetchUniswapPoolData(numDaysAgo = 1, startTimestamp = 1620086400) {
  if (!process.env.GRAPH_API_URL) {
    throw new Error('GRAPH_API_URL is not set in the environment variables.');
  }

  const poolsData = {};
  await Promise.all(
    Object.entries(poolAddresses).map(async ([poolName, address]) => {
      try {
        const query = gql`
          {
            poolDayDatas(
              first: ${numDaysAgo}
              orderBy: date
              where: {pool: "${address}", date_gt: ${startTimestamp}}
              orderDirection: desc
            ) {
              date
              feesUSD
              volumeUSD
            }
          }
        `;
        const response = await request(process.env.GRAPH_API_URL, query);
        poolsData[poolName] = response.poolDayDatas;
      } catch (error) {
        console.error(`Error fetching pool data for ${poolName}:`, error.message);
        poolsData[poolName] = null;
      }
    })
  );
  return poolsData;
}

export { fetchPoolData, fetchPriceData, fetchUniswapPoolData };
