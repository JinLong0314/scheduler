import { Button, Card, CardBody, CardHeader, ThemeSwitcher } from '@kairo/ui';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../shared/lib/auth-store';

const DOWNLOADS = [
  {
    label: '下载 Windows (.exe)',
    href: 'https://kairo-api.jackie-macau.top/desktop/download/windows',
  },
  {
    label: '下载 Linux (.deb)',
    href: 'https://kairo-api.jackie-macau.top/desktop/download/linux-deb',
  },
  {
    label: 'Linux AppImage',
    href: 'https://kairo-api.jackie-macau.top/desktop/download/linux-appimage',
  },
  { label: '下载 Android APK', href: 'https://kairo-api.jackie-macau.top/mobile/download/android' },
];

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">设置</h1>
          <p className="text-fg-muted text-xs">个人偏好（仅影响当前设备当前账号）</p>
        </div>
        <Link to="/">
          <Button variant="ghost" size="sm">
            返回
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">账号</h2>
        </CardHeader>
        <CardBody className="space-y-1 text-sm">
          <div>
            <span className="text-fg-muted">邮箱：</span>
            {user?.email ?? '—'}
          </div>
          <div>
            <span className="text-fg-muted">显示名称：</span>
            {user?.displayName ?? '—'}
          </div>
          <div>
            <span className="text-fg-muted">角色：</span>
            {user?.role === 'admin' ? '管理员' : '普通用户'}
          </div>
          <div>
            <span className="text-fg-muted">时区：</span>
            {user?.timezone ?? '—'}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">外观</h2>
          <p className="text-fg-muted mt-1 text-xs">选择主题与深浅模式，立即生效，保存在本机。</p>
        </CardHeader>
        <CardBody>
          <ThemeSwitcher />
        </CardBody>
      </Card>

      {user?.role === 'admin' && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">管理员</h2>
          </CardHeader>
          <CardBody>
            <Link to="/admin">
              <Button variant="secondary" size="sm">
                前往管理面板
              </Button>
            </Link>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">下载应用</h2>
          <p className="text-fg-muted mt-1 text-xs">
            安装桌面端或 Android 客户端，登录同一账号即可同步数据。
          </p>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-2">
          {DOWNLOADS.map((d) => (
            <a key={d.href} href={d.href} download>
              <Button variant="secondary" size="sm">
                {d.label}
              </Button>
            </a>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
