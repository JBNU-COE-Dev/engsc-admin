// 공지사항 관련 타입
export interface NoticeRequestDto {
  title: string;
  content: string;
  author: string;
  isPinned?: boolean;
  category?: string;
}

export interface NoticeResponseDto {
  id: number;
  title: string;
  content: string;
  author: string;
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  category: string | null;
  imageUrl: string | null;
}

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
}

// 회원 관리 (일반 회원)
export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface AdminMemberDto {
  id: number;
  email: string;
  nickname: string;
  createdAt: string;
  postCount: number;
  role: UserRole;
  /** 실제 적용 상태 (정지 기간이 지났으면 ACTIVE) */
  status: UserStatus;
  /** 정지 중일 때만 값 있음. null이면 영구 정지 */
  suspendedUntil: string | null;
  suspendReason: string | null;
}

export interface UserStatusUpdateRequest {
  status: UserStatus;
  reason?: string;
  /** 'YYYY-MM-DDTHH:mm:ss' (서버 시간대). 생략 시 영구 정지 */
  suspendedUntil?: string | null;
}

export interface UserRoleUpdateRequest {
  role: UserRole;
  reason?: string;
}

export type UserAccountAction = 'SUSPEND' | 'UNSUSPEND' | 'GRANT_ADMIN' | 'REVOKE_ADMIN';

export interface UserAccountHistoryDto {
  id: number;
  action: UserAccountAction;
  reason: string | null;
  suspendedUntil: string | null;
  performedBy: string;
  createdAt: string;
}

// 인증 관련 타입
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  nickname?: string | null;
}

// 매칭 관련 타입
export interface MatchingRequestDto {
  title: string;
  type: string;
  category?: string;
  description?: string;
  maxMembers?: number;
  currentMembers?: number;
  deadline?: string;
  thumbnail?: string;
  organizerId?: number;
  organizerName?: string;
  companyType?: string;
  targetAudience?: string;
  applicationStart?: string;
  applicationEnd?: string;
  activityPeriod?: string;
  recruitCount?: string;
  activityArea?: string;
  homepage?: string;
  tagsActivity?: string[];
}

export interface MatchingResponseDto {
  id: number;
  title: string;
  type: string;
  category: string | null;
  description: string | null;
  members: string | null;
  deadline: string | null;
  dDay: number | null;
  views: number;
  comments: number;
  thumbnail: string | null;
  organizerId: number | null;
  organizerName: string | null;
  companyType: string | null;
  targetAudience: string | null;
  applicationStart: string | null;
  applicationEnd: string | null;
  activityPeriod: string | null;
  recruitCount: string | null;
  activityArea: string | null;
  homepage: string | null;
  tagsActivity: string[];
}

// 대외활동/공모전/팀원모집
export type ActivityCategory = 'EXTERNAL_ACTIVITY' | 'CONTEST' | 'TEAM_RECRUITMENT';
export type RecruitmentStatus = 'RECRUITING' | 'CLOSED';

export interface ActivityPostRequestDto {
  category: ActivityCategory;
  title: string;
  content: string;
  author: string;
  thumbnailUrl?: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  applyUrl?: string;
  headcount?: number;
  recruitmentRoles?: string;
  contactUrl?: string;
  status?: RecruitmentStatus;
}

export interface ActivityPostResponseDto {
  id: number;
  category: ActivityCategory;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  viewCount: number;
  author: string;
  createdAt: string;
  updatedAt: string;
  organization: string | null;
  startDate: string | null;
  endDate: string | null;
  applyUrl: string | null;
  headcount: number | null;
  recruitmentRoles: string | null;
  contactUrl: string | null;
  status: RecruitmentStatus | null;
}

// 캘린더 관련 타입
export interface CalendarEventRequestDto {
  date_start: string; // YYYY-MM-DD 형식
  date_end: string; // YYYY-MM-DD 형식
  event_korean: string; // 필수, 최소 1자 이상
  event_english?: string; // 선택
  description?: string; // 선택
}

export interface CalendarEventResponseDto {
  id: number;
  date_start: string; // YYYY-MM-DD 형식
  date_end: string; // YYYY-MM-DD 형식
  event_korean: string;
  event_english: string | null;
  description: string | null;
  created_at: string; // YYYY-MM-DDTHH:mm:ss 형식
  updated_at: string; // YYYY-MM-DDTHH:mm:ss 형식
}

// API 에러 응답 타입
export interface ApiError {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
