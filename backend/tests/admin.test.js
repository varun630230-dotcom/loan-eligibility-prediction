const request = require('supertest');
const app = require('../src/app');
const { User, sequelize } = require('../src/models');

describe('Admin Endpoints', () => {
  let userToken;
  let adminToken;

  beforeEach(async () => {
    await sequelize.sync({ force: true });

    // Standard User
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'password123'
      });
    userToken = userRes.body.data.token;

    // Admin User
    const adminUser = await User.create({
      name: 'Admin Boss',
      email: 'admin@example.com',
      passwordHash: 'adminpassword123',
      role: 'admin'
    });

    const jwt = require('jsonwebtoken');
    const env = require('../src/config/env');
    adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: 'admin' },
      env.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  describe('Role-based access control', () => {
    it('should deny non-admin users access to /api/admin/dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin user access to /api/admin/dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBeDefined();
    });

    it('should return users list to admin', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
