from fastapi import APIRouter
from pydantic import BaseModel
from src.models import Token, StakingPool
from src.simulation import run_staking_simulation

router = APIRouter()

class SimulationRequest(BaseModel):
  pool_id: int
  amount_staked: float
  duration_days: int

eth_pool = StakingPool(
  id=1,
  token=Token(name='ETH'),
  name='ETH Staking Pool',
  apy=25
)

@router.post('/simulate/staking')
def simulate_staking_yield(request: SimulationRequest):
  result = run_staking_simulation(eth_pool, request.amount_staked, request.duration_days)
  return result
