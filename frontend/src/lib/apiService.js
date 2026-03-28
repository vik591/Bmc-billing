import axios from "axios";

// ✅ API URL (fallback bhi diya hai)
const API_URL =
  (process.env.REACT_APP_API_URL || "https://bmc-billing.onrender.com") + "/api";
console.log("API URL:", API_URL);

// ✅ Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor (token bhejne ke liye)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor (error dekhne ke liye)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ================= AUTH =================
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
};

// ================= CUSTOMERS =================
export const customersApiService = {
  getAll: () => api.get("/customers"),
};

// ================= PRODUCTS =================
export const productsAPI = {
  getAll: () => api.get("/products"),
  create: (data) => api.post("/products", data),

  // ✅ SEARCH
  search: (query) => api.get(`/products/search?q=${query}`),
};

// ================= PRODUCT BILLS =================
export const productBillsAPI = {
  getAll: () => api.get("/product-bills"),
getById: (id) => api.get(`/product-bills/${id}`),
  create: (data) => api.post("/product-bills", data),

};

// ================= EMI =================
export const emiAPI = {
  getAll: () => api.get("/emi"),
};

// ================= DASHBOARD =================
export const dashboardAPI = {
   getStats: () => api.get('/dashboard/stats'),
};

// ================= REPAIR =================
export const repairBillsAPI = {
  getAll: () => api.get("/repair-bills"),
};

// ================= PURCHASES =================
export const purchasesAPI = {
  getAll: () => api.get("/purchases"),
};

// ================= REPORTS =================
export const reportsAPI = {
  getAll: () => api.get("/reports"),
};

// ================= SETTINGS =================
export const settingsAPI = {
  get: () => api.get("/settings"),
};

// ================= USERS =================
export const usersAPI = {
  getAll: () => api.get("/users"),
};

export default api;