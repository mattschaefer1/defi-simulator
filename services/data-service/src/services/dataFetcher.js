import axios from 'axios';
import { request, gql } from 'graphql-request';
import { poolIds, tokenAddresses, poolAddresses } from '../config/pools.js';

/** Fetches data from DeFi Llama for each pool in poolIds. */
async function fetchPoolData() {
  const poolsData = {};
  await Promise.all(
    Object.entries(poolIds).map(async ([poolName, id]) => {
      try {
        const url = process.env.DEFILLAMA_API_URL + id;
        const response = await axios.get(url);
        poolsData[poolName] = response.data.data;
      } catch (error) {
        console.error(`Error fetching APY and TVL data for ${poolName}:`, error.message);
      }
    })
  );
  return poolsData;
}

/** Fetches price data from CoinGecko for each token in tokenAddresses.
 *  @param {string} [numDaysAgo='1'] - Data up to number of days ago.
 */
async function fetchPriceData(numDaysAgo = '1') {
  const pricesData = {};
  await Promise.all(
    Object.entries(tokenAddresses).map(async ([tokenName, address]) => {
      try {
        const url = process.env.COINGECKO_API_URL + address + '/market_chart';
        const response = await axios.get(url, {
          headers: { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY },
          params: { vs_currency: 'usd', days: numDaysAgo, interval: 'daily' }
        });
        pricesData[tokenName] = response.data.prices;
      } catch (error) {
        console.error(`Error fetching price data for ${tokenName}:`, error.message);
      }
    })
  );
  return pricesData;
}

/** Fetches data from Uniswap Subgraph for each pool in poolAddresses.
 *  @param {number} [numDaysAgo=1] - Data up to number of days ago.
 */
async function fetchUniswapPoolData(numDaysAgo = 1) {
  const poolsData = {};
  await Promise.all(
    Object.entries(poolAddresses).map(async ([poolName, address]) => {
      try {
        const query = gql`
          {
            poolDayDatas(
              first: ${numDaysAgo}
              orderBy: date
              where: {pool: "${address}", date_gt: 1620086400}
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
      }
    })
  );
  return poolsData;
}

export { fetchPoolData, fetchPriceData, fetchUniswapPoolData };
