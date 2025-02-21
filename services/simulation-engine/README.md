# Simulation Engine

## Purpose:
The Simulation Engine executes the core simulation logic, processing user inputs and historical data to generate detailed results for ETH staking and liquidity pool farming. It handles complex calculations like reward compounding and impermanent loss, delivering results in a format suitable for display.

## Functions:

### Simulation Execution:
- ETH Staking:
  - Accepts inputs: ETH amount, duration, start date, and compounding option.
  - Retrieves historical APY data from the Data Service for the specified period.
  - Calculates total ETH rewards (with optional compounding), USD value of rewards (using historical prices), and final principal + rewards values.
  - Generates time-series data for graphs (rewards, total value, APY).

- Liquidity Pools:
  - Accepts inputs: investment amount, duration, and pool ID.
  - Retrieves historical price, volume, and fee data from the Data Service.
  - Calculates fee rewards (USD and token amounts), total P/L, and impermanent loss.
  - Generates time-series data for graphs (impermanent loss in USD and %, LP vs. HODL values).

### API Endpoints:
- `/simulate/staking`: Runs an ETH staking simulation and returns results.
- `/simulate/pool`: Runs a liquidity pool simulation and returns results.
- Results include raw values (e.g., total rewards) and time-series data for graphing.

### Result Handling:
- Returns results directly to the Frontend via the API Gateway without persistent storage, as comparisons are in-session per the user stories.
