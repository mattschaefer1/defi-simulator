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
 * @param {Array} rawData - Raw data array from the API.
 * @returns {Array} Processed daily APY data.
 */
function formatApyData(rawData) {
  const dataToProcess = [...rawData];
  return dataToProcess.map((day) => ({
    timestamp: convertToISOString(day.timestamp.substring(0, 10)),
    apyPercentage: roundToDecimal(day.apy, 2),
  }));
}

/**
 * Formats raw daily pool data from DeFi Llama.
 * @param {Array} rawData - Raw data array from the API.
 * @returns {Array} Processed daily TVL data.
 */
function formatTvlData(rawData) {
  const dataToProcess = [...rawData];
  return dataToProcess.map((day) => ({
    timestamp: convertToISOString(day.timestamp.substring(0, 10)),
    tvlUsd: roundToDecimal(day.tvlUsd, 6),
  }));
}

/**
 * Formats raw daily token price data from CoinGecko.
 * @param {Array} rawData - Raw price data array (each item is [timestamp, price]).
 * @returns {Array} Processed token price data.
 */
function formatPriceData(rawData) {
  const dataToProcess = [...rawData];
  return dataToProcess.map((day) => ({
    timestamp: convertToISOString(day[0]).slice(0, 10) + "T00:00:00.000Z",
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
  let processedApyData = {};
  const processedTvlData = {};

  Object.entries(apyTvlData).forEach(([poolName, data]) => {
    if (poolName === 'lidoEth') {
      processedApyData[poolName] = formatApyData(data);
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
 * Removes duplicate timestamps from each array within the given data object.
 *
 * This function processes an object where each key maps to an array of objects. Each object is expected
 * to have a `timestamp` property (a value parseable by the Date constructor). For each array, the function:
 * - Iterates over the array and records the last occurrence of each unique timestamp.
 * - Filters the array to keep only the last occurrence of each duplicate timestamp.
 * - Sorts the filtered array in ascending order based on the timestamp.
 *
 * @param {Object<string, Array<Object>>} data - An object whose properties are arrays of objects with a 
 *                                               `timestamp` property.
 * @returns {Object<string, Array<Object>>} A new object with the same keys as the input. Each array contains 
 *                                          only the last occurrence of objects with duplicate timestamps, 
 *                                          sorted by timestamp in ascending order.
 */
export function removeDuplicateTimestamps(data) {
  const result = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const array = data[key];
      const lastOccurrences = new Map();
      for (const element of array) {
        const timestamp = element.timestamp;
        lastOccurrences.set(timestamp, element);
      }
      const filteredArray = array.filter(
        element => element === lastOccurrences.get(element.timestamp)
      );
      result[key] = filteredArray.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
  }
  return result;
}

/**
 * Trims data to specified maxLength.
 * @param {Object} data - Response data object.
 * @param {number} maxLength - Number of days worth of data (i.e., 365 days).
 * @returns {Object} Data trimmed to maxLength, or unchanged if all keys are within limit.
 */
export function trimData(data, maxLength = 365) {
  const trimmedData = {};
  Object.entries(data).forEach(([key, value]) => {
    trimmedData[key] = value.length > maxLength ? value.slice(-maxLength) : value;
  });
  return trimmedData;
}

/**
 * Identifies missing dates in response data.
 * @param {Object} data - Response data object.
 * @returns {Object} Missing dates for each key in response data.
 */
export function findMissingDates(data) {
  const missingDatesByKey = {};
  for (const key in data) {
    const records = data[key];
    const dates = records
      .map(r => {
        const d = new Date(r.timestamp);
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      })
      .sort((a, b) => a - b);

    const missingDates = [];
    for (let i = 0; i < dates.length - 1; i++) {
      let expectedDate = new Date(dates[i].getTime());
      expectedDate.setUTCDate(expectedDate.getUTCDate() + 1);
      while (expectedDate < dates[i + 1]) {
        missingDates.push(expectedDate.toISOString());
        expectedDate.setUTCDate(expectedDate.getUTCDate() + 1);
      }
    }
    if (missingDates.length > 0) {
      missingDatesByKey[key] = missingDates;
    }
  }
  return missingDatesByKey;
}

/**
 * Calculates a date that is a specified number of days before the given date.
 * @param {Date} date - The starting date from which to subtract days.
 * @param {number} numDays - The number of days to subtract from the starting date.
 * @returns {string} The ISO string representation of the resulting date (e.g., "2023-10-25T00:00:00.000Z").
 */
function findDateBefore(date, numDays) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - numDays
    )
  ).toISOString();
}

/**
 * Calculates a date that is a specified number of days after the given date.
 * @param {Date} date - The starting date from which to add days.
 * @param {number} numDays - The number of days to add to the starting date.
 * @returns {string} The ISO string representation of the resulting date (e.g., "2023-10-25T00:00:00.000Z").
 */
function findDateAfter(date, numDays) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + numDays
    )
  ).toISOString();
}

/**
 * Finds up to two valid dates before and after a missing date within a specified maximum number of days.
 *
 * This function searches for dates in the provided timestamps array that occur before and after
 * the missing date, stopping when it finds up to two of each or reaches the maxDays limit.
 *
 * @param {Date} missingDate - The date for which to find surrounding valid dates.
 * @param {string[]} timestamps - An array of existing timestamp strings in ISO format to search within.
 * @param {number} [maxDays=7] - The maximum number of days to look before and after the missing date (optional, defaults to 7).
 * @returns {[string[], string[]]} An array containing two arrays: the first with up to two ISO timestamp strings
 *                                 before the missing date, and the second with up to two after it.
 */
function findValidDates(missingDate, timestamps, maxDays = 7) {
  const beforeDates = [];
  const afterDates = [];
  for (let i = 1; i <= maxDays && (beforeDates.length < 2 || afterDates.length < 2); i++) {
    if (beforeDates.length < 2) {
      const beforeDay = findDateBefore(missingDate, i);
      if (timestamps.includes(beforeDay)) beforeDates.push(beforeDay);
    }
    if (afterDates.length < 2) {
      const afterDay = findDateAfter(missingDate, i);
      if (timestamps.includes(afterDay)) afterDates.push(afterDay);
    }
  }
  return [beforeDates.slice(0, 2), afterDates.slice(0, 2)];
}

/**
 * Retrieves metrics from records corresponding to the provided valid dates.
 *
 * This function aggregates metric values (excluding the 'timestamp' key) from records
 * mapped to the given timestamps, organizing them by metric name.
 *
 * @param {string[]} validDates - An array of timestamp strings in ISO format to look up in the recordMap.
 * @param {Map<string, Object>} recordMap - A Map where keys are ISO timestamp strings and values are
 *                                          record objects containing metric key-value pairs.
 * @returns {Object} An object where each key is a metric name and each value is an array of
 *                   corresponding metric values from the records.
 */
function getMetrics(validDates, recordMap) {
  const metrics = {};
  validDates.forEach((timestamp) => {
    const record = recordMap.get(timestamp);
    if (record) {
      Object.entries(record).forEach(([key, value]) => {
        if (key !== 'timestamp') {
          if (!metrics[key]) metrics[key] = [];
          metrics[key].push(value);
        }
      });
    }
  });
  return metrics;
}

/**
 * Simulates metrics for a missing date based on metrics from before and after dates.
 *
 * For each metric present in either metricsBefore or metricsAfter:
 * - If both have values, it calculates a random value between their averages.
 * - If only one has values, it uses that average.
 * - If neither has values, it defaults to 0.
 *
 * @param {Object} metricsBefore - An object where keys are metric names and values are arrays of
 *                                 metric values from dates before the missing date.
 * @param {Object} metricsAfter - An object where keys are metric names and values are arrays of
 *                                metric values from dates after the missing date.
 * @returns {Object} An object where each key is a metric name and each value is a simulated
 *                   integer metric value.
 */
function simulateMetrics(metricsBefore, metricsAfter) {
  const simulatedMetrics = {};
  const allMetrics = new Set([...Object.keys(metricsBefore), ...Object.keys(metricsAfter)]);
  
  for (const metric of allMetrics) {
    const beforeValues = metricsBefore[metric] || [];
    const afterValues = metricsAfter[metric] || [];
    let simulatedValue;

    if (beforeValues.length > 0 && afterValues.length > 0) {
      const avgBefore = beforeValues.reduce((a, b) => a + b, 0) / beforeValues.length;
      const avgAfter = afterValues.reduce((a, b) => a + b, 0) / afterValues.length;
      const min = Math.min(avgBefore, avgAfter);
      const max = Math.max(avgBefore, avgAfter);
      simulatedValue = Math.floor(Math.random() * (max - min) + min);
    } else if (beforeValues.length > 0) {
      simulatedValue = Math.floor(beforeValues.reduce((a, b) => a + b, 0) / beforeValues.length);
    } else if (afterValues.length > 0) {
      simulatedValue = Math.floor(afterValues.reduce((a, b) => a + b, 0) / afterValues.length);
    } else {
      simulatedValue = 0;
    }
    simulatedMetrics[metric] = simulatedValue;
  }
  return simulatedMetrics;
}

/**
 * Returns a new object based on the provided data, with additional records for the specified missing dates.
 *
 * This function processes each key in missingDates, adding new records with simulated metrics for each
 * missing date. Metrics are simulated using nearby dates' data if available; otherwise, they default to 0.
 * The resulting records are sorted by timestamp.
 *
 * @param {Object} data - The original data, structured as { key: [{ timestamp, ...metrics }, ...] },
 *                        where each record has a 'timestamp' string and metric properties.
 * @param {Object} missingDates - An object structured as { key: [dateString, ...] }, where each key
 *                                corresponds to a key in data, and dateString values are ISO date strings.
 * @returns {Object} A new object with the same keys as those processed from missingDates, containing
 *                   the original records plus new records for the missing dates with simulated metrics.
 *                   If no missing dates are processed, returns the original data.
 */
export function fillMissingDates(data, missingDates) {
  const filledData = {};
  Object.entries(missingDates).forEach(([key, dates]) => {
    const records = [...data[key]];
    const newRecords = [];
    const recordMap = new Map(records.map(r => [r.timestamp, r]));
    const timestamps = records.map(r => r.timestamp);

    for (const date of dates) {
      const missingDate = new Date(date);
      const [validDatesBefore, validDatesAfter] = findValidDates(missingDate, timestamps);
      if (validDatesBefore.length > 0 || validDatesAfter.length > 0) {
        const metricsBefore = getMetrics(validDatesBefore, recordMap);
        const metricsAfter = getMetrics(validDatesAfter, recordMap);
        const simulatedMetrics = simulateMetrics(metricsBefore, metricsAfter);
        newRecords.push({ timestamp: missingDate.toISOString(), ...simulatedMetrics });
      } else {
        console.warn(`No valid dates found for ${date} in ${key}`);
        if (records.length === 0) {
          console.error(`No data available for ${key}. Skipping.`);
          continue;
        }
        const sampleRecord = records[0];
        const simulatedMetrics = {};
        Object.keys(sampleRecord).forEach(k => {
          if (k !== 'timestamp') simulatedMetrics[k] = 0;
        });
        newRecords.push({ timestamp: missingDate.toISOString(), ...simulatedMetrics });
      }
    }

    filledData[key] = [...records, ...newRecords].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });
  return Object.keys(filledData).length > 0 ? filledData : data;
}
