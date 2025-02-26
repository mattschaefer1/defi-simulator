import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import dataRoutes from './src/routes/dataRoutes.js';
import { sequelize, models } from './src/models/index.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the defi-simulator root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.DATA_SERVICE_PORT || 3001;

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Database connection test
sequelize.authenticate()
  .then(() => console.log('Connected to TimescaleDB'))
  .catch(err => console.error('TimescaleDB connection error:', err));

// Make models available to routes
app.locals.models = models;

// Routes
app.use('/api/data', dataRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Data Service running on port ${PORT}`);
});
