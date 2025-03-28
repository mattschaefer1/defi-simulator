import {
  fetchPoolData,
  fetchPriceData,
  fetchUniswapPoolData
} from '../services/dataFetcher.js';
import {
  saveStakingData,
  saveTokenPriceData,
  saveLiquidityPoolData
} from '../savers/dataSaver.js';
import {
  trimData,
  removeDuplicateTimestamps,
  findMissingDates,
  fillMissingDates,
  formatLiquidityPoolData,
  addSymbolToPriceData,
  processPoolDataResponse,
  processPriceDataResponse,
  processUniswapPoolDataResponse
} from '../processors/dataProcessor.js';

export default async function dataHandler(app) {
  try {
    const [apyTvlData, priceData, uniswapPoolsData] = await Promise.all([
      fetchPoolData(),
      fetchPriceData(365),
      fetchUniswapPoolData(365)
    ]);

    const [processedApyData, processedTvlData] = processPoolDataResponse(apyTvlData);
    const processedPriceData = processPriceDataResponse(priceData);
    const processedUniswapPoolsData = processUniswapPoolDataResponse(uniswapPoolsData);

    const cleanApyData = removeDuplicateTimestamps(processedApyData);
    const cleanTvlData = removeDuplicateTimestamps(processedTvlData);
    const cleanPriceData = removeDuplicateTimestamps(processedPriceData);
    const cleanUniswapPoolsData = removeDuplicateTimestamps(processedUniswapPoolsData);

    const trimmedApyData = trimData(cleanApyData);
    const trimmedTvlData = trimData(cleanTvlData);
    const trimmedPriceData = trimData(cleanPriceData);
    const trimmedUniswapPoolsData = trimData(cleanUniswapPoolsData);

    const missingApyDates = findMissingDates(trimmedApyData);
    const missingTvlDates = findMissingDates(trimmedTvlData);
    const missingPriceDates = findMissingDates(trimmedPriceData);
    const missingUniswapDates = findMissingDates(trimmedUniswapPoolsData);

    const filledApyData = Object.keys(missingApyDates).length > 0
      ? trimData(fillMissingDates(trimmedApyData, missingApyDates))
      : trimmedApyData;
    const filledTvlData = Object.keys(missingTvlDates).length > 0
      ? trimData(fillMissingDates(trimmedTvlData, missingTvlDates))
      : trimmedTvlData;
    const filledPriceData = Object.keys(missingPriceDates).length > 0
      ? trimData(fillMissingDates(trimmedPriceData, missingPriceDates))
      : trimmedPriceData;
    const filledUniswapPoolsData = Object.keys(missingUniswapDates).length > 0
      ? trimData(fillMissingDates(trimmedUniswapPoolsData, missingUniswapDates))
      : trimmedUniswapPoolsData;

    const liquidityPoolData = formatLiquidityPoolData(filledTvlData, filledUniswapPoolsData);
    const tokenPriceData = addSymbolToPriceData(filledPriceData);

    await saveStakingData(filledApyData, app).catch(err => {
      console.error('Failed to save staking data:', err);
      throw err;
    });
    await saveTokenPriceData(tokenPriceData, app).catch(err => {
      console.error('Failed to save token price data:', err);
      throw err;
    });
    await saveLiquidityPoolData(liquidityPoolData, app).catch(err => {
      console.error('Failed to save liquidity pool data:', err);
      throw err;
    });
    console.log('All data saved successfully');
  } catch (error) {
    console.error('Error in dataHandler:', error);
    throw error;
  }
}
