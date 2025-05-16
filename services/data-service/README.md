# Data Service

The Data Service is a backend component of the application that fetches, processes, and stores financial data related to staking APY, token prices, and liquidity pool metrics. It provides this data via RESTful API endpoints for use in simulations and user-facing displays.

## Features

- Fetches data from DeFi Llama (APY/TVL), CoinGecko (prices), and Uniswap Subgraph (pool metrics).
- Processes data by formatting, deduplicating, trimming, and filling missing entries.
- Stores data in a TimescaleDB database using Sequelize ORM.
- Exposes data through RESTful API endpoints.
- Runs daily data updates via a cron job.

## Architecture

Built with Node.js and Express, the service is modular:

- **`app.js`**: Main entry point; sets up the Express server, cron job, and database connection.
- **`fetcher.js`**: Retrieves data from external APIs with retry logic.
- **`processor.js`**: Formats, cleans, and enriches fetched data.
- **`saver.js`**: Saves processed data to the database, handling duplicates.
- **`handler.js`**: Orchestrates fetching, processing, and saving.
- **`dataRoutes.js`**: Defines API endpoints for data access.
- **`pools.js`**: Configures pool IDs and addresses.

## Prerequisites

- Node.js v14+ (for ES module support)
- TimescaleDB database
- npm for package management

## API Endpoints

Base path: `/api/data`

- **GET `/apy-history`**  
  Retrieves staking APY history.

  - Query Params:
    - `start` (optional): ISO date (e.g., "2023-01-01")
    - `end` (optional): ISO date (e.g., "2023-12-31")
  - Response: `{ apyHistory: [{ timestamp, apy_percentage }, ...] }`

- **GET `/pools`**  
  Retrieves available liquidity pools.

  - Response: `{ pools: [{ pool_address, token0_symbol, token1_symbol }, ...] }`

- **GET `/pool`**  
  Retrieves historical data for a pool.

  - Query Params:
    - `address`: Pool address (required)
    - `start` (optional): ISO date
    - `end` (optional): ISO date
  - Response: `{ poolData: [{ timestamp, pool_address, tvl_usd, volume_24h_usd, fees_24h_usd }, ...] }`

- **GET `/price-history`**  
  Retrieves token price history.
  - Query Params:
    - `token`: Token symbol (e.g., "WETH", required)
    - `start` (optional): ISO date
    - `end` (optional): ISO date
  - Response: `{ priceData: [{ timestamp, token_symbol, price_usd }, ...] }`

## Data Flow

1. **Fetch**: Data is retrieved from external APIs.
2. **Process**: Data is formatted, deduplicated, trimmed to 365 days, and missing dates are filled with simulated values.
3. **Save**: Processed data is stored in TimescaleDB.
4. **Serve**: Data is available via API endpoints.

## Database Models

The service uses the following Sequelize models to interact with the TimescaleDB database:

- **`ETHStakingHistorical`**: Stores historical staking APY data with fields `timestamp` (DATE, primary key) and `apy_percentage` (DECIMAL(5,2)).
- **`TokenPrice`**: Stores historical token prices with fields `timestamp` (DATE, primary key), `token_symbol` (TEXT, primary key, references `tokens`), and `price_usd` (DECIMAL(18,6)).
- **`LPHistorical`**: Stores historical liquidity pool metrics with fields `timestamp` (DATE, primary key), `pool_address` (TEXT, primary key, references `pools`), `tvl_usd` (DECIMAL(18,6)), `volume_24h_usd` (DECIMAL(18,6)), and `fees_24h_usd` (DECIMAL(18,6)).
- **`Pool`**: Stores pool metadata with fields `pool_address` (TEXT, primary key), `token0_symbol` (TEXT, references `tokens`), and `token1_symbol` (TEXT, references `tokens`).
- **`Token`**: Stores token metadata with field `token_symbol` (TEXT, primary key).

**Model Associations:**

- A `Pool` belongs to two `Token` models (`token0` and `token1`) via `token0_symbol` and `token1_symbol`.
- A `Token` can be associated with multiple `Pool` models (as `poolsAsToken0` or `poolsAsToken1`).
- A `TokenPrice` belongs to a `Token` via `token_symbol`.
- A `Token` has many `TokenPrice` entries.
- An `LPHistorical` belongs to a `Pool` via `pool_address`.
- A `Pool` has many `LPHistorical` entries.

These associations enable efficient querying of related data.

## Reliability

The service uses a retry mechanism with exponential backoff (implemented in `retry.js`) to handle transient errors during API calls. By default, it retries up to 3 times with an initial delay of 1 second, doubling the delay between attempts. This ensures robustness against temporary network issues or API rate limits.

## Monitoring

- HTTP requests are logged via Morgan in `dev` mode.
- Console logs track data fetching, processing, and errors.

## Testing

The service uses Jest for unit and integration testing to ensure reliability and maintainability. The test suite includes:

- Data fetching from external APIs, including error handling and retry logic.
- Data processing and validation, ensuring correct formatting and cleaning.
- Data saving to the database, handling duplicates and constraints.
- API routes and error handling, verifying endpoint responses.
- Core application logic, including startup and error handling.

Run the tests with:

```bash
npm test
```

## Notes

- The cron job runs daily at 1 AM UTC (`0 1 * * *`).
- In `test` mode (`NODE_ENV=test`), the cron job and server do not auto-start.
- Additional files may expand functionality; this README will be updated accordingly.
