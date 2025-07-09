'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, User, ApiError } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  const clearError = () => setError(null);

  const login = () => {
    setError(null);
    api.githubLogin();
  };

  const logout = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Try to disconnect from GitHub if we have a token
      const token = api.getAccessToken();
      if (token) {
        try {
          await api.disconnectFromGitHub();
        } catch (error) {
          // Don't fail logout if disconnect fails
          console.warn('Failed to disconnect from GitHub:', error);
        }
      }
      
      // Clear local state
      api.removeAccessToken();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      setError(null);
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      if (error instanceof ApiError && error.status === 401) {
        // Token is invalid, clear user state
        api.removeAccessToken();
        setUser(null);
      } else {
        setError('Failed to load user data. Please try again.');
      }
    }
  };

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = api.getAccessToken();
      if (!token) {
        setUser(null);
        return;
      }

      // Check if token is valid and get user data
      const isValid = await api.isTokenValid();
      if (isValid) {
        await refreshUser();
      } else {
        // Token is invalid, try to refresh
        try {
          const refreshResponse = await api.refreshAccessToken();
          api.setAccessToken(refreshResponse.access_token);
          api.setRefreshToken(refreshResponse.refresh_token);
          await refreshUser();
        } catch (refreshError) {
          // Refresh failed, clear everything
          api.removeAccessToken();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setError('Failed to initialize authentication. Please try again.');
      api.removeAccessToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle GitHub auth redirect
  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        const authResponse = await api.handleAuthRedirect();
        if (authResponse) {
          api.setAccessToken(authResponse.access_token);
          api.setRefreshToken(authResponse.refresh_token);
          setUser(authResponse.user);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          // No auth data in URL, initialize normally
          await initializeAuth();
        }
      } catch (error) {
        console.error('Auth redirect error:', error);
        if (error instanceof ApiError) {
          setError(error.message);
        } else {
          setError('Failed to complete authentication. Please try again.');
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        await initializeAuth();
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthRedirect();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        const token = api.getAccessToken();
        if (token) {
          const refreshResponse = await api.refreshAccessToken();
          api.setAccessToken(refreshResponse.access_token);
          api.setRefreshToken(refreshResponse.refresh_token);
        }
      } catch (error) {
        console.warn('Token refresh failed:', error);
      }
    }, 60 * 60 * 1000); // Refresh every 1 hour

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    logout,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 