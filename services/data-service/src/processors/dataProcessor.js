/**
 * Converts date to ISO string.
 * @param {string|number} date - Date from API response.
 * @returns {string} ISO date string. 
 */
export function convertToISOString(date) {
  return new Date(date).toISOString();
}

/**
 * Rounds a number to specified number of decimal places.
 * @param {number} num - Number to round.
 * @param {number} numOfPlaces - Number of decimal places.
 * @returns {number} Rounded number. 
 */
export function roundToDecimal(num, numOfPlaces) {
  return parseFloat(num.toFixed(numOfPlaces));
}

/**
 * Processes raw pool data from DeFi Llama.
 * @param {Array} rawData - Raw data array from the API.
 * @returns {Array} Processed APY data.
 */
export function processAPYData(rawData) {
  return rawData.map((day) => ({
    timestamp: convertToISOString(day.timestamp.substring(0, 10)),
    apyPercentage: roundToDecimal(day.apy, 2),
  }));
}

/**
 * Processes raw pool data from DeFi Llama.
 * @param {Array} rawData - Raw data array from the API.
 * @returns {Array} Processed TVL data.
 */
export function processTVLData(rawData) {
  return rawData.map((day) => ({
    timestamp: convertToISOString(day.timestamp.substring(0, 10)),
    tvlUsd: roundToDecimal(day.tvlUsd, 6),
  }));
}

/**
 * Processes raw token price data from CoinGecko.
 * @param {Array} rawData - Raw price data array (each item is [timestamp, price]).
 * @returns {Array} Processed token price data.
 */
export function processPriceData(rawData) {
  return rawData.map((day) => ({
    timestamp: convertToISOString(day[0]),
    priceUsd: roundToDecimal(day[1], 6),
  }));
}

/**
 * Processes raw pool day data from Uniswap Subgraph.
 * @param {Array} rawData - Raw data array from the GraphQL query.
 * @returns {Array} Processed pool day data.
 */
export function processUniswapPoolData(rawData) {
  return rawData.map((day) => ({
    timestamp: convertToISOString(day.date * 1000),
    feesUSD: roundToDecimal(parseFloat(day.feesUSD), 6),
    volumeUSD: roundToDecimal(parseFloat(day.volumeUSD), 6),
  }));
}
