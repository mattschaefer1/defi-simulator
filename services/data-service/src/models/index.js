import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the defi-simulator root directory
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  protocol: 'postgres'
});

// Import models
import Token from './token.js';
import Pool from './pool.js';
import TokenPrice from './tokenPrice.js';
import LPHistorical from './lpHistorical.js';
import ETHStakingHistorical from './ethStakingHistorical.js';

// Initialize models
const models = {
  Token: Token.init(sequelize),
  Pool: Pool.init(sequelize),
  TokenPrice: TokenPrice.init(sequelize),
  LPHistorical: LPHistorical.init(sequelize),
  ETHStakingHistorical: ETHStakingHistorical.init(sequelize)
};

// TODO: Define associations

export { sequelize, models };
