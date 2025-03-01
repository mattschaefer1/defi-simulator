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
 * Processes raw daily pool data from DeFi Llama.
 * The last array element contains current data as of query time.
 * All other array elements are dated at previous day close.
 * Therefore, the last element of the array is excluded.
 * @param {Array} rawData - Raw data array from the API.
 * @returns {Array} Processed daily APY data.
 */
export function processAPYData(rawData) {
  rawData.pop();
  return rawData.map((day) => ({
    timestamp: convertToISOString(day.timestamp.substring(0, 10)),
    apyPercentage: roundToDecimal(day.apy, 2),
  }));
}

/**
 * Processes raw daily pool data from DeFi Llama.
 * The last array element contains current data as of query time.
 * All other array elements are dated at previous day close.
 * Therefore, the last element of the array is excluded.
 * @param {Array} rawData - Raw data array from the API.
 * @returns {Array} Processed daily TVL data.
 */
export function processTVLData(rawData) {
  rawData.pop();
  return rawData.map((day) => ({
    timestamp: convertToISOString(day.timestamp.substring(0, 10)),
    tvlUsd: roundToDecimal(day.tvlUsd, 6),
  }));
}

/**
 * Processes raw daily token price data from CoinGecko.
 * The last array element contains current data as of query time.
 * All other array elements are dated at previous day open.
 * Therefore, the last element of the array is excluded.
 * @param {Array} rawData - Raw price data array (each item is [timestamp, price]).
 * @returns {Array} Processed token price data.
 */
export function processPriceData(rawData) {
  rawData.pop();
  return rawData.map((day) => ({
    timestamp: convertToISOString(day[0]),
    priceUsd: roundToDecimal(day[1], 6),
  }));
}

/**
 * Processes raw daily pool data from Uniswap Subgraph.
 * @param {Array} rawData - Raw data array from the GraphQL query.
 * @returns {Array} Processed daily pool data arranged from oldest to most recent.
 */
export function processUniswapPoolData(rawData) {
  return rawData.reverse().map((day) => ({
    timestamp: convertToISOString(day.date * 1000),
    feesUSD: roundToDecimal(parseFloat(day.feesUSD), 6),
    volumeUSD: roundToDecimal(parseFloat(day.volumeUSD), 6),
  }));
}
