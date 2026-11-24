// ==============================================================================
// CALYX FRONTEND: AUTHENTICATION CONTEXT
// ==============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthTokens } from '../types';
import { api, getStoredAccessToken, setStoredTokens, clearStoredTokens } from '../api/client';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isCandidate: boolean;
  isRecruiter: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = getStoredAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await api.auth.getMe();
        setUser(userData);
      } catch (err) {
        console.warn('Session restore failed or expired:', err);
        clearStoredTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (tokens: AuthTokens) => {
    setStoredTokens(tokens);
    setUser(tokens.user);
  };

  const logout = () => {
    clearStoredTokens();
    setUser(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  const role = user?.role || null;
  const isCandidate = role === 'candidate' || role === 'admin';
  const isRecruiter = role === 'recruiter' || role === 'admin';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
        isCandidate,
        isRecruiter,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
