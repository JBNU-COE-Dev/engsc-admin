import { apiClient } from './client';
import {
  ActivityPostResponseDto,
  AdminMemberDto,
  Page,
  UserAccountHistoryDto,
  UserRole,
  UserRoleUpdateRequest,
  UserStatus,
  UserStatusUpdateRequest,
} from '@/types';

const BASE = '/api/admin/users';

export const adminUsersApi = {
  getList: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    role?: UserRole;
    status?: UserStatus;
  }): Promise<Page<AdminMemberDto>> => {
    const response = await apiClient.get<Page<AdminMemberDto>>(BASE, { params });
    return response.data;
  },

  getById: async (userId: number): Promise<AdminMemberDto> => {
    const response = await apiClient.get<AdminMemberDto>(`${BASE}/${userId}`);
    return response.data;
  },

  getPosts: async (
    userId: number,
    params?: { page?: number; size?: number }
  ): Promise<Page<ActivityPostResponseDto>> => {
    const response = await apiClient.get<Page<ActivityPostResponseDto>>(
      `${BASE}/${userId}/posts`,
      { params }
    );
    return response.data;
  },

  getHistory: async (
    userId: number,
    params?: { page?: number; size?: number }
  ): Promise<Page<UserAccountHistoryDto>> => {
    const response = await apiClient.get<Page<UserAccountHistoryDto>>(
      `${BASE}/${userId}/history`,
      { params }
    );
    return response.data;
  },

  // 계정 정지 / 정지 해제
  updateStatus: async (userId: number, data: UserStatusUpdateRequest): Promise<AdminMemberDto> => {
    const response = await apiClient.patch<AdminMemberDto>(`${BASE}/${userId}/status`, data);
    return response.data;
  },

  // 관리자 권한 부여 / 해제
  updateRole: async (userId: number, data: UserRoleUpdateRequest): Promise<AdminMemberDto> => {
    const response = await apiClient.patch<AdminMemberDto>(`${BASE}/${userId}/role`, data);
    return response.data;
  },
};
