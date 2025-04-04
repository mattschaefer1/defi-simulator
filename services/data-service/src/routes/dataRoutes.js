import express from 'express';
import { Op } from 'sequelize';
import { poolAddresses, tokenAddresses } from '../config/pools.js';

const router = express.Router();

/**
 * Validates optional start and end query parameters of a request.
 * @param {string} [start] - Optional start date in ISO 8601 format (e.g., "2023-01-01")
 * @param {string} [end] - Optional end date in ISO 8601 format (e.g., "2023-12-31")
 * @returns {Object} An object containing:
 *   - {Date} [startDate] - The start date if provided and valid, otherwise undefined
 *   - {Date} [endDate] - The end date if provided and valid, otherwise undefined
 *   - {string} [errorMsg] - An error message if dates are invalid or start is after end,
 *                           otherwise undefined
 */
function validateRequestDates(start, end) {
  let startDate;
  let endDate;
  let errorMsg;
  if (start) {
    startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) {
      errorMsg = 'Invalid start date';
      return { startDate, endDate, errorMsg };
    }
  }
  if (end) {
    endDate = new Date(end);
    if (Number.isNaN(endDate.getTime())) {
      errorMsg = 'Invalid end date';
      return { startDate, endDate, errorMsg };
    }
  }
  if (startDate && endDate && startDate > endDate) {
    errorMsg = 'Start date must be before end date';
    return { startDate, endDate, errorMsg };
  }
  return { startDate, endDate, errorMsg };
}

/**
 * Adds valid start and end dates to the where clause of a database query.
 * @param {Object} whereClause - Where clause of a query to add start and end dates to
 * @param {Date} [startDate] - Optional start date
 * @param {Date} [endDate] - Optional end date
 * @returns {Object} Updated where clause with start and/or end dates
 */
function addDatesToWhereClause(whereClause, startDate, endDate) {
  const result = { ...whereClause };
  if (startDate) {
    result.timestamp = { [Op.gte]: startDate };
  }
  if (endDate) {
    result.timestamp = result.timestamp
      ? { ...result.timestamp, [Op.lte]: endDate }
      : { [Op.lte]: endDate };
  }
  return result;
}

/**
 * Retrieves the APY history from the ETHStakingHistorical table,
 * optionally filtered by a date range.
 *
 * Frontend Uses:
 *  - Display the current APY on the simulation home page
 *  - Display APY history on the staking simulation page
 * Backend Uses:
 *  - Used to run simulations
 *
 * @param {string} [req.query.start] - Optional start date in ISO 8601 format (e.g., "2023-01-01")
 * @param {string} [req.query.end] - Optional end date in ISO 8601 format (e.g., "2023-12-31")
 * @returns {Object} JSON object with a 'apyHistory' property containing an array of objects, each
 *                   with 'timestamp' and 'apy_percentage', ordered by timestamp ascending
 * @throws {400} If start/end parameters are invalid or start is after end
 * @throws {500} If an unexpected server error occurs
 */
router.get('/apy-history', async (req, res) => {
  try {
    const { start, end } = req.query;

    const { startDate, endDate, errorMsg } = validateRequestDates(start, end);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    if (!req.app.locals.models?.ETHStakingHistorical) {
      throw new Error('ETHStakingHistorical model is not available');
    }

    let whereClause = {};
    whereClause = addDatesToWhereClause(whereClause, startDate, endDate);

    const apyHistory = await req.app.locals.models.ETHStakingHistorical.findAll(
      {
        where: whereClause,
        order: [['timestamp', 'ASC']],
      },
    );

    return res.json({ apyHistory });
  } catch (error) {
    console.error('Error in /apy-history:', error);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

/**
 * Retrieves pool addresses and token names for each pool in the Pool table.
 *
 * Frontend Uses:
 *  - Display available LPs on the simulation home page
 *    (use pool_address to query data for a particular pool)
 *
 * @returns {Object} JSON object with a 'pools' property containing an array of objects,
 *                   each with 'pool_address', 'token0_symbol', and 'token1_symbol'
 * @throws {500} If an unexpected server error occurs
 */
router.get('/pools', async (req, res) => {
  try {
    if (!req.app.locals.models?.Pool) {
      throw new Error('Pool model is not available');
    }
    const pools = await req.app.locals.models.Pool.findAll();
    return res.json({ pools });
  } catch (error) {
    console.error('Error in /pools:', error);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

/**
 * Retrieves historical data for a given pool address from the LPHistorical table,
 * optionally filtered by a date range.
 *
 * Frontend Uses:
 *  - Display LP's details on its simulation page
 * Backend Uses:
 *  - Used to run simulations
 *
 * @param {string} req.query.address - The address of the pool to retrieve data for
 * @param {string} [req.query.start] - Optional start date in ISO 8601 format (e.g., "2023-01-01")
 * @param {string} [req.query.end] - Optional end date in ISO 8601 format (e.g., "2023-12-31")
 * @returns {Object} JSON object with a 'poolData' property containing an array of objects, each
 *                   with 'timestamp', 'pool_address', 'tvl_usd', 'volume_24h_usd', and
 *                   'fees_24h_usd', ordered by timestamp ascending
 * @throws {400} If address parameter is missing or invalid, or if start/end parameters are invalid
 *               or start is after end
 * @throws {500} If an unexpected server error occurs
 */
router.get('/pool', async (req, res) => {
  try {
    const { address, start, end } = req.query;

    if (!address) {
      return res.status(400).json({ message: 'Missing address parameter' });
    }
    if (!Object.values(poolAddresses).includes(address)) {
      return res.status(400).json({ message: 'Invalid address parameter' });
    }

    const { startDate, endDate, errorMsg } = validateRequestDates(start, end);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    if (!req.app.locals.models?.LPHistorical) {
      throw new Error('LPHistorical model is not available');
    }

    let whereClause = {
      pool_address: address,
    };
    whereClause = addDatesToWhereClause(whereClause, startDate, endDate);

    const poolData = await req.app.locals.models.LPHistorical.findAll({
      where: whereClause,
      order: [['timestamp', 'ASC']],
    });

    return res.json({ poolData });
  } catch (error) {
    console.error(`Error in /pool for pool ${req.query.address}:`, error);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

/**
 * Retrieves historical price data for a token from the TokenPrice table,
 * optionally filtered by a date range.
 *
 * Frontend Uses:
 *  - Display price history on the staking & LP simulation pages
 * Backend Uses:
 *  - Used to run simulations
 *
 * @param {string} req.query.token - The symbol of the token to retrieve data for (e.g., "WETH")
 * @param {string} [req.query.start] - Optional start date in ISO 8601 format (e.g., "2023-01-01")
 * @param {string} [req.query.end] - Optional end date in ISO 8601 format (e.g., "2023-12-31")
 * @returns {Object} JSON object with a 'priceData' property containing an array of objects, each
 *                   with 'timestamp', 'token_symbol', and 'price_usd', ordered by timestamp
 *                   ascending
 * @throws {400} If token parameter is missing or invalid, or if start/end parameters are invalid
 *               or start is after end
 * @throws {500} If an unexpected server error occurs
 */
router.get('/price-history', async (req, res) => {
  try {
    const { token, start, end } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Missing token parameter' });
    }
    const tokenName = token.toLowerCase();
    if (!Object.keys(tokenAddresses).includes(tokenName)) {
      return res.status(400).json({ message: 'Invalid token parameter' });
    }

    const { startDate, endDate, errorMsg } = validateRequestDates(start, end);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    if (!req.app.locals.models?.TokenPrice) {
      throw new Error('TokenPrice model is not available');
    }

    let whereClause = {
      token_symbol: token.toUpperCase(),
    };
    whereClause = addDatesToWhereClause(whereClause, startDate, endDate);

    const priceData = await req.app.locals.models.TokenPrice.findAll({
      where: whereClause,
      order: [['timestamp', 'ASC']],
    });

    return res.json({ priceData });
  } catch (error) {
    console.error(
      `Error in /price-history for token ${req.query.token}:`,
      error,
    );
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

export default router;
