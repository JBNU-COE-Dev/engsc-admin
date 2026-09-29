import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { LoginRequest } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 페이지 로드 시 토큰 검증
    const token = localStorage.getItem('auth_token');
    if (token) {
      authApi
        .verifyToken()
        .then((isValid) => {
          setIsAuthenticated(isValid);
          if (!isValid) {
            localStorage.removeItem('auth_token');
          }
        })
        .catch(() => {
          setIsAuthenticated(false);
          localStorage.removeItem('auth_token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    // API 인터셉터에서 발생한 인증 실패 이벤트 리스닝
    const handleAuthLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('auth_token');
    };

    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem('auth_token', response.token);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    const response = await authApi.googleLogin(idToken);
    localStorage.setItem('auth_token', response.token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    authApi.logout().catch(() => {
      // 로그아웃 실패해도 로컬 상태는 정리됨
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
