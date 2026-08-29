import os

base_dir = r"C:\Users\varun\.gemini\antigravity\scratch\loan-eligibility-system\backend"

files = {
"package.json": """{
  "name": "loanwise-backend",
  "version": "1.0.0",
  "description": "LoanWise API Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --coverage --forceExit"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.35.2",
    "mysql2": "^3.7.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "axios": "^1.6.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.4",
    "joi": "^17.11.0",
    "dotenv": "^16.3.1",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "nodemon": "^3.0.2",
    "sequelize-test-helpers": "^1.4.3",
    "sqlite3": "^5.1.7"
  }
}
""",

"server.js": """require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const logger = require('./src/utils/logger');
const env = require('./src/config/env');

const PORT = env.port || 5000;

async function startServer() {
  try {
    await sequelize.sync();
    logger.info('Database synchronized successfully.');

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
""",

"src/app.js": """const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const applicantRoutes = require('./routes/applicantRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const modelRoutes = require('./routes/modelRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors({ origin: env.frontendUrl }));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/applicants', applicantRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/model', modelRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;
""",

"src/config/database.js": """const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
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

module.exports = sequelize;
""",

"src/config/env.js": """require('dotenv').config();

const env = {
  port: process.env.PORT || 5000,
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: process.env.DB_PORT || 3306,
  dbName: process.env.DB_NAME || 'loanwise',
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || 'password',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = env;
""",

"src/models/User.js": """const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
        }
      }
    }
  });

  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.passwordHash);
  };

  return User;
};
""",

"src/models/Applicant.js": """const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Applicant = sequelize.define('Applicant', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, field: 'user_id' },
    income: { type: DataTypes.DECIMAL(12, 2) },
    coApplicantIncome: { type: DataTypes.DECIMAL(12, 2), field: 'co_applicant_income' },
    loanAmount: { type: DataTypes.DECIMAL(12, 2), field: 'loan_amount' },
    loanTerm: { type: DataTypes.INTEGER, field: 'loan_term' },
    creditHistory: { type: DataTypes.TINYINT, field: 'credit_history' },
    education: { type: DataTypes.STRING(50) },
    employmentStatus: { type: DataTypes.STRING(50), field: 'employment_status' },
    dependents: { type: DataTypes.STRING(10) },
    propertyArea: { type: DataTypes.STRING(50), field: 'property_area' },
    married: { type: DataTypes.STRING(10) }
  }, {
    tableName: 'applicants',
    underscored: true,
    timestamps: true
  });
  return Applicant;
};
""",

"src/models/Prediction.js": """const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Prediction = sequelize.define('Prediction', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    applicantId: { type: DataTypes.INTEGER, field: 'applicant_id' },
    userId: { type: DataTypes.INTEGER, field: 'user_id' },
    prediction: { type: DataTypes.STRING(50) },
    probability: { type: DataTypes.DECIMAL(5, 4) },
    modelName: { type: DataTypes.STRING(100), field: 'model_name' },
    modelVersion: { type: DataTypes.STRING(50), field: 'model_version' }
  }, {
    tableName: 'predictions',
    underscored: true,
    timestamps: true,
    updatedAt: false
  });
  return Prediction;
};
""",

"src/models/PredictionExplanation.js": """const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PredictionExplanation = sequelize.define('PredictionExplanation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    predictionId: { type: DataTypes.INTEGER, field: 'prediction_id' },
    featureName: { type: DataTypes.STRING(100), field: 'feature_name' },
    featureValue: { type: DataTypes.STRING(255), field: 'feature_value' },
    shapValue: { type: DataTypes.DECIMAL(10, 6), field: 'shap_value' },
    contributionType: { type: DataTypes.ENUM('positive', 'negative'), field: 'contribution_type' }
  }, {
    tableName: 'prediction_explanations',
    timestamps: false
  });
  return PredictionExplanation;
};
""",

"src/models/ModelMetric.js": """const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ModelMetric = sequelize.define('ModelMetric', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    modelName: { type: DataTypes.STRING(100), field: 'model_name' },
    accuracy: { type: DataTypes.DECIMAL(5, 4) },
    precisionScore: { type: DataTypes.DECIMAL(5, 4), field: 'precision_score' },
    recallVal: { type: DataTypes.DECIMAL(5, 4), field: 'recall_val' },
    f1Score: { type: DataTypes.DECIMAL(5, 4), field: 'f1_score' },
    rocAuc: { type: DataTypes.DECIMAL(5, 4), field: 'roc_auc' },
    isBestModel: { type: DataTypes.BOOLEAN, field: 'is_best_model', defaultValue: false },
    trainingDate: { type: DataTypes.DATE, field: 'training_date' }
  }, {
    tableName: 'model_metrics',
    timestamps: true,
    updatedAt: false,
    underscored: true
  });
  return ModelMetric;
};
""",

"src/models/index.js": """const sequelize = require('../config/database');

const User = require('./User')(sequelize);
const Applicant = require('./Applicant')(sequelize);
const Prediction = require('./Prediction')(sequelize);
const PredictionExplanation = require('./PredictionExplanation')(sequelize);
const ModelMetric = require('./ModelMetric')(sequelize);

User.hasMany(Applicant, { foreignKey: 'user_id' });
Applicant.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Prediction, { foreignKey: 'user_id' });
Prediction.belongsTo(User, { foreignKey: 'user_id' });

Applicant.hasMany(Prediction, { foreignKey: 'applicant_id' });
Prediction.belongsTo(Applicant, { foreignKey: 'applicant_id' });

Prediction.hasMany(PredictionExplanation, { foreignKey: 'prediction_id' });
PredictionExplanation.belongsTo(Prediction, { foreignKey: 'prediction_id' });

module.exports = {
  sequelize,
  User,
  Applicant,
  Prediction,
  PredictionExplanation,
  ModelMetric
};
""",

"src/middleware/auth.js": """const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No authentication token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, env.jwtSecret);
    
    req.user = decoded;
    next();
  } catch (error) {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};

module.exports = auth;
""",

"src/middleware/adminAuth.js": """const ApiError = require('../utils/apiError');

const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Access denied: Admins only'));
  }
  next();
};

module.exports = adminAuth;
""",

"src/middleware/errorHandler.js": """const logger = require('../utils/logger');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || undefined;

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = 'Validation error';
    errors = err.errors.map(e => e.message);
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (statusCode === 500) {
    logger.error(`[500] ${err.stack}`);
    if (env.nodeEnv === 'production') {
      message = 'Internal Server Error';
    }
  } else {
    logger.warn(`[${statusCode}] ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

module.exports = errorHandler;
""",

"src/middleware/validator.js": """const ApiError = require('../utils/apiError');

const validator = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      const apiErr = ApiError.badRequest('Validation failed');
      apiErr.errors = errorMessages;
      return next(apiErr);
    }
    next();
  };
};

module.exports = validator;
""",

"src/utils/apiError.js": """class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }

  static badRequest(msg) {
    return new ApiError(msg, 400);
  }

  static unauthorized(msg) {
    return new ApiError(msg, 401);
  }

  static forbidden(msg) {
    return new ApiError(msg, 403);
  }

  static notFound(msg) {
    return new ApiError(msg, 404);
  }

  static internal(msg) {
    return new ApiError(msg, 500);
  }
}

module.exports = ApiError;
""",

"src/utils/asyncHandler.js": """const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
module.exports = asyncHandler;
""",

"src/utils/logger.js": """const log = (level, msg, ...args) => {
  const timestamp = new Date().toISOString();
  console[level === 'error' ? 'error' : 'log'](`[${timestamp}] [${level.toUpperCase()}] ${msg}`, ...args);
};

module.exports = {
  info: (msg, ...args) => log('info', msg, ...args),
  warn: (msg, ...args) => log('warn', msg, ...args),
  error: (msg, ...args) => log('error', msg, ...args),
  debug: (msg, ...args) => log('debug', msg, ...args)
};
""",

"src/validators/authValidator.js": """const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };
""",

"src/validators/applicantValidator.js": """const Joi = require('joi');

const applicantSchema = Joi.object({
  income: Joi.number().min(0).required(),
  coApplicantIncome: Joi.number().min(0).default(0),
  loanAmount: Joi.number().min(1).required(),
  loanTerm: Joi.number().valid(12, 36, 60, 84, 120, 180, 240, 300, 360, 480).required(),
  creditHistory: Joi.number().valid(0, 1).required(),
  education: Joi.string().valid('Graduate', 'Not Graduate').required(),
  employmentStatus: Joi.string().valid('No', 'Yes').required(),
  dependents: Joi.string().valid('0', '1', '2', '3+').default('0'),
  propertyArea: Joi.string().valid('Urban', 'Semiurban', 'Rural').required(),
  married: Joi.string().valid('Yes', 'No').default('No')
});

module.exports = { applicantSchema };
""",

"src/controllers/authController.js": """const { User } = require('../models');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw ApiError.badRequest('Email already in use');
  }

  const user = await User.create({
    name,
    email,
    passwordHash: password
  });

  const token = generateToken(user);
  const userResp = { id: user.id, name: user.name, email: user.email, role: user.role };

  res.status(201).json({ success: true, data: { user: userResp, token } });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.validatePassword(password))) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const token = generateToken(user);
  const userResp = { id: user.id, name: user.name, email: user.email, role: user.role };

  res.json({ success: true, data: { user: userResp, token } });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['passwordHash', 'password_hash'] }
  });
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.json({ success: true, data: user });
});
""",

"src/controllers/applicantController.js": """const { Applicant, Prediction } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

exports.create = asyncHandler(async (req, res) => {
  const applicant = await Applicant.create({
    ...req.body,
    userId: req.user.id
  });
  res.status(201).json({ success: true, data: applicant });
});

exports.getById = asyncHandler(async (req, res) => {
  const applicant = await Applicant.findByPk(req.params.id, {
    include: [{ model: Prediction }]
  });

  if (!applicant) {
    throw ApiError.notFound('Applicant not found');
  }

  if (applicant.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('Access denied');
  }

  res.json({ success: true, data: applicant });
});

exports.getAll = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  const applicants = await Applicant.findAndCountAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  res.json({ success: true, data: applicants });
});
""",

"src/controllers/predictionController.js": """const { Applicant, Prediction, PredictionExplanation } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const predictionService = require('../services/predictionService');

exports.create = asyncHandler(async (req, res) => {
  const result = await predictionService.createPrediction(req.body, req.user.id);
  res.status(201).json({ success: true, data: result });
});

exports.getById = asyncHandler(async (req, res) => {
  const prediction = await Prediction.findByPk(req.params.id, {
    include: [
      { model: Applicant },
      { model: PredictionExplanation }
    ]
  });

  if (!prediction) {
    throw ApiError.notFound('Prediction not found');
  }

  if (prediction.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('Access denied');
  }

  res.json({ success: true, data: prediction });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  const predictions = await Prediction.findAndCountAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  res.json({ success: true, data: predictions });
});
""",

"src/controllers/modelController.js": """const asyncHandler = require('../utils/asyncHandler');
const { ModelMetric } = require('../models');
const mlService = require('../services/mlService');

exports.getInfo = asyncHandler(async (req, res) => {
  const info = await mlService.getModelInfo();
  res.json({ success: true, data: info });
});

exports.getMetrics = asyncHandler(async (req, res) => {
  const metrics = await ModelMetric.findAll({ order: [['trainingDate', 'DESC']] });
  res.json({ success: true, data: metrics });
});

exports.getFeatures = asyncHandler(async (req, res) => {
  const info = await mlService.getModelInfo();
  res.json({ success: true, data: info.features || [] });
});
""",

"src/controllers/adminController.js": """const { User, Applicant, Prediction, ModelMetric, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { Op } = require('sequelize');

exports.getDashboard = asyncHandler(async (req, res) => {
  const totalUsers = await User.count({ where: { role: 'user' } });
  const totalApplications = await Applicant.count();
  const totalPredictions = await Prediction.count();

  const likelyEligibleCount = await Prediction.count({
    where: { prediction: 'Likely Eligible' }
  });
  
  const approvalRate = totalPredictions > 0 ? (likelyEligibleCount / totalPredictions) * 100 : 0;
  
  const averageProbResult = await Prediction.findOne({
    attributes: [[sequelize.fn('AVG', sequelize.col('probability')), 'avgProb']]
  });
  const averageProbability = averageProbResult ? parseFloat(averageProbResult.getDataValue('avgProb')) : 0;

  const recentPredictions = await Prediction.findAll({
    limit: 10,
    order: [['createdAt', 'DESC']],
    include: [
      { model: User, attributes: ['id', 'name', 'email'] },
      { model: Applicant, attributes: ['id', 'loanAmount', 'loanTerm'] }
    ]
  });

  res.json({
    success: true,
    data: { totalUsers, totalApplications, totalPredictions, approvalRate, averageProbability, recentPredictions }
  });
});

exports.getStatistics = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const predictionTrends = await Prediction.findAll({
    attributes: [
      [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: {
      createdAt: { [Op.gte]: thirtyDaysAgo }
    },
    group: [sequelize.fn('DATE', sequelize.col('created_at'))],
    order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
  });

  const predictionDistribution = await Prediction.findAll({
    attributes: [
      'prediction',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['prediction']
  });

  const modelMetrics = await ModelMetric.findAll({ order: [['trainingDate', 'DESC']] });

  res.json({
    success: true,
    data: { predictionTrends, predictionDistribution, modelMetrics }
  });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: { exclude: ['passwordHash', 'password_hash'] },
    include: [{
      model: Prediction,
      attributes: [],
    }],
    attributes: {
      include: [
        [sequelize.fn('COUNT', sequelize.col('Predictions.id')), 'predictionCount']
      ],
      exclude: ['passwordHash', 'password_hash']
    },
    group: ['User.id'],
    order: [['createdAt', 'DESC']]
  });

  res.json({ success: true, data: users });
});
""",

"src/services/mlService.js": """const axios = require('axios');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const client = axios.create({
  baseURL: env.mlServiceUrl,
  timeout: 30000
});

const handleResponse = (response) => response.data;

const handleError = (error) => {
  logger.error('ML Service Error:', error.message);
  if (error.response) {
    throw ApiError.internal('ML Service returned an error');
  } else if (error.request) {
    throw ApiError.internal('ML Service is unreachable (timeout or connection refused)');
  } else {
    throw ApiError.internal('Unexpected error communicating with ML Service');
  }
};

exports.predict = async (data) => {
  try {
    const response = await client.post('/predict', data);
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};

exports.explain = async (data) => {
  try {
    const response = await client.post('/explain', data);
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};

exports.getModelInfo = async () => {
  try {
    const response = await client.get('/model-info');
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};

exports.getHealth = async () => {
  try {
    const response = await client.get('/health');
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};
""",

"src/services/predictionService.js": """const { sequelize, Applicant, Prediction, PredictionExplanation } = require('../models');
const mlService = require('./mlService');
const ApiError = require('../utils/apiError');

exports.createPrediction = async (applicantData, userId) => {
  const transaction = await sequelize.transaction();

  try {
    const applicant = await Applicant.create({
      ...applicantData,
      userId
    }, { transaction });

    const mlPayload = {
      ApplicantIncome: applicantData.income,
      CoapplicantIncome: applicantData.coApplicantIncome,
      LoanAmount: applicantData.loanAmount / 1000,
      Loan_Amount_Term: applicantData.loanTerm,
      Credit_History: applicantData.creditHistory,
      Education: applicantData.education,
      Self_Employed: applicantData.employmentStatus,
      Dependents: applicantData.dependents,
      Property_Area: applicantData.propertyArea,
      Married: applicantData.married
    };

    const mlResult = await mlService.predict(mlPayload);
    const explainResult = await mlService.explain(mlPayload);

    const prediction = await Prediction.create({
      applicantId: applicant.id,
      userId,
      prediction: mlResult.prediction,
      probability: mlResult.probability,
      modelName: mlResult.model_name || 'loanwise_rf',
      modelVersion: mlResult.model_version || 'v1.0'
    }, { transaction });

    if (explainResult && explainResult.explanations) {
      const explanations = explainResult.explanations.map(exp => ({
        predictionId: prediction.id,
        featureName: exp.feature,
        featureValue: exp.value.toString(),
        shapValue: exp.shap_value,
        contributionType: exp.shap_value >= 0 ? 'positive' : 'negative'
      }));

      await PredictionExplanation.bulkCreate(explanations, { transaction });
    }

    await transaction.commit();

    return await Prediction.findByPk(prediction.id, {
      include: [
        { model: Applicant },
        { model: PredictionExplanation }
      ]
    });

  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;
    throw ApiError.internal(`Prediction workflow failed: ${error.message}`);
  }
};
""",

"src/routes/authRoutes.js": """const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const validator = require('../middleware/validator');
const auth = require('../middleware/auth');

router.post('/register', validator(registerSchema), authController.register);
router.post('/login', validator(loginSchema), authController.login);
router.get('/me', auth, authController.getMe);

module.exports = router;
""",

"src/routes/applicantRoutes.js": """const express = require('express');
const router = express.Router();
const applicantController = require('../controllers/applicantController');
const { applicantSchema } = require('../validators/applicantValidator');
const validator = require('../middleware/validator');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/', validator(applicantSchema), applicantController.create);
router.get('/', applicantController.getAll);
router.get('/:id', applicantController.getById);

module.exports = router;
""",

"src/routes/predictionRoutes.js": """const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { applicantSchema } = require('../validators/applicantValidator');
const validator = require('../middleware/validator');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/', validator(applicantSchema), predictionController.create);
router.get('/history', predictionController.getHistory);
router.get('/:id', predictionController.getById);

module.exports = router;
""",

"src/routes/modelRoutes.js": """const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/info', modelController.getInfo);
router.get('/metrics', modelController.getMetrics);
router.get('/features', modelController.getFeatures);

module.exports = router;
""",

"src/routes/adminRoutes.js": """const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.use(auth, adminAuth);
router.get('/dashboard', adminController.getDashboard);
router.get('/statistics', adminController.getStatistics);
router.get('/users', adminController.getUsers);

module.exports = router;
""",

".env.example": """PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=loanwise
DB_USER=root
DB_PASSWORD=password
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
ML_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
"""
}

for filepath, content in files.items():
    full_path = os.path.join(base_dir, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Successfully generated {len(files)} files in {base_dir}")
