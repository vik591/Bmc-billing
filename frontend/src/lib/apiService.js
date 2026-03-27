import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AUTH
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// CUSTOMERS
export const customersApiService = {
  getAll: () => api.get('/customers'),
};

// PRODUCTS
export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
};

// PRODUCT BILLS
export const productBillsAPI = {
  getAll: () => api.get('/product-bills'),
  create: (data) => api.post('/product-bills', data),
};

// EMI
export const emiAPI = {
  getAll: () => api.get('/emi'),
};

// DASHBOARD
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),};

// REPAIR BILLS
export const repairBillsAPI = {
 getAll: () => api.get('/repair-bills'),
};

// PURCHASES
export const purchasesAPI = {
  getAll: () => api.get('/purchases'),
};

// SETTINGS
export const settingsAPI = {
  get: () => api.get('/settings'),
};

// USERS
export const usersAPI = {
  getAll: () => api.get('/users'),
};

export default api;