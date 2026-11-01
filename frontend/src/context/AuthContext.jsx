import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gourmet_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('gourmet_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.data.user);
          localStorage.setItem('gourmet_user', JSON.stringify(res.data.user));
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    }

    verifyAuth();

    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (username, password) => {
    const res = await api.login({ username, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('gourmet_token', newToken);
    localStorage.setItem('gourmet_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('gourmet_token');
    localStorage.removeItem('gourmet_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const isWaiter = user?.role === 'waiter';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isWaiter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
