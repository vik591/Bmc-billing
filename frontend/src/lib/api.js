import axios from 'axios';

// correct for VITE
const API_URL = import.meta.env.VITE_API_URL + '/api';

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

//  AUTH
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

//  CUSTOMERS (IMPORTANT)
export const customersAPI = {
  getAll: () => api.get('/customers'),
};

// PRODUCTS
export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
};

// EMI
export const emiAPI = {
  getAll: () => api.get('/emi'),
};

export default api;