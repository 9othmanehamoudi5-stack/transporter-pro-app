import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { tokenStore } from '../services/tokenStore';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Build headers with localStorage token as fallback
const authHeaders = () => {
  const token = tokenStore.getAccess();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const didCheck = useRef(false);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
        headers: authHeaders()
      });
      setUser(data);
    } catch (err) {
      if (err.response?.status === 401) {
        // Try refresh — send token in body as fallback for missing cookie
        const refreshToken = tokenStore.getRefresh();
        try {
          const refreshRes = await axios.post(
            `${API_URL}/api/auth/refresh`,
            refreshToken ? { refresh_token: refreshToken } : {},
            { withCredentials: true }
          );
          // Save new access_token
          if (refreshRes.data?.access_token) {
            tokenStore.save(refreshRes.data.access_token, null);
          }
          const { data } = await axios.get(`${API_URL}/api/auth/me`, {
            withCredentials: true,
            headers: authHeaders()
          });
          setUser(data);
          return;
        } catch {
          tokenStore.clear();
        }
      }
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!didCheck.current) {
      didCheck.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      // Save tokens to localStorage for mobile persistence
      tokenStore.save(data.access_token, data.refresh_token);
      setUser(data);
      return { success: true, user: data };
    } catch (e) {
      const detail = e.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map(d => d.msg || d).join(', ')
        : e.message;
      return { success: false, error: msg };
    }
  };

  const register = async (email, password, name, role = 'client') => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/register`,
        { email, password, name, role },
        { withCredentials: true }
      );
      tokenStore.save(data.access_token, data.refresh_token);
      // Persist user id for downstream Stripe redirect (Step 2 onboarding)
      try { localStorage.setItem('tp_user_id', data.id || ''); } catch {}
      setUser(data);
      return { success: true, user: data };
    } catch (e) {
      const detail = e.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map(d => d.msg || d).join(', ')
        : e.message;
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, {
        withCredentials: true,
        headers: authHeaders()
      });
    } catch {
      // Ignore
    }
    tokenStore.clear();
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
