const { User } = require('../models');
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
