import axios from 'axios';

async function fetchAndStoreAPY() {
  try {
    console.log(`Pool data saved`);
  } catch (error) {
    console.error('Error fetching APY data:', error.message);
  }
}

async function fetchAndStorePrices() {
  try {
    console.log(`Pool data saved`);
  } catch (error) {
    console.error('Error fetching price data:', error.message);
  }
}

async function fetchAndStorePoolData() {
  try {
    console.log(`Pool data saved`);
  } catch (error) {
    console.error('Error fetching pool data:', error.message);
  }
}

export { fetchAndStoreAPY, fetchAndStorePrices, fetchAndStorePoolData };
