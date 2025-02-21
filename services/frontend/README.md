# Frontend

## Purpose:
The Frontend serves as the user interface, enabling interaction with the simulator app. It presents information, collects user inputs, and displays simulation results, including interactive graphs, in a visually appealing and intuitive manner.

## Functions:

### Home Page:
- Displays a detailed explanation of the project’s purpose and the available simulations (ETH staking and liquidity pool farming).
- Provides a menu bar for navigation to the ETH Staking and Liquidity Pools pages.

### ETH Staking Page:
- Shows the current ETH staking APY and a graph of APY over the last year with cursor tracking.
- Offers input fields for users to specify the amount of ETH to stake, staking duration, starting date, and an optional checkbox for compounding rewards.
- After a simulation, displays total ETH rewards, USD value of rewards, total ETH and USD values at the period’s end, and graphs for rewards, total value growth, and APY over the staking period.
- Allows users to run multiple simulations and compare results side-by-side within the same session.

### Liquidity Pools Page:
- Lists available pools with TVL, 24H volume, 24H fees, and APR.
- On a specific pool’s page, shows TVL, 24H volume, 24H fees, and a graph of volume over a specified period with cursor tracking displaying corresponding fees.
- Provides inputs for investment amount and duration to simulate fee rewards, total P/L, and impermanent loss.
- Post-simulation, displays total fee rewards (USD and token amounts), total P/L, a graph of impermanent loss (USD and percentage), and a graph comparing LP to HODL values.
