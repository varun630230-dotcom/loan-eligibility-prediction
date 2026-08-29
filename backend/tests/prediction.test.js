const request = require('supertest');
const app = require('../src/app');
const { User, sequelize } = require('../src/models');
const mlService = require('../src/services/mlService');

jest.mock('../src/services/mlService');

describe('Prediction Endpoints', () => {
  let userToken;
  let userId;

  beforeEach(async () => {
    await sequelize.sync({ force: true });

    // Create user and get token
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Applicant User',
        email: 'applicant@example.com',
        password: 'password123'
      });

    userToken = res.body.data.token;
    userId = res.body.data.user.id;

    // Default mock implementation
    mlService.predict.mockResolvedValue({
      prediction: 'Likely Eligible',
      probability: 0.88,
      model: 'XGBoost_Tuned',
      message: 'High likelihood of eligibility',
      underwriting: { dtiRatio: 32.5, ltvRatio: 75.0 }
    });

    mlService.explain.mockResolvedValue({
      prediction: 'Likely Eligible',
      probability: 0.88,
      shap_values: [
        { feature: 'CreditScore', value: 740, shap_value: 0.45 },
        { feature: 'DTI_Ratio', value: 0.32, shap_value: 0.35 }
      ],
      positive_contributors: [{ feature: 'CreditScore', value: 740, shap_value: 0.45 }],
      negative_contributors: [],
      base_value: 0.5
    });
  });

  const validApplication = {
    income: 6500,
    coApplicantIncome: 2000,
    existingMonthlyDebt: 600,
    totalAssetValue: 80000,
    loanAmount: 250000,
    loanTerm: 360,
    loanPurpose: 'Home',
    propertyValue: 320000,
    creditScore: 740,
    creditHistory: 1,
    activeLoansCount: 1,
    education: 'Graduate',
    employmentType: 'Salaried',
    workExperienceYears: 5,
    dependents: '0',
    propertyArea: 'Urban',
    married: 'Yes'
  };

  describe('POST /api/predictions', () => {
    it('should create an applicant, call ML service, and save prediction with explanations', async () => {
      const res = await request(app)
        .post('/api/predictions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validApplication);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prediction).toBe('Likely Eligible');
      expect(parseFloat(res.body.data.probability)).toBe(0.88);
      expect(res.body.data.Applicant).toBeDefined();
      expect(res.body.data.PredictionExplanations).toHaveLength(2);
      expect(mlService.predict).toHaveBeenCalledTimes(1);
    });

    it('should reject application with invalid loan terms', async () => {
      const invalidApp = { ...validApplication, loanTerm: 999 }; // Invalid term
      const res = await request(app)
        .post('/api/predictions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidApp);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/predictions/history', () => {
    it('should return user prediction history', async () => {
      await request(app)
        .post('/api/predictions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validApplication);

      const res = await request(app)
        .get('/api/predictions/history')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
      expect(res.body.data.rows).toHaveLength(1);
    });
  });
});
