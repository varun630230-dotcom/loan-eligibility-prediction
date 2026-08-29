const { Sequelize } = require('sequelize');
const env = require('./env');

let sequelize;

if (env.nodeEnv === 'test') {
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false
  });
} else if (process.env.DB_DIALECT === 'sqlite' || !process.env.DB_HOST) {
  // Use SQLite for zero-config local run
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './loanwise.sqlite',
    logging: false
  });
} else {
  // MySQL for production / configured instances
  sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
    host: env.dbHost,
    port: env.dbPort,
    dialect: 'mysql',
    logging: env.nodeEnv === 'production' ? false : console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

module.exports = sequelize;
