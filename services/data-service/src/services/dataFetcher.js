import axios from 'axios';
import { request, gql } from 'graphql-request';
import { poolIds, tokenAddresses, poolAddresses } from '../config/pools.js';

async function retry(fn, retries = 3, initialDelay = 1000) {
  let delay = initialDelay;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

/**
 * Fetches APY and TVL data from DeFi Llama for each pool in poolIds.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object where keys are pool names and
 *                            values are arrays of objects containing pool data (e.g., timestamp, tvlUsd, apy).
 *                            If a request fails, the corresponding pool's value is set to null.
 * @throws {Error} If DEFILLAMA_API_URL is not set in the environment variables.
 */
async function fetchPoolData() {
  if (!process.env.DEFILLAMA_API_URL) {
    throw new Error('DEFILLAMA_API_URL is not set in the environment variables.');
  }

  if (Object.keys(poolIds).length === 0) {
    console.warn('No pools to fetch data for.');
    return {};
  }

  console.log(`Fetching data for ${Object.keys(poolIds).length} pools...`);
  const poolsData = {};
  await Promise.all(
    Object.entries(poolIds).map(async ([poolName, id]) => {
      try {
        const url = `${process.env.DEFILLAMA_API_URL}${id}`;
        const response = await retry(() => axios.get(url, { timeout: 10000 }));
        if (!Array.isArray(response.data?.data)) throw new Error('Invalid response format');
        poolsData[poolName] = response.data.data;
      } catch (error) {
        console.error(`Error fetching APY and TVL data for ${poolName} after retries:`, error.message);
        poolsData[poolName] = null;
      }
    })
  );
  const successfulFetches = Object.values(poolsData).filter(data => data !== null).length;
  console.log(`Successfully fetched data for ${successfulFetches} out of ${Object.keys(poolIds).length} pools.`);
  return poolsData;
}

/**
 * Fetches historical price data from CoinGecko for each token in tokenAddresses.
 *
 * @param {number} [numDaysAgo=3] - Number of days of historical data to fetch (default: 3).
 * @returns {Promise<Object>} A promise that resolves to an object where keys are token names
 *                            and values are arrays of arrays containing timestamp and price data.
 *                            If a request fails, the corresponding token's value is set to null.
 * @throws {Error} If COINGECKO_API_URL or COINGECKO_API_KEY is not set in the environment variables.
 */
async function fetchPriceData(numDaysAgo = 3) {
  if (!process.env.COINGECKO_API_URL || !process.env.COINGECKO_API_KEY) {
    throw new Error('COINGECKO_API_URL or COINGECKO_API_KEY is not set in the environment variables.');
  }

  if (Object.keys(tokenAddresses).length === 0) {
    console.warn('No tokens to fetch data for.');
    return {};
  }

  console.log(`Fetching price data for ${Object.keys(tokenAddresses).length} tokens over ${numDaysAgo} days...`);
  const pricesData = {};
  await Promise.all(
    Object.entries(tokenAddresses).map(async ([tokenName, address]) => {
      try {
        const url = `${process.env.COINGECKO_API_URL}${address}/market_chart`;
        const response = await retry(() => axios.get(url, {
          headers: { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY },
          params: { vs_currency: 'usd', days: numDaysAgo, interval: 'daily' },
          timeout: 10000,
        }));
        if (!Array.isArray(response.data?.prices)) throw new Error('Invalid prices format');
        pricesData[tokenName] = response.data.prices;
      } catch (error) {
        console.error(`Error fetching price data for ${tokenName} after retries:`, error.message);
        pricesData[tokenName] = null;
      }
    })
  );
  const successfulFetches = Object.values(pricesData).filter(data => data !== null).length;
  console.log(`Successfully fetched price data for ${successfulFetches} out of ${Object.keys(tokenAddresses).length} tokens.`);
  return pricesData;
}

/**
 * Fetches historical data from Uniswap Subgraph for each pool in poolAddresses.
 *
 * @param {number} [numDaysAgo=3] - Number of days of historical data to fetch (default: 3).
 * @param {number} [startTimestamp=1620086400] - Unix timestamp to filter data after this date (default: May 4, 2021).
 * @returns {Promise<Object>} A promise that resolves to an object where keys are pool names
 *                            and values are arrays of objects containing pool data (date, feesUSD, volumeUSD).
 *                            If a request fails, the corresponding pool's value is set to null.
 * @throws {Error} If GRAPH_API_URL is not set in the environment variables.
 */
async function fetchUniswapPoolData(numDaysAgo = 3, startTimestamp = 1620086400) {
  if (!process.env.GRAPH_API_URL) {
    throw new Error('GRAPH_API_URL is not set in the environment variables.');
  }

  if (Object.keys(poolAddresses).length === 0) {
    console.warn('No pools to fetch Uniswap data for.');
    return {};
  }

  console.log(`Fetching Uniswap data for ${Object.keys(poolAddresses).length} pools over ${numDaysAgo} days...`);
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
        const response = await retry(() => request(process.env.GRAPH_API_URL, query));
        if (!Array.isArray(response?.poolDayDatas)) throw new Error('Invalid poolDayDatas format');
        poolsData[poolName] = response.poolDayDatas;
      } catch (error) {
        console.error(`Error fetching Uniswap pool data for ${poolName} after retries:`, error.message);
        poolsData[poolName] = null;
      }
    })
  );
  const successfulFetches = Object.values(poolsData).filter(data => data !== null).length;
  console.log(`Successfully fetched Uniswap data for ${successfulFetches} out of ${Object.keys(poolAddresses).length} pools.`);
  return poolsData;
}

export { fetchPoolData, fetchPriceData, fetchUniswapPoolData };
