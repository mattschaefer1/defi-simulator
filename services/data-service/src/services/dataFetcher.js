import axios from 'axios';
import { request, gql } from 'graphql-request';
import { poolIds, tokenAddresses, poolAddresses } from '../config/pools.js';
import { processAPYData, processTVLData, processPriceData, processUniswapPoolData } from '../processors/dataProcessor.js';

/** Fetches and processes data from DeFi Llama for each pool in poolIds. */
async function fetchPoolData() {
  const poolsData = {};

  await Promise.all(
    Object.entries(poolIds).map(async ([poolName, id]) => {
      try {
        const url = process.env.DEFILLAMA_API_URL + id;
        const response = await axios.get(url);
        const processedData = (poolName === 'lidoEth')
          ? processAPYData(response.data.data)
          : processTVLData(response.data.data);
        poolsData[poolName] = processedData;
      } catch (error) {
        console.error(`Error fetching APY and TVL data for ${poolName}:`, error.message);
      }
    })
  );

  console.log('APY data fetched:', poolsData);
}

/** Fetches and processes price data from CoinGecko for each token in tokenAddresses.
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
          params: { vs_currency: 'usd', days: numDaysAgo, interval: 'daily', precision: '6' }
        });
        const processedData = processPriceData(response.data.prices);
        pricesData[tokenName] = processedData;
      } catch (error) {
        console.error(`Error fetching price data for ${tokenName}:`, error.message);
      }
    })
  );

  console.log('Price data fetched:', pricesData);
}

/** Fetches and processes data from Uniswap Subgraph for each pool in poolAddresses.
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
        const processedData = processUniswapPoolData(response.poolDayDatas);
        poolsData[poolName] = processedData;
      } catch (error) {
        console.error(`Error fetching pool data for ${poolName}:`, error.message);
      }
    })
  );

  console.log('Pool data fetched:', poolsData);
}

export { fetchPoolData, fetchPriceData, fetchUniswapPoolData };
