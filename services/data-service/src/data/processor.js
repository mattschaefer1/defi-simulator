import { poolAddresses } from '../config/pools.js';

/**
 * Converts a date string or timestamp to an ISO string.
 * @param {string|number} date - Date string (e.g., '2023-01-01') or
 *                               Unix timestamp (in milliseconds).
 * @returns {string|null} ISO date string (UTC), or null if the input is invalid.
 */
export function convertToISOString(date) {
  if (typeof date !== 'string' && typeof date !== 'number') {
    console.warn(`Invalid date input type: ${typeof date}, value: ${date}`);
    return null;
  }
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
}

/**
 * Rounds a number to a specified number of decimal places.
 * @param {number} num - Number to round.
 * @param {number} numOfPlaces - Number of decimal places (non-negative integer).
 * @returns {number|null} Rounded number, or null if inputs are invalid.
 */
export function roundToDecimal(num, numOfPlaces) {
  if (
    typeof num !== 'number' ||
    !Number.isInteger(numOfPlaces) ||
    numOfPlaces < 0 ||
    Number.isNaN(num) ||
    !Number.isFinite(num)
  ) {
    console.warn(
      `Invalid inputs for rounding: num=${num}, numOfPlaces=${numOfPlaces}`,
    );
    return null;
  }
  const factor = 10 ** numOfPlaces;
  return Math.round(num * factor) / factor;
}

/**
 * Formats raw daily pool data from DeFi Llama.
 * @param {Array<Object>} rawData - Raw data array with objects containing 'timestamp' (string)
 *                                  and either 'apy' or 'tvlUsd' (number).
 * @param {Object} options - Configuration options for formatting
 * @param {string} options.valueField - The field name to extract from the data ('apy' or 'tvlUsd')
 * @param {string} options.outputField - The field name to use in the output
 *                                      ('apyPercentage' or 'tvlUsd')
 * @param {number} options.decimalPlaces - Number of decimal places to round to
 * @returns {Array<Object>} Processed daily data with 'timestamp' (ISO string) and the
 *                          specified output field or an empty array if the input is invalid.
 */
export function formatPoolData(rawData, options) {
  if (!options || typeof options !== 'object') {
    console.warn('options parameter is missing or not an object');
    return [];
  }

  const { valueField, outputField, decimalPlaces } = options;

  if (!valueField || typeof valueField !== 'string') {
    console.warn('options.valueField is missing or not a string');
    return [];
  }

  if (!outputField || typeof outputField !== 'string') {
    console.warn('options.outputField is missing or not a string');
    return [];
  }

  if (
    !decimalPlaces ||
    typeof decimalPlaces !== 'number' ||
    !Number.isInteger(decimalPlaces) ||
    decimalPlaces < 0
  ) {
    console.warn(
      'options.decimalPlaces is missing, not an integer, or negative',
    );
    return [];
  }

  if (!Array.isArray(rawData)) {
    console.warn('rawData is not an array');
    return [];
  }

  return rawData
    .filter(
      (day) =>
        day &&
        typeof day.timestamp === 'string' &&
        typeof day[valueField] === 'number',
    )
    .map((day) => {
      const timestamp = convertToISOString(day.timestamp.substring(0, 10));
      const value = roundToDecimal(day[valueField], decimalPlaces);
      if (timestamp === null || value === null) {
        console.warn(`Invalid ${valueField} data: ${JSON.stringify(day)}`);
        return null;
      }
      return { timestamp, [outputField]: value };
    })
    .filter((item) => item !== null);
}

/**
 * Formats raw daily token price data from CoinGecko.
 * @param {Array<Array<number>>} rawData - Raw price data array, each item is
 *                                         [timestamp (number), price (number)].
 * @returns {Array<Object>} Processed token price data with 'timestamp' (ISO string) and 'priceUsd'
 *                          or an empty array if the input is invalid.
 */
export function formatPriceData(rawData) {
  if (!Array.isArray(rawData)) {
    console.warn('rawData is not an array');
    return [];
  }
  return rawData
    .filter(
      (day) =>
        Array.isArray(day) &&
        day.length === 2 &&
        typeof day[0] === 'number' &&
        typeof day[1] === 'number',
    )
    .map((day) => {
      const timestamp = convertToISOString(day[0]);
      const priceUsd = roundToDecimal(day[1], 6);
      if (timestamp === null || priceUsd === null) {
        console.warn(`Invalid price data: ${JSON.stringify(day)}`);
        return null;
      }
      return { timestamp: `${timestamp.slice(0, 10)}T00:00:00.000Z`, priceUsd };
    })
    .filter((item) => item !== null);
}

/**
 * Formats raw daily pool data from Uniswap Subgraph.
 * @param {Array<Object>} rawData - Raw data array with objects containing 'date' (number),
 *                                  'feesUSD' (string), 'volumeUSD' (string).
 * @returns {Array<Object>} Processed daily pool data arranged from oldest to most recent with
 *                          'timestamp', 'feesUSD', 'volumeUSD' or an empty array if the input
 *                          is invalid.
 */
export function formatUniswapPoolData(rawData) {
  if (!Array.isArray(rawData)) {
    console.error('rawData is not an array');
    return [];
  }
  const reversedData = [...rawData].reverse();
  return reversedData
    .filter(
      (day) =>
        day &&
        typeof day.date === 'number' &&
        typeof day.feesUSD === 'string' &&
        typeof day.volumeUSD === 'string',
    )
    .map((day) => {
      const timestamp = convertToISOString(day.date * 1000);
      const feesUSD = roundToDecimal(parseFloat(day.feesUSD), 6);
      const volumeUSD = roundToDecimal(parseFloat(day.volumeUSD), 6);
      if (timestamp === null || feesUSD === null || volumeUSD === null) {
        console.warn(`Invalid Uniswap pool data: ${JSON.stringify(day)}`);
        return null;
      }
      return { timestamp, feesUSD, volumeUSD };
    })
    .filter((item) => item !== null);
}

/**
 * Processes APY and TVL data for each pool.
 * @param {Object<string, Array<Object>>} apyTvlData - Pool data with keys as pool names and values
 *                                                     as arrays of pool data objects.
 * @returns {Array<Object<string, Array<Object>>>} [APY data object, TVL data object] with
 *                                                 formatted pool data. Pool data objects
 *                                                 may be empty if the input is invalid.
 */
export function processPoolDataResponse(apyTvlData) {
  const processedApyData = {};
  const processedTvlData = {};

  if (
    !apyTvlData ||
    typeof apyTvlData !== 'object' ||
    Array.isArray(apyTvlData)
  ) {
    console.error('apyTvlData must be a non-null object');
    return [processedApyData, processedTvlData];
  }

  Object.entries(apyTvlData).forEach(([poolName, data]) => {
    if (!Array.isArray(data)) {
      console.error(`Data for pool ${poolName} is not an array`);
      return;
    }
    if (poolName === 'lidoEth') {
      processedApyData[poolName] = formatPoolData(data, {
        valueField: 'apy',
        outputField: 'apyPercentage',
        decimalPlaces: 2,
      });
    } else {
      processedTvlData[poolName] = formatPoolData(data, {
        valueField: 'tvlUsd',
        outputField: 'tvlUsd',
        decimalPlaces: 6,
      });
    }
  });
  return [processedApyData, processedTvlData];
}

/**
 * Processes price data for each token.
 * @param {Object<string, Array<Array<number>>>} priceData - Token data with keys as token names
 *                                                           and values as arrays of
 *                                                           [timestamp, price] pairs.
 * @returns {Object<string, Array<Object>>} Token data with formatted price objects.
 *                                          Empty object if the input is invalid.
 */
export function processPriceDataResponse(priceData) {
  if (!priceData || typeof priceData !== 'object' || Array.isArray(priceData)) {
    console.error('priceData must be a non-null object');
    return {};
  }
  return Object.fromEntries(
    Object.entries(priceData).map(([tokenName, data]) => {
      if (!Array.isArray(data)) {
        console.error(`Data for token ${tokenName} is not an array`);
        return [tokenName, []];
      }
      return [tokenName, formatPriceData(data)];
    }),
  );
}

/**
 * Processes Uniswap pool data for each pool.
 * @param {Object<string, Array<Object>>} uniswapPoolsData - Pool data with keys as pool names and
 *                                                           values as arrays of pool data objects.
 * @returns {Object<string, Array<Object>>} Pool data with formatted objects.
 *                                          Empty object if the input is invalid.
 */
export function processUniswapPoolDataResponse(uniswapPoolsData) {
  if (
    !uniswapPoolsData ||
    typeof uniswapPoolsData !== 'object' ||
    Array.isArray(uniswapPoolsData)
  ) {
    console.error('uniswapPoolsData must be a non-null object');
    return {};
  }
  return Object.fromEntries(
    Object.entries(uniswapPoolsData).map(([poolName, data]) => {
      if (!Array.isArray(data)) {
        console.error(`Data for Uniswap pool ${poolName} is not an array`);
        return [poolName, []];
      }
      return [poolName, formatUniswapPoolData(data)];
    }),
  );
}

/**
 * Removes duplicate timestamps from each array within the given data object, keeping the last
 * occurrence.
 * @param {Object<string, Array<Object>>} data - Object with keys mapping to arrays of objects with
 *                                               a 'timestamp' string property.
 * @returns {Object<string, Array<Object>>} New object with unique, sorted timestamps per key, or
 *                                          empty object if input is invalid.
 */
export function removeDuplicateTimestamps(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    console.error('Invalid data: must be a non-null object');
    return {};
  }
  const result = {};
  Object.entries(data).forEach(([key, array]) => {
    if (!Array.isArray(array)) {
      console.error(`Data for key '${key}' is not an array`);
      result[key] = [];
      return;
    }
    const lastOccurrences = new Map();
    array.forEach((element) => {
      if (element && typeof element.timestamp === 'string') {
        if (
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
            element.timestamp,
          )
        ) {
          lastOccurrences.set(element.timestamp, element);
        } else {
          console.warn(
            `Invalid ISO timestamp format in element for key '${key}': ${JSON.stringify(element)}`,
          );
        }
      } else {
        console.warn(
          `Invalid or missing timestamp in element for key '${key}': ${JSON.stringify(element)}`,
        );
      }
    });
    result[key] = Array.from(lastOccurrences.values()).sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    );
  });
  return result;
}

/**
 * Trims each array in the data object to the specified maxLength, keeping the most recent entries.
 * @param {Object<string, Array<Object>>} data - Object with keys mapping to arrays of objects.
 * @param {number} [maxLength=365] - Positive integer specifying maximum entries to keep.
 * @returns {Object<string, Array<Object>>} Trimmed data object, or empty object if
 *                                          input is invalid.
 */
export function trimData(data, maxLength = 365) {
  if (typeof data !== 'object' || data === null) {
    console.error('Invalid data: must be a non-null object');
    return {};
  }
  if (!Number.isInteger(maxLength) || maxLength < 0) {
    console.error(
      `Invalid maxLength: ${maxLength}, must be a non-negative integer`,
    );
    return data;
  }
  const trimmedData = {};
  Object.entries(data).forEach(([key, value]) => {
    if (!Array.isArray(value)) {
      console.warn(
        `Value for key '${key}' is not an array; setting to empty array`,
      );
      trimmedData[key] = [];
    } else {
      trimmedData[key] =
        value.length > maxLength ? value.slice(-maxLength) : value;
    }
  });
  return trimmedData;
}

/**
 * Identifies missing dates in each array of the data object based on timestamps.
 * @param {Object<string, Array<{timestamp: string}>>} data - Object with arrays of objects
 *                                                            containing 'timestamp' strings.
 * @returns {Object<string, Array<string>>} Object mapping keys to arrays of missing date
 *                                          ISO strings.
 */
export function findMissingDates(data) {
  if (typeof data !== 'object' || data === null) {
    console.error('Invalid data: must be a non-null object');
    return {};
  }
  const missingDatesByKey = {};
  Object.entries(data).forEach(([key, records]) => {
    if (!Array.isArray(records)) {
      console.warn(`Data for key '${key}' is not an array`);
      return;
    }
    const dates = records
      .map((r) => {
        if (
          r &&
          typeof r.timestamp === 'string' &&
          !Number.isNaN(new Date(r.timestamp))
        ) {
          const d = new Date(r.timestamp);
          return new Date(
            Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
          );
        }
        console.warn(
          `Invalid timestamp in record for key '${key}': ${JSON.stringify(r)}`,
        );
        return null;
      })
      .filter((d) => d !== null)
      .sort((a, b) => a - b);

    if (dates.length < 2) return;

    const missingDates = [];
    for (let i = 0; i < dates.length - 1; i += 1) {
      const expectedDate = new Date(dates[i].getTime());
      expectedDate.setUTCDate(expectedDate.getUTCDate() + 1);
      while (expectedDate < dates[i + 1]) {
        missingDates.push(expectedDate.toISOString());
        expectedDate.setUTCDate(expectedDate.getUTCDate() + 1);
      }
    }
    if (missingDates.length > 0) {
      missingDatesByKey[key] = missingDates;
    }
  });
  return missingDatesByKey;
}

/**
 * Calculates a date a specified number of days before the given date.
 * @param {Date} date - Starting date.
 * @param {number} numDays - Non-negative integer days to subtract.
 * @returns {string|null} ISO string of the resulting date, or null if inputs are invalid.
 */
export function findDateBefore(date, numDays) {
  if (
    !(date instanceof Date) ||
    Number.isNaN(date.getTime()) ||
    !Number.isInteger(numDays) ||
    numDays < 0
  ) {
    console.warn(`Invalid inputs: date=${date}, numDays=${numDays}`);
    return null;
  }
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - numDays,
    ),
  ).toISOString();
}

/**
 * Calculates a date a specified number of days after the given date.
 * @param {Date} date - Starting date.
 * @param {number} numDays - Non-negative integer days to add.
 * @returns {string|null} ISO string of the resulting date, or null if inputs are invalid.
 */
export function findDateAfter(date, numDays) {
  if (
    !(date instanceof Date) ||
    Number.isNaN(date.getTime()) ||
    !Number.isInteger(numDays) ||
    numDays < 0
  ) {
    console.warn(`Invalid inputs: date=${date}, numDays=${numDays}`);
    return null;
  }
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + numDays,
    ),
  ).toISOString();
}

/**
 * Finds up to two valid dates before and after a missing date within a maximum number of days.
 * @param {Date} missingDate - The missing date.
 * @param {string[]} timestamps - Array of existing ISO timestamp strings.
 * @param {number} [maxDays=7] - Maximum days to search (positive integer).
 * @returns {[string[], string[]]} Two arrays: dates before and after the missing date.
 */
export function findValidDates(missingDate, timestamps, maxDays = 7) {
  if (
    !(missingDate instanceof Date) ||
    Number.isNaN(missingDate.getTime()) ||
    !Array.isArray(timestamps) ||
    !Number.isInteger(maxDays) ||
    maxDays < 1
  ) {
    console.warn(
      `Invalid inputs: missingDate=${missingDate}, timestamps=${timestamps}, maxDays=${maxDays}`,
    );
    return [[], []];
  }
  const timestampSet = new Set(timestamps);
  const beforeDates = [];
  const afterDates = [];
  for (
    let i = 1;
    i <= maxDays && (beforeDates.length < 2 || afterDates.length < 2);
    i += 1
  ) {
    if (beforeDates.length < 2) {
      const beforeDay = findDateBefore(missingDate, i);
      if (beforeDay && timestampSet.has(beforeDay)) beforeDates.push(beforeDay);
    }
    if (afterDates.length < 2) {
      const afterDay = findDateAfter(missingDate, i);
      if (afterDay && timestampSet.has(afterDay)) afterDates.push(afterDay);
    }
  }
  return [beforeDates.slice(0, 2), afterDates.slice(0, 2)];
}

/**
 * Retrieves metrics from records for the given valid dates.
 * @param {string[]} validDates - Array of ISO timestamp strings.
 * @param {Map<string, Object>} recordMap - Map of timestamps to records with metric
 *                                          key-value pairs.
 * @returns {Object<string, Array<number>>} Metrics object with arrays of values per metric.
 */
export function getMetrics(validDates, recordMap) {
  if (!Array.isArray(validDates) || !(recordMap instanceof Map)) {
    console.warn(
      `Invalid inputs: validDates=${validDates}, recordMap=${recordMap}`,
    );
    return {};
  }
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
 * Simulates metrics for a missing date based on before and after metrics.
 * @param {Object<string, number[]>} metricsBefore - Metrics before the missing date.
 * @param {Object<string, number[]>} metricsAfter - Metrics after the missing date.
 * @returns {Object<string, number>} Simulated metrics as integers.
 */
export function simulateMetrics(metricsBefore, metricsAfter) {
  if (typeof metricsBefore !== 'object' || typeof metricsAfter !== 'object') {
    console.warn(
      `Invalid inputs: metricsBefore=${metricsBefore}, metricsAfter=${metricsAfter}`,
    );
    return {};
  }
  const simulatedMetrics = {};
  const allMetrics = new Set([
    ...Object.keys(metricsBefore || {}),
    ...Object.keys(metricsAfter || {}),
  ]);

  Array.from(allMetrics).forEach((metric) => {
    const beforeValues = Array.isArray(metricsBefore[metric])
      ? metricsBefore[metric].filter((v) => typeof v === 'number')
      : [];
    const afterValues = Array.isArray(metricsAfter[metric])
      ? metricsAfter[metric].filter((v) => typeof v === 'number')
      : [];
    let simulatedValue;

    if (beforeValues.length > 0 && afterValues.length > 0) {
      const avgBefore =
        beforeValues.reduce((a, b) => a + b, 0) / beforeValues.length;
      const avgAfter =
        afterValues.reduce((a, b) => a + b, 0) / afterValues.length;
      const min = Math.min(avgBefore, avgAfter);
      const max = Math.max(avgBefore, avgAfter);
      simulatedValue = Math.floor(Math.random() * (max - min) + min);
    } else if (beforeValues.length > 0) {
      simulatedValue = Math.floor(
        beforeValues.reduce((a, b) => a + b, 0) / beforeValues.length,
      );
    } else if (afterValues.length > 0) {
      simulatedValue = Math.floor(
        afterValues.reduce((a, b) => a + b, 0) / afterValues.length,
      );
    } else {
      simulatedValue = 0;
      console.warn(`No numeric data for metric '${metric}', defaulting to 0`);
    }
    simulatedMetrics[metric] = simulatedValue;
  });
  return simulatedMetrics;
}

/**
 * Fills missing dates in the data object with simulated metrics.
 * @param {Object<string, Array<{timestamp: string, [key: string]: number}>>} data -
 *    Object with arrays of objects containing 'timestamp' (string) and metric key-value pairs.
 * @param {Object<string, Array<string>>} missingDates - Missing dates as ISO strings per key.
 * @returns {Object<string, Array<{timestamp: string, [key: string]: number}>>}
 *    Data with filled missing dates.
 */
export function fillMissingDates(data, missingDates) {
  if (
    typeof data !== 'object' ||
    typeof missingDates !== 'object' ||
    data === null ||
    missingDates === null
  ) {
    console.error(
      'Invalid inputs: data or missingDates must be non-null objects',
    );
    return data || {};
  }
  const filledData = {};
  Object.entries(missingDates).forEach(([key, dates]) => {
    if (!Array.isArray(dates)) {
      console.warn(`Missing dates for key '${key}' is not an array`);
      return;
    }
    const records = data[key];
    if (!Array.isArray(records)) {
      console.warn(`Data for key '${key}' is not an array`);
      return;
    }
    const newRecords = [];
    const recordMap = new Map(records.map((r) => [r.timestamp, r]));
    const timestamps = records.map((r) => r.timestamp);

    dates.forEach((date) => {
      const missingDate = new Date(date);
      if (Number.isNaN(missingDate.getTime())) {
        console.warn(`Invalid date '${date}' for key '${key}'`);
        return;
      }
      const [validDatesBefore, validDatesAfter] = findValidDates(
        missingDate,
        timestamps,
      );
      if (validDatesBefore.length > 0 || validDatesAfter.length > 0) {
        const metricsBefore = getMetrics(validDatesBefore, recordMap);
        const metricsAfter = getMetrics(validDatesAfter, recordMap);
        const simulatedMetrics = simulateMetrics(metricsBefore, metricsAfter);
        newRecords.push({
          timestamp: missingDate.toISOString(),
          ...simulatedMetrics,
        });
      } else {
        console.warn(`No valid dates found for ${date} in '${key}'`);
        if (records.length === 0) {
          console.error(`No data available for '${key}'. Skipping.`);
          return;
        }
        const sampleRecord = records[0];
        const simulatedMetrics = {};
        Object.keys(sampleRecord).forEach((k) => {
          if (k !== 'timestamp') simulatedMetrics[k] = 0;
        });
        newRecords.push({
          timestamp: missingDate.toISOString(),
          ...simulatedMetrics,
        });
      }
    });
    filledData[key] = [...records, ...newRecords].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    );
  });
  return Object.keys(filledData).length > 0 ? filledData : data;
}

/**
 * Checks if TVL and Uniswap pool data timestamps align for each pool.
 * @param {Object<string, Array<{timestamp: string}>>} tvlData - TVL data per pool.
 * @param {Object<string, Array<{timestamp: string}>>} uniswapPoolsData - Uniswap data per pool.
 * @returns {boolean} True if timestamps align, false otherwise.
 */
export function checkTimestampAlignment(tvlData, uniswapPoolsData) {
  if (
    typeof tvlData !== 'object' ||
    typeof uniswapPoolsData !== 'object' ||
    tvlData === null ||
    uniswapPoolsData === null
  ) {
    console.error(
      'Invalid inputs: tvlData or uniswapPoolsData must be non-null objects',
    );
    return false;
  }
  return Object.entries(uniswapPoolsData).every(([poolName, data]) => {
    if (!Object.prototype.hasOwnProperty.call(tvlData, poolName)) {
      console.error(`Pool '${poolName}' not found in tvlData`);
      return false;
    }
    const tvlDataOfPool = tvlData[poolName];
    if (!Array.isArray(data) || !Array.isArray(tvlDataOfPool)) {
      console.error(
        `Data for pool '${poolName}' is not an array in one of the datasets`,
      );
      return false;
    }
    if (data.length !== tvlDataOfPool.length) {
      console.error(
        `Data length mismatch for pool '${poolName}': uniswapPoolsData has ${data.length}, tvlData has ${tvlDataOfPool.length}`,
      );
      return false;
    }
    return Array.from({ length: data.length }).every((_, i) => {
      if (
        !data[i] ||
        !tvlDataOfPool[i] ||
        data[i].timestamp !== tvlDataOfPool[i].timestamp
      ) {
        console.error(
          `Timestamp mismatch at index ${i} of pool '${poolName}': ${data[i]?.timestamp} !== ${tvlDataOfPool[i]?.timestamp}`,
        );
        return false;
      }
      return true;
    });
  });
}

/**
 * Formats Uniswap pool data with TVL and pool addresses if timestamps align.
 * @param {Object<string, Array<{timestamp: string, tvlUsd: number}>>} tvlData - TVL data per pool.
 * @param {Object<string, Array<{
 *   timestamp: string,
 *   [key: string]: number
 * }>>} uniswapPoolsData - Uniswap data per pool.
 * @returns {Object<string, Array<{
 *   timestamp: string,
 *   poolAddress: string,
 *   tvlUsd: number,
 *   [key: string]: any
 * }>>} Formatted data or empty object if not aligned.
 */
export function formatLiquidityPoolData(tvlData, uniswapPoolsData) {
  const liquidityPoolData = {};
  const isAligned = checkTimestampAlignment(tvlData, uniswapPoolsData);
  if (isAligned) {
    Object.entries(uniswapPoolsData).forEach(([poolName, data]) => {
      const tvlDataOfPool = tvlData[poolName];
      const poolAddress = poolAddresses[poolName];
      if (!poolAddress) {
        console.warn(`No pool address for '${poolName}'`);
        return;
      }
      liquidityPoolData[poolName] = data.map((poolDataForDay, i) => {
        const tvlForDay = tvlDataOfPool[i];
        return {
          ...poolDataForDay,
          poolAddress,
          tvlUsd: tvlForDay.tvlUsd,
        };
      });
    });
  } else {
    console.warn('Timestamp alignment failed; returning empty object');
  }
  return liquidityPoolData;
}

/**
 * Adds token symbol to each day's price data.
 * @param {Object<string, Array<{
 *   timestamp: string,
 *   priceUsd: number
 * }>>} priceData - Price data per token.
 * @returns {Object<string, Array<{
 *   timestamp: string,
 *   priceUsd: number,
 *   tokenSymbol: string
 * }>>} Price data with symbols.
 */
export function addSymbolToPriceData(priceData) {
  if (typeof priceData !== 'object' || priceData === null) {
    console.error('Invalid priceData: must be a non-null object');
    return {};
  }
  const priceDataWithSymbol = {};
  Object.entries(priceData).forEach(([tokenName, dailyPriceData]) => {
    if (!Array.isArray(dailyPriceData)) {
      console.warn(`Price data for '${tokenName}' is not an array`);
      return;
    }
    const tokenSymbol = tokenName.toUpperCase();
    priceDataWithSymbol[tokenName] = dailyPriceData.map((priceDataForDay) => ({
      ...priceDataForDay,
      tokenSymbol,
    }));
  });
  return priceDataWithSymbol;
}
