import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ==================== AUTH ====================
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh')
};

// ==================== DELIVERIES ====================
export const deliveriesApi = {
  getAll: (status) => api.get('/deliveries', { params: status ? { status } : {} }),
  getOne: (trackingId) => api.get(`/deliveries/${trackingId}`),
  create: (data) => api.post('/deliveries', data),
  update: (trackingId, data) => api.patch(`/deliveries/${trackingId}`, data),
  assignDriver: (trackingId, driverId) => 
    api.post(`/deliveries/${trackingId}/assign`, `driver_id=${driverId}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }),
  updateGps: (trackingId, lat, lng) => 
    api.post(`/deliveries/${trackingId}/gps`, `lat=${lat}&lng=${lng}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
};

// ==================== INVOICES ====================
export const invoicesApi = {
  getAll: () => api.get('/invoices'),
  create: (data) => api.post('/invoices', data),
  markPaid: (invoiceId) => api.patch(`/invoices/${invoiceId}/pay`)
};

// ==================== ADMIN DRIVER MANAGEMENT ====================
export const adminDriversApi = {
  getAll: () => api.get('/admin/drivers'),
  create: (data) => api.post('/admin/drivers', data),
  delete: (driverId) => api.delete(`/admin/drivers/${driverId}`)
};

// ==================== SUBSCRIPTIONS ====================
export const subscriptionApi = {
  getPlans: () => api.get('/subscription/plans'),
  getCurrent: () => api.get('/subscription/current'),
  update: (data) => api.post('/subscription/update', data)
};

// ==================== NOTIFICATIONS ====================
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: () => api.post('/notifications/mark-read')
};

// ==================== DAMAGE REPORTS ====================
export const damageReportsApi = {
  getAll: () => api.get('/damage-reports'),
  create: (data) => api.post('/damage-reports', data)
};

// ==================== ECO SCORES ====================
export const ecoScoresApi = {
  getAll: (driverId) => api.get('/eco-scores', { params: driverId ? { driver_id: driverId } : {} }),
  update: (data) => api.post('/eco-scores', data),
  getSummary: () => api.get('/eco-scores/summary')
};

// ==================== DASHBOARD ====================
export const dashboardApi = {
  getCashFlow: () => api.get('/dashboard/cash-flow'),
  getStats: () => api.get('/dashboard/stats')
};

// ==================== DRIVERS ====================
export const driversApi = {
  getAll: () => api.get('/drivers')
};

// ==================== SYNC ====================
export const syncApi = {
  sync: (data) => api.post('/sync', data)
};

// ==================== PUBLIC TRACKING ====================
export const trackingApi = {
  track: (trackingId) => api.get(`/track/${trackingId}`)
};

export default api;
