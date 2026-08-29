require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const logger = require('./src/utils/logger');
const env = require('./src/config/env');
const seedDatabase = require('./src/utils/seeder');

const PORT = env.port || 5000;

async function startServer() {
  try {
    await sequelize.sync();
    logger.info('Database synchronized successfully.');

    // Seed initial users and metrics if empty
    await seedDatabase();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${env.nodeEnv} mode.`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully.');
      server.close(async () => {
        logger.info('HTTP server closed.');
        await sequelize.close();
        logger.info('Database connection closed.');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Unable to start the server:', error);
    process.exit(1);
  }
}

startServer();
