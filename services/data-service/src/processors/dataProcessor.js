/**
 * Processes raw pool data from DeFi Llama.
 * @param {Array} rawData - Raw data array from the API.
 * @returns {Array} Processed APY data.
 */
export function processAPYData(rawData) {
  return rawData.map((day) => ({
    timestamp: new Date(day.timestamp.substring(0, 10)).toISOString(),  // Convert to 12AM UTC
    apy: day.apy,
  }));
}

/**
 * Processes raw pool data from DeFi Llama.
 * @param {Array} rawData - Raw data array from the API.
 * @returns {Array} Processed TVL data.
 */
export function processTVLData(rawData) {
  return rawData.map((day) => ({
    timestamp: new Date(day.timestamp.substring(0, 11)).toISOString(),  // Convert to 12AM UTC
    tvlUsd: day.tvlUsd,
  }));
}

/**
 * Processes raw token price data from CoinGecko.
 * @param {Array} rawData - Raw price data array (each item is [timestamp, price]).
 * @returns {Array} Processed token price data.
 */
export function processPriceData(rawData) {
  return rawData.map((day) => ({
    timestamp: new Date(day[0]).toISOString(),
    price: day[1],
  }));
}

/**
 * Processes raw pool day data from Uniswap Subgraph.
 * @param {Array} rawData - Raw data array from the GraphQL query.
 * @returns {Array} Processed pool day data.
 */
export function processUniswapPoolData(rawData) {
  return rawData.map((day) => ({
    timestamp: new Date(day.date * 1000).toISOString(),
    feesUSD: day.feesUSD,
    volumeUSD: day.volumeUSD,
  }));
}
