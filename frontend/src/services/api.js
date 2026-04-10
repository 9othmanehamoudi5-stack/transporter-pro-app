import axios from 'axios';
import firestoreMissions from './firebase';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 401 interceptor: attempt token refresh once, then reject (no redirect here)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s, and never retry the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Do NOT redirect here — let React ProtectedRoute handle it
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh')
};

// ==================== DELIVERIES (Hybrid: Backend + Firestore) ====================
export const deliveriesApi = {
  // Get all - from backend (primary), sync to Firestore
  getAll: async (status) => {
    try {
      // Always use backend as source of truth
      const response = await api.get('/deliveries', { params: status ? { status } : {} });
      return response;
    } catch (error) {
      console.error('Backend getAll failed:', error);
      // Try Firestore as fallback
      try {
        const missions = await firestoreMissions.getAll(status ? { status } : {});
        return { data: missions };
      } catch (firestoreError) {
        console.error('Firestore fallback also failed:', firestoreError);
        throw error;
      }
    }
  },
  
  // Get one by tracking ID
  getOne: async (trackingId) => {
    try {
      return await api.get(`/deliveries/${trackingId}`);
    } catch (error) {
      // Try Firestore as fallback
      try {
        const mission = await firestoreMissions.getByTrackingId(trackingId);
        if (mission) return { data: mission };
      } catch (e) {
        console.warn('Firestore fallback failed');
      }
      throw error;
    }
  },
  
  // Create - save to backend (primary), sync to Firestore
  create: async (data) => {
    // First create in backend to get tracking_id
    const response = await api.post('/deliveries', data);
    
    // Then sync to Firestore (non-blocking)
    try {
      await firestoreMissions.create({
        ...response.data,
        tracking_id: response.data.tracking_id
      });
    } catch (error) {
      console.warn('Failed to sync to Firestore (non-blocking):', error.message);
    }
    
    return response;
  },
  
  // Update - update backend (primary), sync to Firestore
  update: async (trackingId, data) => {
    // Update backend first (this is the source of truth)
    const response = await api.patch(`/deliveries/${trackingId}`, data);
    
    // Sync to Firestore (non-blocking - don't fail if Firestore fails)
    try {
      await firestoreMissions.update(trackingId, data);
    } catch (error) {
      console.warn('Failed to sync update to Firestore (non-blocking):', error.message);
    }
    
    return response;
  },
  
  // Assign driver
  assignDriver: async (trackingId, driverId) => {
    const response = await api.post(`/deliveries/${trackingId}/assign`, `driver_id=${driverId}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    // Sync to Firestore (non-blocking)
    try {
      await firestoreMissions.assignDriver(trackingId, driverId, response.data.driver_name || '');
    } catch (error) {
      console.warn('Failed to sync assign to Firestore (non-blocking):', error.message);
    }
    
    return response;
  },
  
  // Update GPS
  updateGps: (trackingId, lat, lng) => 
    api.post(`/deliveries/${trackingId}/gps`, `lat=${lat}&lng=${lng}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }),
  
  // Subscribe to real-time updates (Firestore only)
  subscribe: (filters, callback) => firestoreMissions.subscribe(filters, callback)
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
  create: (data) => api.post('/damage-reports', data),
  getPhoto: (reportId) => api.get(`/damage-reports/${reportId}/photo`),
  retry: (reportId) => api.post(`/damage-reports/${reportId}/retry`)
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
