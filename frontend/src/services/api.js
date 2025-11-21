import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 секунд
});

// Добавление Telegram initData к каждому запросу
api.interceptors.request.use((config) => {
  const initData = window.Telegram?.WebApp?.initData;
  if (initData) {
    config.headers['x-telegram-init-data'] = initData;
  }
  return config;
});

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ===============================================
// API МЕТОДЫ
// ===============================================

export const authAPI = {
  validate: () => api.post('/auth/validate'),
  getMe: () => api.get('/auth/me')
};

export const foodAPI = {
  analyze: (formData) => api.post('/food/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000 // 60 секунд для AI анализа
  })
};

export const mealAPI = {
  add: (mealData) => api.post('/meal/add', mealData),
  getDay: (date) => api.get('/meal/day', { params: { date } }),
  getList: (limit = 50, offset = 0) => api.get('/meal/list', { 
    params: { limit, offset } 
  }),
  delete: (id) => api.delete(`/meal/${id}`)
};

export const compositionAPI = {
  analyze: (formData) => api.post('/composition/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000 // 60 секунд для OCR
  }),
  getHistory: (limit = 20) => api.get('/composition/history', { 
    params: { limit } 
  })
};

export const recommendationsAPI = {
  get: () => api.get('/recommendations'),
  getWeekPlan: () => api.get('/recommendations/week-plan'),
  getDailyPlan: () => api.get('/recommendations/daily-plan')
};

export const profileAPI = {
  update: (data) => api.put('/profile/update', data),
  getMe: () => api.get('/profile/me'),
  getTDEE: () => api.get('/profile/tdee')
};

export const wearablesAPI = {
  sync: (data) => api.post('/wearables/sync', data),
  getData: (days = 7) => api.get('/wearables/data', { params: { days } }),
  getLatest: () => api.get('/wearables/latest')
};

export default api;
