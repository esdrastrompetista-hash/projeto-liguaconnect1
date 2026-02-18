import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import type { UserProfile } from '@/types';
import { authApi, usersApi } from '@/services/api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (data: { googleId: string; email: string; name: string; avatarUrl?: string }) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    age?: number;
    gender?: string;
    country?: string;
    nativeLanguage?: string;
    learningLanguages?: { language: string; level: string }[];
    bio?: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('linguaconnect_access_token');
      if (token) {
        try {
          const response = await authApi.getMe();
          setUser(response.data);
        } catch {
          localStorage.removeItem('linguaconnect_access_token');
          localStorage.removeItem('linguaconnect_refresh_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      const { user, tokens } = response.data;

      localStorage.setItem('linguaconnect_access_token', tokens.accessToken);
      localStorage.setItem('linguaconnect_refresh_token', tokens.refreshToken);

      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (data: { googleId: string; email: string; name: string; avatarUrl?: string }) => {
    setIsLoading(true);
    try {
      const response = await authApi.googleLogin(data);
      const { user, tokens } = response.data;

      localStorage.setItem('linguaconnect_access_token', tokens.accessToken);
      localStorage.setItem('linguaconnect_refresh_token', tokens.refreshToken);

      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    age?: number;
    gender?: string;
    country?: string;
    nativeLanguage?: string;
    learningLanguages?: { language: string; level: string }[];
    bio?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      const { user, tokens } = response.data;

      localStorage.setItem('linguaconnect_access_token', tokens.accessToken);
      localStorage.setItem('linguaconnect_refresh_token', tokens.refreshToken);

      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('linguaconnect_access_token');
      localStorage.removeItem('linguaconnect_refresh_token');
      setUser(null);
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    const response = await usersApi.updateProfile(profileData);
    setUser(response.data);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
