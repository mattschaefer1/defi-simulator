/**
 * Saves staking APY data to the database, handling small batches of records (up to 365 records).
 * Each record is inserted individually to handle potential duplicates and errors gracefully.
 *
 * @param {Object<string, {
 *   timestamp: string,
 *   apyPercentage: number
 * }[]>} apyData - Staking APY data, keyed by pool name with arrays of daily records.
 * @param {Object} app - Application object containing database models under `app.locals.models`.
 * @throws {Error} If the database model is unavailable or an insertion error
 *                 occurs (beyond unique constraint violations).
 */
export function saveStakingData(apyData, app) {
  if (!app?.locals?.models?.ETHStakingHistorical) {
    return Promise.reject(
      new Error('Database model ETHStakingHistorical is not available'),
    );
  }

  return Promise.all(
    Object.entries(apyData || {})
      .filter(([poolName, dailyApyData]) => {
        if (!Array.isArray(dailyApyData)) {
          console.warn(
            `Skipping invalid data for pool '${poolName}': not an array`,
          );
          return false;
        }
        return true;
      })
      .flatMap(([, dailyApyData]) =>
        dailyApyData
          .filter(
            (apyDataForDay) =>
              apyDataForDay?.timestamp &&
              typeof apyDataForDay.apyPercentage === 'number',
          )
          .map((apyDataForDay) =>
            app.locals.models.ETHStakingHistorical.create({
              timestamp: apyDataForDay.timestamp,
              apy_percentage: apyDataForDay.apyPercentage,
            })
              .then(() => {
                console.log(
                  `Inserted staking record for timestamp: ${apyDataForDay.timestamp}`,
                );
              })
              .catch((error) => {
                if (error.name === 'SequelizeUniqueConstraintError') {
                  console.log(
                    `Skipped duplicate staking record for timestamp: ${apyDataForDay.timestamp}`,
                  );
                } else {
                  console.error('Error inserting staking record:', error);
                  throw error;
                }
              }),
          ),
      ),
  );
}

/**
 * Saves token price data to the database, handling small batches of records (up to 365 records).
 * Each record is inserted individually to handle potential duplicates and errors gracefully.
 *
 * @param {Object<string, {
 *   timestamp: string,
 *   tokenSymbol: string,
 *   priceUsd: number
 * }[]>} priceData - Token price data, keyed by token name with arrays of daily records.
 * @param {Object} app - Application object containing database models under `app.locals.models`.
 * @throws {Error} If the database model is unavailable or an insertion error occurs
 *                 (beyond unique constraint violations).
 */
export function saveTokenPriceData(priceData, app) {
  if (!app?.locals?.models?.TokenPrice) {
    return Promise.reject(
      new Error('Database model TokenPrice is not available'),
    );
  }

  return Promise.all(
    Object.entries(priceData || {})
      .filter(([tokenName, dailyPriceData]) => {
        if (!Array.isArray(dailyPriceData)) {
          console.warn(
            `Skipping invalid data for token '${tokenName}': not an array`,
          );
          return false;
        }
        return true;
      })
      .flatMap(([, dailyPriceData]) =>
        dailyPriceData
          .filter(
            (priceDataForDay) =>
              priceDataForDay?.timestamp &&
              priceDataForDay?.tokenSymbol &&
              typeof priceDataForDay.priceUsd === 'number',
          )
          .map((priceDataForDay) =>
            app.locals.models.TokenPrice.create({
              timestamp: priceDataForDay.timestamp,
              token_symbol: priceDataForDay.tokenSymbol,
              price_usd: priceDataForDay.priceUsd,
            })
              .then(() => {
                console.log(
                  `Inserted token price record for ${priceDataForDay.tokenSymbol} at ${priceDataForDay.timestamp}`,
                );
              })
              .catch((error) => {
                if (error.name === 'SequelizeUniqueConstraintError') {
                  console.log(
                    `Skipped duplicate token price record for ${priceDataForDay.tokenSymbol} at ${priceDataForDay.timestamp}`,
                  );
                } else {
                  console.error('Error inserting token price record:', error);
                  throw error;
                }
              }),
          ),
      ),
  );
}

/**
 * Saves liquidity pool data to the database, handling small batches of records (up to 365 records).
 * Each record is inserted individually to handle potential duplicates and errors gracefully.
 *
 * @param {Record<string, {
 *   timestamp: string,
 *   poolAddress: string,
 *   tvlUsd: number,
 *   volumeUSD: number,
 *   feesUSD: number
 * }[]>} liquidityPoolData - Liquidity pool data, keyed by pool name with daily records.
 * @param {Object} app - Application object containing database models under `app.locals.models`.
 * @throws {Error} If the database model is unavailable or an insertion error occurs
 *                 (beyond unique constraint violations).
 */
export function saveLiquidityPoolData(liquidityPoolData, app) {
  if (!app?.locals?.models?.LPHistorical) {
    return Promise.reject(
      new Error('Database model LPHistorical is not available'),
    );
  }

  return Promise.all(
    Object.entries(liquidityPoolData || {})
      .filter(([poolName, dailyLpData]) => {
        if (!Array.isArray(dailyLpData)) {
          console.warn(
            `Skipping invalid data for pool '${poolName}': not an array`,
          );
          return false;
        }
        return true;
      })
      .flatMap(([, dailyLpData]) =>
        dailyLpData
          .filter(
            (lpDataForDay) =>
              lpDataForDay?.timestamp &&
              lpDataForDay?.poolAddress &&
              typeof lpDataForDay.tvlUsd === 'number' &&
              typeof lpDataForDay.volumeUSD === 'number' &&
              typeof lpDataForDay.feesUSD === 'number',
          )
          .map((lpDataForDay) =>
            app.locals.models.LPHistorical.create({
              timestamp: lpDataForDay.timestamp,
              pool_address: lpDataForDay.poolAddress,
              tvl_usd: lpDataForDay.tvlUsd,
              volume_24h_usd: lpDataForDay.volumeUSD,
              fees_24h_usd: lpDataForDay.feesUSD,
            })
              .then(() => {
                console.log(
                  `Inserted liquidity pool record for ${lpDataForDay.poolAddress} at ${lpDataForDay.timestamp}`,
                );
              })
              .catch((error) => {
                if (error.name === 'SequelizeUniqueConstraintError') {
                  console.log(
                    `Skipped duplicate liquidity pool record for ${lpDataForDay.poolAddress} at ${lpDataForDay.timestamp}`,
                  );
                } else {
                  console.error(
                    'Error inserting liquidity pool record:',
                    error,
                  );
                  throw error;
                }
              }),
          ),
      ),
  );
}
