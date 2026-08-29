import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getMe: () => api.get('/auth/me')
};

const predictions = {
  create: (data) => api.post('/predictions', data),
  getById: (id) => api.get(`/predictions/${id}`),
  getHistory: () => api.get('/predictions/history')
};

const model = {
  getInfo: () => api.get('/model/info'),
  getMetrics: () => api.get('/model/metrics'),
  getFeatures: () => api.get('/model/features')
};

const admin = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStatistics: () => api.get('/admin/statistics'),
  getUsers: () => api.get('/admin/users')
};

export default { auth, predictions, model, admin, _axios: api };
