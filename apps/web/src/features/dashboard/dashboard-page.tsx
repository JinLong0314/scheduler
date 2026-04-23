import { Button, Card, CardBody, CardHeader } from '@kairo/ui';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../shared/lib/api-client';
import { useAuthStore } from '../../shared/lib/auth-store';
import { MonthView } from '../calendar/month-view';
import { WeekView } from '../calendar/week-view';
import { TodoList } from '../todos/todo-list';

type CalendarMode = 'month' | 'week';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

function monthLabel(d: Date): string {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const [date, setDate] = useState<string>(todayIso());
  const [mode, setMode] = useState<CalendarMode>('month');
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => new Date());

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
              <div className="text-fg-muted text-xs">{greeting}，</div>
              <div className="text-lg font-semibold">{user?.displayName ?? '访客'}</div>
              <div className="text-fg-muted text-[11px]">{user?.email}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/settings" className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">
                  设置
                </Button>
              </Link>
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
              className="border-border bg-surface text-fg focus:border-accent w-full rounded-md border px-3 py-2 text-sm outline-none"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">快捷入口</h3>
          </CardHeader>
          <CardBody>
            <Link to="/week">
              <Button variant="primary" size="sm" className="w-full">
                全屏周视图
              </Button>
            </Link>
          </CardBody>
        </Card>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col gap-4">
        <TodoList date={date} />

        <Card className="flex min-h-[640px] flex-col">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">日历</h2>
              {mode === 'month' && (
                <span className="text-fg-muted text-xs">{monthLabel(monthAnchor)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {mode === 'month' && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMonthAnchor((a) => addMonths(a, -1))}
                  >
                    ← 上月
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setMonthAnchor(new Date())}>
                    本月
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMonthAnchor((a) => addMonths(a, 1))}
                  >
                    下月 →
                  </Button>
                </div>
              )}
              <div className="border-border inline-flex overflow-hidden rounded-md border">
                <button
                  type="button"
                  onClick={() => setMode('month')}
                  className={
                    'px-3 py-1 text-xs transition ' +
                    (mode === 'month'
                      ? 'bg-accent text-accent-fg'
                      : 'bg-surface text-fg hover:bg-surface-muted')
                  }
                >
                  月视图
                </button>
                <button
                  type="button"
                  onClick={() => setMode('week')}
                  className={
                    'border-border border-l px-3 py-1 text-xs transition ' +
                    (mode === 'week'
                      ? 'bg-accent text-accent-fg'
                      : 'bg-surface text-fg hover:bg-surface-muted')
                  }
                >
                  周视图
                </button>
              </div>
            </div>
          </CardHeader>
          <CardBody className="flex-1 p-0">
            {mode === 'month' ? (
              <MonthView
                anchor={monthAnchor}
                selectedIso={date}
                onDayClick={(iso) => setDate(iso)}
              />
            ) : (
              <div className="h-[640px]">
                <WeekView />
              </div>
            )}
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
