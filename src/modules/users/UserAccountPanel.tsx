import React, { useEffect, useState } from 'react';
import { adminUsersApi } from '@/api/adminUsers';
import { getErrorMessage } from '@/api/client';
import { AdminMemberDto, UserAccountAction, UserAccountHistoryDto } from '@/types';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { RoleBadge, StatusBadge } from './UserBadges';

const ACTION_LABEL: Record<UserAccountAction, string> = {
  SUSPEND: '계정 정지',
  UNSUSPEND: '정지 해제',
  GRANT_ADMIN: '관리자 권한 부여',
  REVOKE_ADMIN: '관리자 권한 해제',
};

const PERIOD_OPTIONS = [
  { value: '7', label: '7일' },
  { value: '30', label: '30일' },
  { value: '90', label: '90일' },
  { value: 'permanent', label: '영구 정지' },
  { value: 'custom', label: '직접 입력' },
];

const REASON_MAX_LENGTH = 500;

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleString('ko-KR');
  } catch {
    return value;
  }
};

const pad = (n: number) => String(n).padStart(2, '0');

/** 서버(LocalDateTime)로 보낼 로컬 시각 문자열: YYYY-MM-DDTHH:mm:ss */
const toLocalDateTimeString = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;

interface UserAccountPanelProps {
  user: AdminMemberDto;
  onUpdated: (user: AdminMemberDto) => void;
}

export const UserAccountPanel: React.FC<UserAccountPanelProps> = ({ user, onUpdated }) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [roleReason, setRoleReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [period, setPeriod] = useState('7');
  const [customUntil, setCustomUntil] = useState('');
  const [unsuspendReason, setUnsuspendReason] = useState('');

  const [history, setHistory] = useState<UserAccountHistoryDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const historySize = 10;

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await adminUsersApi.getHistory(user.id, { page: historyPage, size: historySize });
      setHistory(res.content || []);
      setHistoryTotalPages(res.totalPages ?? 0);
    } catch (err) {
      setError(getErrorMessage(err));
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user.id, historyPage]);

  const applyUpdate = async (request: () => Promise<AdminMemberDto>, message: string) => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const updated = await request();
      onUpdated(updated);
      setSuccess(message);
      if (historyPage === 0) {
        await fetchHistory();
      } else {
        setHistoryPage(0);
      }
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async () => {
    const granting = user.role !== 'ADMIN';
    const confirmMessage = granting
      ? `${user.nickname}(${user.email}) 회원에게 관리자 권한을 부여하시겠습니까?\n관리자 페이지에 Google 계정으로 로그인할 수 있게 됩니다.`
      : `${user.nickname}(${user.email}) 회원의 관리자 권한을 해제하시겠습니까?\n관리자 페이지 접속이 즉시 차단됩니다.`;
    if (!window.confirm(confirmMessage)) return;

    const ok = await applyUpdate(
      () =>
        adminUsersApi.updateRole(user.id, {
          role: granting ? 'ADMIN' : 'USER',
          reason: roleReason.trim() || undefined,
        }),
      granting ? '관리자 권한을 부여했습니다.' : '관리자 권한을 해제했습니다.'
    );
    if (ok) setRoleReason('');
  };

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    const reason = suspendReason.trim();
    if (!reason) {
      setError('정지 사유를 입력해주세요.');
      return;
    }

    let suspendedUntil: string | null = null;
    if (period === 'custom') {
      if (!customUntil) {
        setError('정지 해제일을 선택해주세요.');
        return;
      }
      if (new Date(customUntil).getTime() <= Date.now()) {
        setError('정지 해제일은 현재 시각 이후여야 합니다.');
        return;
      }
      suspendedUntil = `${customUntil}:00`;
    } else if (period !== 'permanent') {
      const until = new Date();
      until.setDate(until.getDate() + Number(period));
      suspendedUntil = toLocalDateTimeString(until);
    }

    const periodLabel = suspendedUntil ? `${formatDate(suspendedUntil)}까지` : '영구';
    if (
      !window.confirm(
        `${user.nickname}(${user.email}) 회원을 ${periodLabel} 정지하시겠습니까?\n정지된 회원은 로그인할 수 없습니다.`
      )
    ) {
      return;
    }

    const ok = await applyUpdate(
      () => adminUsersApi.updateStatus(user.id, { status: 'SUSPENDED', reason, suspendedUntil }),
      '계정을 정지했습니다.'
    );
    if (ok) {
      setSuspendReason('');
      setPeriod('7');
      setCustomUntil('');
    }
  };

  const handleUnsuspend = async () => {
    if (!window.confirm(`${user.nickname}(${user.email}) 회원의 정지를 해제하시겠습니까?`)) return;
    const ok = await applyUpdate(
      () =>
        adminUsersApi.updateStatus(user.id, {
          status: 'ACTIVE',
          reason: unsuspendReason.trim() || undefined,
        }),
      '정지를 해제했습니다.'
    );
    if (ok) setUnsuspendReason('');
  };

  const suspended = user.status === 'SUSPENDED';

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">계정 관리</h2>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 권한 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">권한</h3>
            <RoleBadge role={user.role} />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            관리자 권한이 있으면 관리자 페이지에 Google 계정({user.email})으로 로그인할 수 있습니다.
          </p>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm mb-3"
            placeholder="사유 (선택)"
            maxLength={REASON_MAX_LENGTH}
            value={roleReason}
            onChange={(e) => setRoleReason(e.target.value)}
          />
          <Button
            type="button"
            variant={user.role === 'ADMIN' ? 'danger' : 'primary'}
            isLoading={submitting}
            disabled={user.role !== 'ADMIN' && suspended}
            onClick={handleRoleChange}
          >
            {user.role === 'ADMIN' ? '관리자 권한 해제' : '관리자 권한 부여'}
          </Button>
          {user.role !== 'ADMIN' && suspended && (
            <p className="mt-2 text-xs text-gray-500">정지된 회원에게는 관리자 권한을 부여할 수 없습니다.</p>
          )}
        </div>

        {/* 상태 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">계정 상태</h3>
            <StatusBadge status={user.status} />
          </div>

          {suspended ? (
            <>
              <dl className="text-sm mb-4 space-y-1">
                <div className="flex gap-2">
                  <dt className="text-gray-500 shrink-0">해제 예정</dt>
                  <dd className="text-gray-900">
                    {user.suspendedUntil ? formatDate(user.suspendedUntil) : '영구 정지'}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-gray-500 shrink-0">사유</dt>
                  <dd className="text-gray-900 whitespace-pre-wrap break-all">{user.suspendReason}</dd>
                </div>
              </dl>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm mb-3"
                placeholder="해제 사유 (선택)"
                maxLength={REASON_MAX_LENGTH}
                value={unsuspendReason}
                onChange={(e) => setUnsuspendReason(e.target.value)}
              />
              <Button type="button" isLoading={submitting} onClick={handleUnsuspend}>
                정지 해제
              </Button>
            </>
          ) : (
            <form onSubmit={handleSuspend}>
              <p className="text-sm text-gray-500 mb-4">
                정지된 회원은 홈페이지와 관리자 페이지에 로그인할 수 없고, 로그인 중인 세션도 즉시 차단됩니다.
              </p>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm mb-3"
                rows={2}
                placeholder="정지 사유 (필수, 회원에게 표시됩니다)"
                maxLength={REASON_MAX_LENGTH}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 mb-3">
                <select
                  className="border rounded px-3 py-2 text-sm"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  {PERIOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {period === 'custom' && (
                  <input
                    type="datetime-local"
                    className="border rounded px-3 py-2 text-sm"
                    value={customUntil}
                    onChange={(e) => setCustomUntil(e.target.value)}
                  />
                )}
              </div>
              <Button type="submit" variant="danger" isLoading={submitting}>
                계정 정지
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* 변경 이력 */}
      <h3 className="text-lg font-semibold mb-3">변경 이력</h3>
      {historyLoading ? (
        <p>불러오는 중...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">일시</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">구분</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">사유</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">정지 기한</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">처리자</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                      변경 이력이 없습니다.
                    </td>
                  </tr>
                ) : (
                  history.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                        {ACTION_LABEL[row.action] ?? row.action}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 break-all">{row.reason || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                        {row.action === 'SUSPEND'
                          ? row.suspendedUntil
                            ? formatDate(row.suspendedUntil)
                            : '영구'
                          : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{row.performedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {historyTotalPages > 1 && (
            <div className="mt-4 flex gap-2 justify-center">
              <Button
                variant="secondary"
                disabled={historyPage <= 0}
                onClick={() => setHistoryPage((p) => p - 1)}
              >
                이전
              </Button>
              <span className="py-2">
                {historyPage + 1} / {historyTotalPages}
              </span>
              <Button
                variant="secondary"
                disabled={historyPage >= historyTotalPages - 1}
                onClick={() => setHistoryPage((p) => p + 1)}
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
