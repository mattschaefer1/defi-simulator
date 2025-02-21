import axios from 'axios';
import APYHistory from '../models/apyHistory.js';
import PriceHistory from '../models/priceHistory.js';
import PoolHistory from '../models/poolHistory.js';

async function fetchAndStoreAPY() {
  try {
    console.log(`Pool data saved: ${APYHistory}`);
  } catch (error) {
    console.error('Error fetching APY data:', error.message);
  }
}

async function fetchAndStorePrices() {
  try {
    console.log(`Pool data saved: ${PriceHistory}`);
  } catch (error) {
    console.error('Error fetching price data:', error.message);
  }
}

async function fetchAndStorePoolData() {
  try {
    console.log(`Pool data saved: ${PoolHistory}`);
  } catch (error) {
    console.error('Error fetching pool data:', error.message);
  }
}

export { fetchAndStoreAPY, fetchAndStorePrices, fetchAndStorePoolData };
