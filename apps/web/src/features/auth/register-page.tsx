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

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api('/auth/register', {
        method: 'POST',
        json: { email, password, displayName, turnstileToken: 'dev-bypass' },
      });
      // Auto-login with the same credentials the user just entered so
      // they don't have to retype the password on the login page.
      const login = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        json: { email, password },
      });
      setSession(login);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.code === 'EMAIL_TAKEN'
            ? '此邮箱已被注册'
            : err.code === 'INVALID_INPUT'
              ? '输入不符合要求（密码需 10+ 位，含大小写与数字）'
              : err.code === 'INVALID_CREDENTIALS'
                ? '注册成功，但自动登录失败，请手动登录'
                : err.code,
        );
      } else {
        setError('网络错误');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-semibold">注册 Kairo</h1>
          <p className="text-fg-muted mt-1 text-xs">首位注册者将成为管理员</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="displayName">显示名称</Label>
              <Input
                id="displayName"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-fg-muted mt-1 text-[11px]">至少 10 位，包含大小写字母与数字</p>
            </div>
            {error && <p className="text-danger text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '创建中…' : '创建账号'}
            </Button>
            <p className="text-fg-muted text-center text-xs">
              已有账号？{' '}
              <Link to="/login" className="text-accent hover:underline">
                登录
              </Link>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
