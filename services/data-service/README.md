# Data Service

## Purpose:
The Data Service manages all data-related operations, including fetching historical data from external APIs, storing it in the database, and providing it to the Frontend and Simulation Engine. It ensures that simulations and displays rely on accurate, up-to-date data.

## Functions:

### Data Fetching:
- Periodically retrieves historical data from external APIs, such as:
  - ETH staking APYs.
  - Token prices.
  - Liquidity pool data (TVL, volumes, fees).
- Runs on a schedule (e.g., hourly or daily) to keep the database current.

### Data Storage:
- Stores fetched data in a MongoDB database, organizing it for efficient retrieval (e.g., time-series collections for APYs, prices, and pool metrics).

### Data Retrieval APIs:
- Provides endpoints for the Frontend to fetch current data:
  - `/current-apy`: Returns the latest ETH staking APY.
  - `/apy-history?start=X&end=Y`: Returns APY data for a specified period.
  - `/pools`: Returns a list of pools with TVL, 24H volume, 24H fees, and APR.
  - `/pool/:id`: Returns detailed stats for a specific pool.
- Provides endpoints for the Simulation Engine to fetch historical data:
  - `/apy-history?start=X&end=Y`: Supplies APY data for staking simulations.
  - `/price-history?token=A&start=X&end=Y`: Supplies price data for impermanent loss and P/L calculations.
  - `/pool-history?id=Z&start=X&end=Y`: Supplies volume and fee data for pool simulations.
