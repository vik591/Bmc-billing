import axios from 'axios';

console.log("ENV:", import.meta.env.VITE_API_URL);

const API_URL = import.meta.env.VITE_API_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Token attach
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ AUTH
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ✅ PRODUCTS
export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
};

// ✅ CUSTOMERS
export const customersAPI = {
  getAll: () => api.get('/customers'),
};

// ✅ EMI
export const emiAPI = {
  getAll: () => api.get('/emi'),
};

// ✅ REPORTS
export const reportsAPI = {
  getSales: (period) => api.get(`/reports/sales?period=${period}`),
};

export default api;