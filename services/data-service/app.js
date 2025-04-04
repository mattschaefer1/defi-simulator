import express from 'express';
import cron from 'node-cron';
import morgan from 'morgan';
import dataRoutes from './src/routes/dataRoutes.js';
import { sequelize, models } from './src/models/index.js';
import dataHandler from './src/handlers/dataHandler.js';
import retry from './src/utils/retry.js';

const app = express();
const PORT = process.env.DATA_SERVICE_PORT || 3001;

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Make models available to routes
app.locals.models = models;

// Database connection with retry logic
const connectToDatabase = async () => {
  await retry(
    async () => {
      await sequelize.authenticate();
      console.log('Connected to TimescaleDB');
    },
    { verbose: true, retries: 5, initialDelay: 5000 },
  );
};

// Routes
app.use('/api/data', dataRoutes);

// Fetch and save data to database (Daily at 1:00 AM UTC)
let isRunning = false;
cron.schedule(
  '0 1 * * *',
  async () => {
    if (isRunning) {
      console.log('Previous run still in progress, skipping...');
      return;
    }

    isRunning = true;
    const startTime = Date.now();
    console.log(
      `Starting data fetch at ${new Date(startTime).toISOString()}...`,
    );

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
  },
  {
    scheduled: true,
    timezone: 'Etc/UTC',
  },
);

// Error handling middleware
app.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Start the server with seeding
async function startServer() {
  try {
    // Connect to database with retry logic
    await connectToDatabase();

    // Ensure database schema is synced
    await sequelize.sync();
    console.log('Database schema synced');

    // Check if the database is empty
    if (
      !app.locals.models?.ETHStakingHistorical ||
      !app.locals.models?.TokenPrice ||
      !app.locals.models?.LPHistorical
    ) {
      throw new Error('Database models are not available');
    }
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

    // Start the server
    app.listen(PORT, () => {
      console.log(`Data Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error during startup:', error);
    process.exit(1);
  }
}

// Initiate server startup
startServer();
