from src.models import StakingPool

def run_staking_simulation(pool: StakingPool, amount_staked: float, duration_days: int) -> dict:
  daily_rate = (pool.apy / 100) / 365
  earnings = amount_staked * daily_rate * duration_days
  return {
    'pool_id': pool.id,
    'pool_name': pool.name,
    'amount_staked': amount_staked,
    'duration_days': duration_days,
    'earnings': round(earnings, 2)
  }
