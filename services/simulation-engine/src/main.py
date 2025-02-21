from fastapi import FastAPI
from src.simulation_controller import router as simulation_router

app = FastAPI(
  title='DeFi Simulator - Simulation Engine',
  description='Microservice for running yield farming simulations.',
  version='1.0.0'
)

app.include_router(simulation_router, prefix='/api')

if __name__ == '__main__':
  import uvicorn
  uvicorn.run(app, host='0.0.0.0', port=8000)
