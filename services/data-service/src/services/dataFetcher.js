import axios from 'axios';
import { request, gql } from 'graphql-request';

//  Fetches APY & TVL data for each pool from DeFi Llama
async function fetchAPYTVLData() {
  const poolsData = {};
  const poolIds = [
    { lidoEth: '747c1d2a-c668-4682-b9f9-296708a3dd90' },
    { wethUsdc: '665dc8bc-c79d-4800-97f7-304bf368e547' },
    { wbtcUsdc: 'bbecbf69-a4f7-43e3-8b72-de180d106e2c' },
    { wbtcWeth: 'd59a5728-d391-4989-86f6-a94e11e0eb3b' },
    { daiUsdc: '1193ef25-862b-43c1-a545-91bbb9678d30' }
  ];

  // Send request for historical data on each pool
  await Promise.all(poolIds.map(async (pool) => {
    try {
      const poolData = [];
      const url = process.env.DEFILLAMA_API_URL + Object.values(pool)[0];
      const response = await axios.get(url);
      const dailyPoolData = response.data.data;

      // For each day, extract relevant fields and add to poolData
      dailyPoolData.forEach((day) => {
        poolData.push({
          timestamp: day.timestamp,
          apy: day.apy,
          tvlUsd: day.tvlUsd
        });
      });

      // Add poolData to poolsData for futher analysis
      poolsData[Object.keys(pool)[0]] = poolData;
    } catch (error) {
      console.error('Error fetching APY and TVL data:', error.message);
    }
  }));

  console.log('APY data fetched:', poolsData);
  // TODO: Parse data to format acceptible for saving to DB
}

// Fetches price data for each token from CoinGecko
async function fetchPriceData() {
  const pricesData = [];
  const tokenAddresses = [
    { weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
    { wbtc: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
    { dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
    { usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' }
  ];

  // Send request for historical price data on each token
  await Promise.all(tokenAddresses.map(async (token) => {
    try {
      const priceData = [];
      const url = process.env.COINGECKO_API_URL + Object.values(token)[0] + '/market_chart';
      const response = await axios.get(url, {
        headers: { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY },
        params: { vs_currency: 'usd', days: '365' }
      });
      const dailyPriceData = response.data.prices;

      // For each day, extract relevant fields and add to priceData
      dailyPriceData.forEach((day) => {
        priceData.push({
          timestamp: day[0],
          price: day[1]
        });
      });

      // Add priceData to pricesData for futher analysis
      pricesData[Object.keys(token)[0]] = priceData;
    } catch (error) {
      console.error('Error fetching price data:', error.message);
    }
  }));

  console.log('Price data fetched:', pricesData);
  // TODO: Parse data to format acceptible for saving to DB
}

// Fetches volume & fee data for each pool from Uniswap Subgraph
async function fetchPoolData() {
  const poolsData = [];
  const poolAddresses = [
    { wethUsdc: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' },
    { wbtcUsdc: '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35' },
    { wbtcWeth: '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed' },
    { daiUsdc: '0x5777d92f208679db4b9778590fa3cab3ac9e2168' }
  ];

  // Send request for historical data on each pool
  await Promise.all(poolAddresses.map(async (pool) => {
    try {
      const poolData = [];
      const query = gql`
        {
          poolDayDatas(
            first: 365
            orderBy: date
            where: {pool: "${Object.values(pool)[0]}", date_gt: 1706745600}
            orderDirection: desc
          ) {
            date
            feesUSD
            volumeUSD
          }
        }
      `
      const response = await request(process.env.GRAPH_API_URL, query);
      const dailyPoolData = response.poolDayDatas;

      // For each day, extract relevant fields and add to poolData
      dailyPoolData.forEach((day) => {
        poolData.push({
          timestamp: day.date,
          feesUSD: day.feesUSD,
          volumeUSD: day.volumeUSD
        });
      });

      // Add poolData to poolsData for futher analysis
      poolsData[Object.keys(pool)[0]] = poolData;
    } catch (error) {
      console.error('Error fetching APY and TVL data:', error.message);
    }
  }));

  console.log('Pool data fetched:', poolsData);
  // TODO: Parse data to format acceptible for saving to DB
}

export { fetchAPYTVLData, fetchPriceData, fetchPoolData };
