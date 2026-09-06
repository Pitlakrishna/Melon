'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const setAuthCookies = (jwtToken: string | null) => {
    if (typeof document === 'undefined') return;
    if (jwtToken) {
      document.cookie = `auth_token=${jwtToken}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
    }
  };

  // Check stored token and validate on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!savedToken || savedToken === 'undefined' || savedToken === 'null') {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
          }
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (res.ok) {
          const json = await res.json();
          const authUser = json?.data?.user || json?.user;
          if (authUser) {
            setUser(authUser);
            setToken(savedToken);
            setAuthCookies(savedToken);
          } else {
            throw new Error('Invalid user payload');
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          setAuthCookies(null);
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          setAuthCookies(null);
        }
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [API_URL]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const json = await res.json();

        if (!res.ok) {
          return {
            success: false,
            message: json?.message || json?.error || 'Login failed. Please check your credentials.',
          };
        }

        const authUser = json.data?.user || json.user;
        const authToken = json.data?.token || json.token;

        if (!authToken || !authUser) {
          return {
            success: false,
            message: 'Server returned an invalid response. Missing token or user profile.',
          };
        }

        setUser(authUser);
        setToken(authToken);

        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', authToken);
          setAuthCookies(authToken);
        }

        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          message: err?.message || 'Network error while logging in. Please try again.',
        };
      }
    },
    [API_URL]
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const json = await res.json();

        if (!res.ok) {
          return {
            success: false,
            message: json?.message || json?.error || 'Registration failed. Please try again.',
          };
        }

        const authUser = json.data?.user || json.user;
        const authToken = json.data?.token || json.token;

        if (!authToken || !authUser) {
          return {
            success: false,
            message: 'Server returned an invalid response. Missing token or user profile.',
          };
        }

        setUser(authUser);
        setToken(authToken);

        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', authToken);
          setAuthCookies(authToken);
        }

        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          message: err?.message || 'Network error while registering. Please try again.',
        };
      }
    },
    [API_URL]
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      setAuthCookies(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
