from pydantic import BaseModel

class Token(BaseModel):
  name: str

class StakingPool(BaseModel):
  id: int
  token: Token
  name: str
  apy: float
