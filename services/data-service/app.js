import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import dataRoutes from './src/routes/dataRoutes.js';
import { sequelize, models } from './src/models/index.js';
import { fetchPoolData, fetchPriceData, fetchUniswapPoolData } from './src/services/dataFetcher.js';
import { trimData, removeDuplicateTimestamps, findMissingDates, fillMissingDates, formatLiquidityPoolData, processPoolDataResponse, processPriceDataResponse, processUniswapPoolDataResponse } from './src/processors/dataProcessor.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the defi-simulator root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.DATA_SERVICE_PORT || 3001;

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Database connection test
sequelize.authenticate()
  .then(() => console.log('Connected to TimescaleDB'))
  .catch(err => console.error('TimescaleDB connection error:', err));

// Make models available to routes
app.locals.models = models;

// Routes
app.use('/api/data', dataRoutes);

// Fetch data
const apyTvlData = await fetchPoolData();
const priceData = await fetchPriceData(365);
const uniswapPoolsData = await fetchUniswapPoolData(365);

// Process data
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

console.log('APY data fetched and processed:', filledApyData);
console.log('Price data fetched and processed:', filledPriceData);
console.log('Pool data fetched and processed:', liquidityPoolData);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Data Service running on port ${PORT}`);
});
