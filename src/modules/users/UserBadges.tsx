import React from 'react';
import { UserRole, UserStatus } from '@/types';

const ROLE_LABEL: Record<UserRole, string> = {
  USER: '일반 회원',
  ADMIN: '관리자',
};

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: '정상',
  SUSPENDED: '정지',
};

const badgeBase = 'inline-block px-2 py-0.5 rounded-full text-xs font-medium';

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => (
  <span
    className={`${badgeBase} ${
      role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
    }`}
  >
    {ROLE_LABEL[role] ?? role}
  </span>
);

export const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => (
  <span
    className={`${badgeBase} ${
      status === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
    }`}
  >
    {STATUS_LABEL[status] ?? status}
  </span>
);
