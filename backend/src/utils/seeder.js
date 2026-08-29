const bcrypt = require('bcryptjs');
const { User, ModelMetric } = require('../models');
const logger = require('./logger');

const seedDatabase = async () => {
  try {
    const userCount = await User.count();
    if (userCount === 0) {
      logger.info('Seeding database with default admin, demo user, and model metrics...');

      const adminHash = await bcrypt.hash('admin123', 10);
      const demoHash = await bcrypt.hash('demo123', 10);

      // Create Admin User (using raw bulk create or hook bypass to store exact hash)
      await User.bulkCreate([
        {
          name: 'Admin',
          email: 'admin@loanwise.com',
          passwordHash: adminHash,
          role: 'admin'
        },
        {
          name: 'Demo User',
          email: 'demo@loanwise.com',
          passwordHash: demoHash,
          role: 'user'
        }
      ]);

      // Create initial model metrics
      await ModelMetric.bulkCreate([
        {
          modelName: 'Logistic Regression',
          accuracy: 0.9840,
          precisionScore: 0.9886,
          recallVal: 0.9931,
          f1Score: 0.9908,
          rocAuc: 0.9734,
          isBestModel: false
        },
        {
          modelName: 'Decision Tree',
          accuracy: 0.9850,
          precisionScore: 0.9853,
          recallVal: 0.9977,
          f1Score: 0.9914,
          rocAuc: 0.9423,
          isBestModel: false
        },
        {
          modelName: 'Random Forest',
          accuracy: 0.9860,
          precisionScore: 0.9864,
          recallVal: 0.9977,
          f1Score: 0.9920,
          rocAuc: 0.9679,
          isBestModel: false
        },
        {
          modelName: 'Gradient Boosting',
          accuracy: 0.9830,
          precisionScore: 0.9875,
          recallVal: 0.9931,
          f1Score: 0.9903,
          rocAuc: 0.9652,
          isBestModel: false
        },
        {
          modelName: 'XGBoost (Tuned)',
          accuracy: 0.9860,
          precisionScore: 0.9853,
          recallVal: 0.9988,
          f1Score: 0.9921,
          rocAuc: 0.9644,
          isBestModel: true
        }
      ]);

      logger.info('Database seeded successfully.');
    }
  } catch (error) {
    logger.warn('Database seeding notice:', error.message);
  }
};

module.exports = seedDatabase;
