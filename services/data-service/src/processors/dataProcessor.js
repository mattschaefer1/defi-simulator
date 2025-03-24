/**
 * Converts date to ISO string.
 * @param {string|number} date - Date from API response.
 * @returns {string|null} ISO date string, or null if the input is invalid.
 */
function convertToISOString(date) {
  const parsedDate = new Date(date);
  return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
}

/**
 * Rounds a number to specified number of decimal places.
 * @param {number} num - Number to round.
 * @param {number} numOfPlaces - Number of decimal places.
 * @returns {number} Rounded number, or NaN if inputs are invalid.
 */
function roundToDecimal(num, numOfPlaces) {
  if (typeof num !== 'number' || !Number.isInteger(numOfPlaces) || numOfPlaces < 0) {
    return NaN;
  }
  const factor = Math.pow(10, numOfPlaces);
  return Math.round(num * factor) / factor;
}

/**
 * Formats raw daily pool data from DeFi Llama.
 * Excludes the last element, which contains current data as of query time.
 * @param {Array} rawData - Raw data array from the API.
 * @returns {Array} Processed daily APY data.
 */
function formatApyData(rawData) {
  const dataToProcess = rawData.slice(0, -1);
  return dataToProcess.map((day) => ({
    timestamp: convertToISOString(day.timestamp.substring(0, 10)),
    apyPercentage: roundToDecimal(day.apy, 2),
  }));
}

/**
 * Formats raw daily pool data from DeFi Llama.
 * Excludes the last element, which contains current data as of query time.
 * @param {Array} rawData - Raw data array from the API.
 * @returns {Array} Processed daily TVL data.
 */
function formatTvlData(rawData) {
  const dataToProcess = rawData.slice(0, -1);
  return dataToProcess.map((day) => ({
    timestamp: convertToISOString(day.timestamp.substring(0, 10)),
    tvlUsd: roundToDecimal(day.tvlUsd, 6),
  }));
}

/**
 * Formats raw daily token price data from CoinGecko.
 * Excludes the last element, which contains current data as of query time.
 * @param {Array} rawData - Raw price data array (each item is [timestamp, price]).
 * @returns {Array} Processed token price data.
 */
function formatPriceData(rawData) {
  const dataToProcess = rawData.slice(0, -1);
  return dataToProcess.map((day) => ({
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
  const reversedData = [...rawData].reverse();
  return reversedData.map((day) => ({
    timestamp: convertToISOString(day.date * 1000),
    feesUSD: roundToDecimal(parseFloat(day.feesUSD), 6),
    volumeUSD: roundToDecimal(parseFloat(day.volumeUSD), 6),
  }));
}

/** Iterates through each pool's data and formats it.
 *  @param {Object} apyTvlData - Object containing data for each pool.
 *  @returns {Array} First element is array of APY data, second is object of TVL data for each pool.
 */
export function processPoolDataResponse(apyTvlData) {
  let processedApyData = [];
  const processedTvlData = {};

  Object.entries(apyTvlData).forEach(([poolName, data]) => {
    if (poolName === 'lidoEth') {
      processedApyData = formatApyData(data);
    } else {
      processedTvlData[poolName] = formatTvlData(data);
    }
  });

  return [processedApyData, processedTvlData];
}

/** Iterates through each token's data and formats it.
 *  @param {Object} priceData - Object containing price data for each token.
 *  @returns {Object} Formatted token price data.
 */
export function processPriceDataResponse(priceData) {
  return Object.fromEntries(
    Object.entries(priceData).map(([tokenName, data]) => [tokenName, formatPriceData(data)])
  );
}

/** Iterates through each Uniswap pool's data and formats it.
 *  @param {Object} uniswapPoolsData - Object containing data for each pool.
 *  @returns {Object} Formatted Uniswap pool data.
 */
export function processUniswapPoolDataResponse(uniswapPoolsData) {
  return Object.fromEntries(
    Object.entries(uniswapPoolsData).map(([poolName, data]) => [poolName, formatUniswapPoolData(data)])
  );
}

/**
 * Trims data to specified maxLength.
 * @param {Object} data - Response data object.
 * @param {number} maxLength - Number of days worth of data (i.e., 356 days).
 * @returns {Object} Data trimmed to maxLength, or unchanged if less than maxLength.
 */
export function trimData(data, maxLength = 365) {
  const trimmedData = {};
  Object.entries(data).forEach(([key, value]) => {
    const valLength = value.length;
    if (valLength > maxLength) {
      trimmedData[key] = value.slice(valLength - maxLength - 1);
    }
  });
  return Object.keys(trimmedData).length > 0 ? trimmedData : data;
}
