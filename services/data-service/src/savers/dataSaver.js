/**
 * Saves staking APY data to the database, handling small batches of records (up to 365 records).
 * Each record is inserted individually to handle potential duplicates and errors gracefully.
 *
 * @param {Object} apyData - The staking APY data to be saved.
 * @param {Object} app - The application object containing the database models.
 *
 * @throws {Error} If an error occurs during insertion that is not a unique constraint violation.
 */
export async function saveStakingData(apyData, app) {
  for (const [_poolName, dailyApyData] of Object.entries(apyData || {})) {
    for (const apyDataForDay of dailyApyData || []) {
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
        console.error('Invalid staking data skipped:', apyDataForDay);
      }
    }
  }
}

/**
 * Saves token price data to the database, handling small batches of records (up to 365 records).
 * Each record is inserted individually to handle potential duplicates and errors gracefully.
 *
 * @param {Object} priceData - The token price data to be saved.
 * @param {Object} app - The application object containing the database models.
 * 
 * @throws {Error} If an error occurs during insertion that is not a unique constraint violation.
 */
export async function saveTokenPriceData(priceData, app) {
  for (const [_tokenName, dailyPriceData] of Object.entries(priceData || {})) {
    for (const priceDataForDay of dailyPriceData || []) {
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
        console.error('Invalid token price data skipped:', priceDataForDay);
      }
    }
  }
}

/**
 * Saves liquidity pool data to the database, handling small batches of records (up to 365 records).
 * Each record is inserted individually to handle potential duplicates and errors gracefully.
 *
 * @param {Object} liquidityPoolData - The liquidity pool data to be saved.
 * @param {Object} app - The application object containing the database models.
 * 
 * @throws {Error} If an error occurs during insertion that is not a unique constraint violation.
 */
export async function saveLiquidityPoolData(liquidityPoolData, app) {
  for (const [_poolName, dailyLpData] of Object.entries(liquidityPoolData || {})) {
    for (const lpDataForDay of dailyLpData || []) {
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
        console.error('Invalid liquidity pool data skipped:', lpDataForDay);
      }
    }
  }
}
