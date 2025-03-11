/**
 * Converts date to ISO string.
 * @param {string|number} date - Date from API response.
 * @returns {string} ISO date string. 
 */
function convertToISOString(date) {
  return new Date(date).toISOString();
}

/**
 * Rounds a number to specified number of decimal places.
 * @param {number} num - Number to round.
 * @param {number} numOfPlaces - Number of decimal places.
 * @returns {number} Rounded number. 
 */
function roundToDecimal(num, numOfPlaces) {
  return parseFloat(num.toFixed(numOfPlaces));
}

/**
 * Formats raw daily pool data from DeFi Llama.
 * The last array element contains current data as of query time.
 * All other array elements are dated at previous day close.
 * Therefore, the last element of the array is excluded.
 * @param {Array} rawData - Raw data array from the API.
 * @returns {Array} Processed daily APY data.
 */
function formatApyData(rawData) {
  rawData.pop();
  return rawData.map((day) => ({
    timestamp: convertToISOString(day.timestamp.substring(0, 10)),
    apyPercentage: roundToDecimal(day.apy, 2),
  }));
}

/**
 * Formats raw daily pool data from DeFi Llama.
 * The last array element contains current data as of query time.
 * All other array elements are dated at previous day close.
 * Therefore, the last element of the array is excluded.
 * @param {Array} rawData - Raw data array from the API.
 * @returns {Array} Processed daily TVL data.
 */
function formatTvlData(rawData) {
  rawData.pop();
  return rawData.map((day) => ({
    timestamp: convertToISOString(day.timestamp.substring(0, 10)),
    tvlUsd: roundToDecimal(day.tvlUsd, 6),
  }));
}

/**
 * Formats raw daily token price data from CoinGecko.
 * The last array element contains current data as of query time.
 * All other array elements are dated at previous day open.
 * Therefore, the last element of the array is excluded.
 * @param {Array} rawData - Raw price data array (each item is [timestamp, price]).
 * @returns {Array} Processed token price data.
 */
function formatPriceData(rawData) {
  rawData.pop();
  return rawData.map((day) => ({
    timestamp: convertToISOString(day[0]),
    priceUsd: roundToDecimal(day[1], 6),
  }));
}

/**
 * Formats raw daily pool data from Uniswap Subgraph.
 * @param {Array} rawData - Raw data array from the GraphQL query.
 * @returns {Array} Processed daily pool data arranged from oldest to most recent.
 */
function formatUniswapPoolData(rawData) {
  return rawData.reverse().map((day) => ({
    timestamp: convertToISOString(day.date * 1000),
    feesUSD: roundToDecimal(parseFloat(day.feesUSD), 6),
    volumeUSD: roundToDecimal(parseFloat(day.volumeUSD), 6),
  }));
}

/** Iterates through each pool's data and formats it.
 *  @param {Object} apyTvlData - Object containing data for each pool.
 *  @returns {Array} First element is APY data, while second is TVL data.
 */
export function processPoolDataResponse(apyTvlData) {
  let processedApyData = [];
  const processedTvlData = {};
  Object.entries(apyTvlData).map(([poolName, data]) => {
    if (poolName === 'lidoEth') {
      processedApyData = formatApyData(data);
    } else {
      processedTvlData[poolName] = formatTvlData(data);
    }
  })
  return [processedApyData, processedTvlData];
}

/** Iterates through each token's data and formats it.
 *  @param {Object} priceData - Object containing price data for each token.
 *  @returns {Object} Formatted token price data.
 */
export function processPriceDataResponse(priceData) {
  const processedPriceData = {};
  Object.entries(priceData).map(([tokenName, data]) => {
    processedPriceData[tokenName] = formatPriceData(data);
  })
  return processedPriceData;
}

/** Iterates through each Uniswap pool's data and formats it.
 *  @param {Object} priceData - Object containing data for each pool.
 *  @returns {Object} Formatted Uniswap pool data.
 */
export function processUniswapPoolDataResponse(uniswapPoolsData) {
  const processedUniswapPoolsData = {};
  Object.entries(uniswapPoolsData).map(([poolName, data]) => {
    processedUniswapPoolsData[poolName] = formatUniswapPoolData(data);
  })
  return processedUniswapPoolsData;
}
