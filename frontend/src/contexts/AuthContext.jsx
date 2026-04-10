import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const AuthProvider = ({ children }) => {
  // Three states: null = still checking, false = confirmed not auth, object = authenticated
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const didCheck = useRef(false);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setUser(data);
    } catch (err) {
      // Only try refresh if we got a 401 (not a network error)
      if (err.response?.status === 401) {
        try {
          await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
          // Retry /me after refresh
          const { data } = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
          setUser(data);
          return;
        } catch {
          // Refresh also failed — truly not authenticated
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
      setUser(data);
      return { success: true };
    } catch (e) {
      return { success: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
    }
  };

  const register = async (email, password, name, role = 'client') => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/register`,
        { email, password, name, role },
        { withCredentials: true }
      );
      setUser(data);
      return { success: true };
    } catch (e) {
      return { success: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch {
      // Ignore
    }
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
