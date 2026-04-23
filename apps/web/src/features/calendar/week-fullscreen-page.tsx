import { Button } from '@kairo/ui';
import { Link } from 'react-router-dom';
import { WeekView } from '../calendar/week-view';

export function WeekFullscreenPage() {
  return (
    <div className="bg-bg flex h-screen w-screen flex-col">
      <header className="border-border bg-surface flex shrink-0 items-center justify-between border-b px-4 py-2">
        <h1 className="text-sm font-semibold">本周视图 · 全屏</h1>
        <Link to="/">
          <Button variant="ghost" size="sm">
            返回首页
          </Button>
        </Link>
      </header>
      <div className="flex-1 overflow-hidden p-2">
        <WeekView />
      </div>
    </div>
  );
}
