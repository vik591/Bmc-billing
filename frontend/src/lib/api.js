import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

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

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  search: (query) => api.get(`/products/search?q=${query}`),
  getLowStock: () => api.get('/products/low-stock'),
};

export const productBillsAPI = {
  getAll: () => api.get('/product-bills'),
  create: (data) => api.post('/product-bills', data),
  getById: (id) => api.get(`/product-bills/${id}`),
};

export const repairBillsAPI = {
  getAll: () => api.get('/repair-bills'),
  create: (data) => api.post('/repair-bills', data),
  updateStatus: (id, status) => api.put(`/repair-bills/${id}/status?delivery_status=${status}`),
  addPayment: (id, amount) => api.put(`/repair-bills/${id}/payment?payment_amount=${amount}`),
};

export const customersAPI = {
  getAll: () => api.get('/customers'),
  getHistory: (phone) => api.get(`/customers/${phone}/history`),
};

export const emiAPI = {
  getAll: () => api.get('/emi'),
  create: (data) => api.post('/emi', data),
  addPayment: (data) => api.post('/emi/payment', data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const reportsAPI = {
  getSales: (period) => api.get(`/reports/sales?period=${period}`),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

export const purchasesAPI = {
  getAll: () => api.get('/purchases'),
  create: (data) => api.post('/purchases', data),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;