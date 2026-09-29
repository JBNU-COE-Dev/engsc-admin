import { apiClient } from './client';
import { LoginRequest, LoginResponse } from '@/types';

export const authApi = {
  // 로그인
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  // Google 로그인 (관리자 권한을 받은 회원)
  googleLogin: async (idToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/admin/google', { idToken });
    return response.data;
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
  },

  // 토큰 검증
  verifyToken: async (): Promise<boolean> => {
    try {
      await apiClient.get('/api/auth/verify');
      return true;
    } catch {
      return false;
    }
  },
};
