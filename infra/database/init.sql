-- Create the database
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'defi_simulator') THEN
    CREATE DATABASE defi_simulator;
  END IF;
END $$;

-- Connect to the defi_simulator database
\c defi_simulator

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create tables
CREATE TABLE tokens (
  token_symbol TEXT PRIMARY KEY
);

CREATE TABLE pools (
  pool_address TEXT PRIMARY KEY,
  token0_symbol TEXT REFERENCES tokens(token_symbol),
  token1_symbol TEXT REFERENCES tokens(token_symbol)
);

CREATE TABLE token_prices (
  timestamp TIMESTAMPTZ NOT NULL,
  token_symbol TEXT REFERENCES tokens(token_symbol),
  price_usd NUMERIC NOT NULL,
  PRIMARY KEY (timestamp, token_symbol)
);

CREATE TABLE lp_historical (
  timestamp TIMESTAMPTZ NOT NULL,
  pool_address TEXT REFERENCES pools(pool_address),
  tvl_usd NUMERIC,
  volume_24h_usd NUMERIC,
  fees_24h_usd NUMERIC,
  PRIMARY KEY (timestamp, pool_address)
);

CREATE TABLE eth_staking_historical (
  timestamp TIMESTAMPTZ PRIMARY KEY,
  apy_percentage NUMERIC
);

-- Convert tables to hypertables
SELECT create_hypertable('token_prices', by_range('timestamp', INTERVAL '1 month'));
SELECT add_dimension('token_prices', by_hash('token_symbol', 4));
SELECT create_hypertable('lp_historical', by_range('timestamp', INTERVAL '1 month'));
SELECT add_dimension('lp_historical', by_hash('pool_address', 4));
SELECT create_hypertable('eth_staking_historical', by_range('timestamp', INTERVAL '1 month'));

-- Insert initial token data
INSERT INTO tokens (token_symbol) VALUES
  ('WETH'),
  ('USDC'),
  ('DAI'),
  ('WBTC');

-- Insert initial pool data
INSERT INTO pools (pool_address, token0_symbol, token1_symbol) VALUES
  ('0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', 'USDC', 'WETH'),
  ('0x99ac8ca7087fa4a2a1fb6357269965a2014abc35', 'WBTC', 'USDC'),
  ('0xcbcdf9626bc03e24f779434178a73a0b4bad62ed', 'WBTC', 'WETH'),
  ('0x5777d92f208679db4b9778590fa3cab3ac9e2168', 'DAI', 'USDC');