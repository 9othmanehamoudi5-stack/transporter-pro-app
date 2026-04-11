const KEYS = {
  access: 'tp_access_token',
  refresh: 'tp_refresh_token'
};

export const tokenStore = {
  save(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem(KEYS.access, accessToken);
    if (refreshToken) localStorage.setItem(KEYS.refresh, refreshToken);
  },

  getAccess() {
    return localStorage.getItem(KEYS.access);
  },

  getRefresh() {
    return localStorage.getItem(KEYS.refresh);
  },

  clear() {
    localStorage.removeItem(KEYS.access);
    localStorage.removeItem(KEYS.refresh);
  }
};
