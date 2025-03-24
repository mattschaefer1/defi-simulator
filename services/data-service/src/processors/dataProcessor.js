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

function findDateBefore(date, numDays) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - numDays
    )
  ).toISOString();
}

function findDateAfter(date, numDays) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + numDays
    )
  ).toISOString();
}

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
