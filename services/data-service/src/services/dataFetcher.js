import axios from 'axios';
import { request, gql } from 'graphql-request';
import { poolIds, tokenAddresses, poolAddresses } from '../config/pools.js';

// Fetches APY & TVL data for each pool from DeFi Llama
async function fetchAPYTVLData() {
  const poolsData = {};
  // Iterate over poolIds entries
  await Promise.all(
    Object.entries(poolIds).map(async ([poolName, id]) => {
      try {
        const poolData = [];
        const url = process.env.DEFILLAMA_API_URL + id;
        const response = await axios.get(url);
        const dailyPoolData = response.data.data;

        // For each day, extract relevant fields and add to poolData
        dailyPoolData.forEach((day) => {
          if (poolName === 'lidoEth') {
            poolData.push({
              timestamp: day.timestamp,
              apy: day.apy,
            });
          } else {
            poolData.push({
              timestamp: day.timestamp,
              tvlUsd: day.tvlUsd,
            });
          }          
        });

        poolsData[poolName] = poolData;
      } catch (error) {
        console.error(`Error fetching APY and TVL data for ${poolName}:`, error.message);
      }
    })
  );

  console.log('APY data fetched:', poolsData);
  // TODO: Parse data to format acceptable for saving to DB
}

// Fetches price data for each token from CoinGecko
async function fetchPriceData(numDaysAgo = '1') {
  const pricesData = {};
  // Iterate over tokenAddresses entries
  await Promise.all(
    Object.entries(tokenAddresses).map(async ([tokenName, address]) => {
      try {
        const priceData = [];
        const url = process.env.COINGECKO_API_URL + address + '/market_chart';
        const response = await axios.get(url, {
          headers: { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY },
          params: {
            vs_currency: 'usd',
            days: numDaysAgo,
            interval: 'daily',
            precision: '6',
          }
        });
        const dailyPriceData = response.data.prices;

        // For each day, extract relevant fields and add to priceData
        dailyPriceData.forEach((day) => {
          priceData.push({
            timestamp: day[0],
            price: day[1],
          });
        });

        pricesData[tokenName] = priceData;
      } catch (error) {
        console.error(`Error fetching price data for ${tokenName}:`, error.message);
      }
    })
  );

  console.log('Price data fetched:', pricesData);
  // TODO: Parse data to format acceptable for saving to DB
}

// Fetches volume & fee data for each pool from Uniswap Subgraph
async function fetchPoolData(numDaysAgo = 1) {
  const poolsData = {};
  // Iterate over poolAddresses entries
  await Promise.all(
    Object.entries(poolAddresses).map(async ([poolName, address]) => {
      try {
        const poolData = [];
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
        const dailyPoolData = response.poolDayDatas;

        // For each day, extract relevant fields and add to poolData
        dailyPoolData.forEach((day) => {
          poolData.push({
            timestamp: day.date,
            feesUSD: day.feesUSD,
            volumeUSD: day.volumeUSD,
          });
        });

        poolsData[poolName] = poolData;
      } catch (error) {
        console.error(`Error fetching pool data for ${poolName}:`, error.message);
      }
    })
  );

  console.log('Pool data fetched:', poolsData);
  // TODO: Parse data to format acceptable for saving to DB
}

export { fetchAPYTVLData, fetchPriceData, fetchPoolData };
