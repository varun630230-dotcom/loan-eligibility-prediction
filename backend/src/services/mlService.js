const axios = require('axios');
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
