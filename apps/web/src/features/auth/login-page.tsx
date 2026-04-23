import { Button, Card, CardBody, CardHeader, Input, Label } from '@kairo/ui';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../../shared/lib/api-client';
import { useAuthStore } from '../../shared/lib/auth-store';

interface LoginResponse {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: 'admin' | 'user';
    themeId: string;
    timezone: string;
    locale: string;
  };
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        json: { email, password },
      });
      setSession(res);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.code === 'INVALID_CREDENTIALS' ? '邮箱或密码错误' : err.code);
      } else {
        setError('网络错误，请重试');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-semibold">登录 Kairo</h1>
          <p className="mt-1 text-xs text-fg-muted">恰当的时机，做对的事</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中…' : '登录'}
            </Button>
            <p className="text-center text-xs text-fg-muted">
              还没有账号？{' '}
              <Link to="/register" className="text-accent hover:underline">
                注册
              </Link>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
