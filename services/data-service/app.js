import express from 'express';
import cron from 'node-cron';
import morgan from 'morgan';
import dataRoutes from './src/routes/dataRoutes.js';
import dataHandler from './src/data/handler.js';
import retry from './src/utils/retry.js';

const app = express();
const PORT = process.env.DATA_SERVICE_PORT || 3001;

app.use(express.json());
app.use(morgan('dev'));

app.use('/api/data', dataRoutes);

let isRunning = false;
let cronJob;
let server;

export async function runDataFetch() {
  if (isRunning) {
    console.log('Previous run still in progress, skipping...');
    return;
  }

  isRunning = true;
  const startTime = Date.now();
  console.log(`Starting data fetch at ${new Date(startTime).toISOString()}...`);

  try {
    await dataHandler(app);
    const endTime = Date.now();
    console.log(
      `Data fetch completed successfully in ${(endTime - startTime) / 1000} seconds.`,
    );
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    isRunning = false;
  }
}

if (process.env.NODE_ENV !== 'test') {
  cronJob = cron.schedule('0 1 * * *', runDataFetch, {
    scheduled: true,
    timezone: 'Etc/UTC',
  });
}

export function errorHandler(err, req, res) {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
}

app.use(errorHandler);

export function validateModels(models) {
  if (
    !models ||
    !models.ETHStakingHistorical ||
    !models.TokenPrice ||
    !models.LPHistorical
  ) {
    throw new Error('Database models are not available');
  }
  return true;
}

export async function startServer() {
  try {
    const { default: initializeModels } = await import('./src/models/index.js');
    const { sequelize, models } = await initializeModels();
    app.locals.sequelize = sequelize;
    app.locals.models = models;

    await retry(
      async () => {
        await sequelize.authenticate();
        console.log('Connected to TimescaleDB');
      },
      { verbose: true, retries: 5, initialDelay: 5000 },
    );

    await sequelize.sync();
    console.log('Database schema synced');

    validateModels(app.locals.models);

    const ethCount = await app.locals.models.ETHStakingHistorical.count();
    const priceCount = await app.locals.models.TokenPrice.count();
    const lpCount = await app.locals.models.LPHistorical.count();

    if (ethCount === 0 || priceCount === 0 || lpCount === 0) {
      console.log(
        'Database is empty or partially seeded, seeding historical data...',
      );
      const startTime = Date.now();
      await dataHandler(app);
      const endTime = Date.now();
      console.log(
        `Database seeded successfully in ${(endTime - startTime) / 1000} seconds`,
      );
    } else {
      console.log('Database already contains data, skipping seeding');
    }

    server = app.listen(PORT, () => {
      console.log(`Data Service running on port ${PORT}`);
    });

    return server;
  } catch (error) {
    console.error('Error during startup:', error);
    throw error;
  }
}

export function stopServer() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }

  if (server) {
    server.close();
    server = null;
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
