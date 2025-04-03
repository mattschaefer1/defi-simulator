/**
 * Saves staking APY data to the database, handling small batches of records (up to 365 records).
 * Each record is inserted individually to handle potential duplicates and errors gracefully.
 *
 * @param {Object<string, Array<{timestamp: string, apyPercentage: number}>>} apyData - Staking APY data, keyed by pool name with arrays of daily records.
 * @param {Object} app - Application object containing database models under `app.locals.models`.
 * @throws {Error} If the database model is unavailable or an insertion error occurs (beyond unique constraint violations).
 */
export async function saveStakingData(apyData, app) {
  if (!app?.locals?.models?.ETHStakingHistorical) {
    throw new Error('Database model ETHStakingHistorical is not available');
  }
  for (const [_poolName, dailyApyData] of Object.entries(apyData || {})) {
    if (!Array.isArray(dailyApyData)) {
      console.warn(`Skipping invalid data for pool '${_poolName}': not an array`);
      continue;
    }
    for (const apyDataForDay of dailyApyData) {
      if (apyDataForDay?.timestamp && typeof apyDataForDay.apyPercentage === 'number') {
        try {
          await app.locals.models.ETHStakingHistorical.create({
            timestamp: apyDataForDay.timestamp,
            apy_percentage: apyDataForDay.apyPercentage,
          });
          console.log(`Inserted staking record for timestamp: ${apyDataForDay.timestamp}`);
        } catch (error) {
          if (error.name === 'SequelizeUniqueConstraintError') {
            console.log(`Skipped duplicate staking record for timestamp: ${apyDataForDay.timestamp}`);
          } else {
            console.error(`Error inserting staking record:`, error);
          }
        }
      } else {
        console.warn('Invalid staking data skipped:', apyDataForDay);
      }
    }
  }
}

/**
 * Saves token price data to the database, handling small batches of records (up to 365 records).
 * Each record is inserted individually to handle potential duplicates and errors gracefully.
 *
 * @param {Object<string, Array<{timestamp: string, tokenSymbol: string, priceUsd: number}>>} priceData - Token price data, keyed by token name with arrays of daily records.
 * @param {Object} app - Application object containing database models under `app.locals.models`.
 * @throws {Error} If the database model is unavailable or an insertion error occurs (beyond unique constraint violations).
 */
export async function saveTokenPriceData(priceData, app) {
  if (!app?.locals?.models?.TokenPrice) {
    throw new Error('Database model TokenPrice is not available');
  }
  for (const [_tokenName, dailyPriceData] of Object.entries(priceData || {})) {
    if (!Array.isArray(dailyPriceData)) {
      console.warn(`Skipping invalid data for token '${_tokenName}': not an array`);
      continue;
    }
    for (const priceDataForDay of dailyPriceData) {
      if (
        priceDataForDay?.timestamp &&
        priceDataForDay?.tokenSymbol &&
        typeof priceDataForDay.priceUsd === 'number'
      ) {
        try {
          await app.locals.models.TokenPrice.create({
            timestamp: priceDataForDay.timestamp,
            token_symbol: priceDataForDay.tokenSymbol,
            price_usd: priceDataForDay.priceUsd,
          });
          console.log(`Inserted token price record for ${priceDataForDay.tokenSymbol} at ${priceDataForDay.timestamp}`);
        } catch (error) {
          if (error.name === 'SequelizeUniqueConstraintError') {
            console.log(`Skipped duplicate token price record for ${priceDataForDay.tokenSymbol} at ${priceDataForDay.timestamp}`);
          } else {
            console.error(`Error inserting token price record:`, error);
          }
        }
      } else {
        console.warn('Invalid token price data skipped:', priceDataForDay);
      }
    }
  }
}

/**
 * Saves liquidity pool data to the database, handling small batches of records (up to 365 records).
 * Each record is inserted individually to handle potential duplicates and errors gracefully.
 *
 * @param {Object<string, Array<{timestamp: string, poolAddress: string, tvlUsd: number, volumeUSD: number, feesUSD: number}>>} liquidityPoolData - Liquidity pool data, keyed by pool name with arrays of daily records.
 * @param {Object} app - Application object containing database models under `app.locals.models`.
 * @throws {Error} If the database model is unavailable or an insertion error occurs (beyond unique constraint violations).
 */
export async function saveLiquidityPoolData(liquidityPoolData, app) {
  if (!app?.locals?.models?.LPHistorical) {
    throw new Error('Database model LPHistorical is not available');
  }
  for (const [_poolName, dailyLpData] of Object.entries(liquidityPoolData || {})) {
    if (!Array.isArray(dailyLpData)) {
      console.warn(`Skipping invalid data for pool '${_poolName}': not an array`);
      continue;
    }
    for (const lpDataForDay of dailyLpData) {
      if (
        lpDataForDay?.timestamp &&
        lpDataForDay?.poolAddress &&
        typeof lpDataForDay.tvlUsd === 'number' &&
        typeof lpDataForDay.volumeUSD === 'number' &&
        typeof lpDataForDay.feesUSD === 'number'
      ) {
        try {
          await app.locals.models.LPHistorical.create({
            timestamp: lpDataForDay.timestamp,
            pool_address: lpDataForDay.poolAddress,
            tvl_usd: lpDataForDay.tvlUsd,
            volume_24h_usd: lpDataForDay.volumeUSD,
            fees_24h_usd: lpDataForDay.feesUSD,
          });
          console.log(`Inserted liquidity pool record for ${lpDataForDay.poolAddress} at ${lpDataForDay.timestamp}`);
        } catch (error) {
          if (error.name === 'SequelizeUniqueConstraintError') {
            console.log(`Skipped duplicate liquidity pool record for ${lpDataForDay.poolAddress} at ${lpDataForDay.timestamp}`);
          } else {
            console.error(`Error inserting liquidity pool record:`, error);
          }
        }
      } else {
        console.warn('Invalid liquidity pool data skipped:', lpDataForDay);
      }
    }
  }
}
