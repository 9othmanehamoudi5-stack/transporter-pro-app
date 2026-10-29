import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { tokenStore } from '../services/tokenStore';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const DEMO_ADMIN_USER = {
  id: 'demo-admin-id',
  email: 'admin@transporter-pro.com',
  name: 'Gérant Transporter-Pro',
  role: 'admin',
  company_name: 'Transporter-Pro SAS',
  plan: 'flotte_pro',
  subscription_status: 'active',
  onboarding_complete: true,
  preferred_view: 'interactive',
  interactive_view_enabled: true,
  is_demo: true
};

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
  // Pré-chargement immédiat de l'utilisateur démo pour éliminer tout temps de chargement / écran blanc
  const getInitialUser = () => {
    try {
      const saved = localStorage.getItem('tp_demo_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEMO_ADMIN_USER;
  };

  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(false);
  const didCheck = useRef(false);

  const checkAuth = useCallback(async () => {
    const savedDemo = localStorage.getItem('tp_demo_user');
    if (savedDemo) {
      try {
        setUser(JSON.parse(savedDemo));
        setLoading(false);
        return;
      } catch {}
    }
    try {
      const { data } = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
        headers: authHeaders(),
        timeout: 1200
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
            { withCredentials: true, timeout: 1200 }
          );
          if (refreshRes.data?.access_token) {
            tokenStore.save(refreshRes.data.access_token, null);
          }
          const { data } = await axios.get(`${API_URL}/api/auth/me`, {
            withCredentials: true,
            headers: authHeaders(),
            timeout: 1200
          });
          setUser(data);
          return;
        } catch {
          tokenStore.clear();
        }
      }
      // Si backend hors-ligne ou pause Emergent, conserver l'utilisateur démo admin
      setUser(prev => prev || DEMO_ADMIN_USER);
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
      if (data?.requires_2fa) {
        return { success: true, requires_2fa: true, challenge_token: data.challenge_token, message: data.message };
      }
      tokenStore.save(data.access_token, data.refresh_token);
      localStorage.removeItem('tp_demo_user');
      setUser(data);
      return { success: true, user: data };
    } catch (e) {
      // Offline / network fallback when backend is unreachable or admin demo
      if (!e.response || e.response.status >= 500 || e.message?.includes('Network Error') || email === 'admin@transporter-pro.com') {
        const demoUser = {
          ...DEMO_ADMIN_USER,
          email: email || DEMO_ADMIN_USER.email
        };
        tokenStore.save('demo-token-123', 'demo-refresh-123');
        localStorage.setItem('tp_demo_user', JSON.stringify(demoUser));
        setUser(demoUser);
        return { success: true, user: demoUser, is_demo: true };
      }
      const detail = e.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map(d => d.msg || d).join(', ')
        : e.message;
      return { success: false, error: msg };
    }
  };

  const loginDemo = (role = 'admin') => {
    const demoUser = { ...DEMO_ADMIN_USER, role };
    tokenStore.save('demo-token-123', 'demo-refresh-123');
    localStorage.setItem('tp_demo_user', JSON.stringify(demoUser));
    setUser(demoUser);
    return { success: true, user: demoUser };
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

  const verify2FA = async (challenge_token, code) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/2fa/verify`,
        { challenge_token, code },
        { withCredentials: true }
      );
      tokenStore.save(data.access_token, data.refresh_token);
      setUser(data);
      return { success: true, user: data };
    } catch (e) {
      const detail = e.response?.data?.detail;
      return { success: false, error: typeof detail === 'string' ? detail : 'Code invalide' };
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
    localStorage.removeItem('tp_demo_user');
    tokenStore.clear();
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginDemo, register, logout, checkAuth, verify2FA }}>
      {children}
    </AuthContext.Provider>
  );
};
