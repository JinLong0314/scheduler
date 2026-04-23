import { Button, Card, CardBody, CardHeader, ThemeSwitcher } from '@kairo/ui';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../shared/lib/api-client';
import { useAuthStore } from '../../shared/lib/auth-store';
import { WeekView } from '../calendar/week-view';
import { TodoList } from '../todos/todo-list';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const [date, setDate] = useState<string>(today());

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    clear();
    navigate('/login', { replace: true });
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 12) return '早上好';
    if (h < 18) return '下午好';
    return '晚上好';
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col gap-4 p-4 lg:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full flex-shrink-0 flex-col gap-4 lg:w-72">
        <Card>
          <CardBody className="space-y-3">
            <div>
              <div className="text-xs text-fg-muted">{greeting}，</div>
              <div className="text-lg font-semibold">{user?.displayName ?? '访客'}</div>
              <div className="text-[11px] text-fg-muted">{user?.email}</div>
            </div>
            <div className="flex gap-2">
              {user?.role === 'admin' && (
                <Link to="/admin" className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    管理
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={logout}>
                退出
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">选择日期</h3>
          </CardHeader>
          <CardBody>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">外观</h3>
          </CardHeader>
          <CardBody>
            <ThemeSwitcher />
          </CardBody>
        </Card>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col gap-4">
        <TodoList date={date} />
        <div className="min-h-[600px]">
          <WeekView />
        </div>
      </main>
    </div>
  );
}
