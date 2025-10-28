import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../api.ts';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user data on initial load
    try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    } catch (error) {
        console.error("Failed to parse auth data from localStorage", error);
        localStorage.removeItem('user');
        localStorage.removeItem('tokens');
    } finally {
        setLoading(false);
    }
  }, []);

  const handleAuthSuccess = async (authPromise) => {
    const { accessToken, refreshToken } = await authPromise;
    localStorage.setItem('tokens', JSON.stringify({ accessToken, refreshToken }));

    const userData = await api.getMe();
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  const login = async (email, password) => {
    await handleAuthSuccess(api.login(email, password));
  };

  const register = async (email, password) => {
    await handleAuthSuccess(api.register(email, password));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
  };
  
  const updateUser = (updatedUserData) => {
      const newUser = { ...user, ...updatedUserData };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
  }

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};