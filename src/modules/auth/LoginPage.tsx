import React, { useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { getErrorMessage } from '@/api/client';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ username, password });
      window.location.href = '/admin/notices';
    } catch (err) {
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential?: string) => {
    if (!credential) {
      setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle(credential);
      window.location.href = '/admin/notices';
    } catch (err) {
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">관리자 로그인</h1>
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        <form onSubmit={handleSubmit}>
          <Input
            label="사용자명"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            로그인
          </Button>
        </form>

        {googleClientId && (
          <>
            <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
              <div className="h-px flex-1 bg-gray-200" />
              또는
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <GoogleOAuthProvider clientId={googleClientId}>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={(res) => handleGoogleSuccess(res.credential)}
                  onError={() => setError('Google 로그인에 실패했습니다. 다시 시도해주세요.')}
                  text="signin_with"
                  locale="ko"
                  width={320}
                />
              </div>
            </GoogleOAuthProvider>
            <p className="mt-3 text-center text-xs text-gray-500">
              관리자 권한을 받은 전북대 웹메일 계정만 로그인할 수 있습니다.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
