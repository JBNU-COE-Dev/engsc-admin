import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminUsersApi } from '@/api/adminUsers';
import { activitiesApi } from '@/api/activities';
import { ActivityPostResponseDto, AdminMemberDto } from '@/types';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { getErrorMessage } from '@/api/client';
import { UserAccountPanel } from './UserAccountPanel';

const CATEGORY_LABEL: Record<string, string> = {
  EXTERNAL_ACTIVITY: '대외활동',
  CONTEST: '공모전',
  TEAM_RECRUITMENT: '팀원 모집',
};

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleString('ko-KR');
  } catch {
    return value;
  }
};

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);

  const [user, setUser] = useState<AdminMemberDto | null>(null);
  const [posts, setPosts] = useState<ActivityPostResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const size = 20;

  const fetchUser = async () => {
    if (!userId || Number.isNaN(userId)) {
      setError('잘못된 회원 ID입니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await adminUsersApi.getById(userId);
      setUser(data);
    } catch (err) {
      setError(getErrorMessage(err));
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!userId || Number.isNaN(userId)) return;
    setPostsLoading(true);
    try {
      const res = await adminUsersApi.getPosts(userId, { page, size });
      setPosts(res.content || []);
      setTotalPages(res.totalPages ?? 0);
    } catch (err) {
      setError(getErrorMessage(err));
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  useEffect(() => {
    fetchPosts();
  }, [userId, page]);

  const handleDelete = async (postId: number) => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;
    try {
      await activitiesApi.delete(postId);
      await Promise.all([fetchPosts(), fetchUser()]);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        <Link to="/users" className="text-blue-600 hover:underline">
          ← 회원 목록
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <Link to="/users" className="text-blue-600 hover:underline text-sm">
          ← 회원 목록
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">회원 상세</h1>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">ID</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">이메일</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">닉네임</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.nickname}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">가입일</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">작성 글 수</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.postCount}</dd>
          </div>
        </dl>
      </div>

      <UserAccountPanel user={user} onUpdated={setUser} />

      <h2 className="text-xl font-semibold mb-4">작성 글</h2>

      {postsLoading ? (
        <p>불러오는 중...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">조회수</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">작성일</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      작성한 글이 없습니다.
                    </td>
                  </tr>
                ) : (
                  posts.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-2 text-sm text-gray-500">{row.id}</td>
                      <td className="px-4 py-2 text-sm">
                        {CATEGORY_LABEL[row.category] || row.category}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.title}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{row.viewCount}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{formatDate(row.createdAt)}</td>
                      <td className="px-4 py-2 text-sm text-right">
                        <Link
                          to={`/activities/${row.id}/edit`}
                          className="text-blue-600 hover:underline mr-2"
                        >
                          수정
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="text-red-600 hover:underline"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex gap-2 justify-center">
              <Button variant="secondary" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
                이전
              </Button>
              <span className="py-2">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
