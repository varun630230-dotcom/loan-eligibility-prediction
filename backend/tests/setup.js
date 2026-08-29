process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-123456';
process.env.JWT_EXPIRES_IN = '1h';

const { sequelize } = require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
