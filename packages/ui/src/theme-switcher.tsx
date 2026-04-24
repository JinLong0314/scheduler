import { themeList } from '@kairo/themes';
import { cn } from './cn.js';
import { useTheme } from './theme-provider.js';

export interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { themeId, setThemeId, preference, setPreference } = useTheme();

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div>
        <div className="mb-2 text-xs font-medium text-[color:var(--color-fg-muted)]">主题</div>
        <div className="flex flex-wrap gap-2">
          {themeList.map((t) => {
            const active = t.id === themeId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeId(t.id)}
                aria-pressed={active}
                className={cn(
                  'group flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm transition',
                  'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-fg)]',
                  'hover:border-[color:var(--color-border-strong)]',
                  active &&
                    'ring-[color:var(--color-ring)]/40 border-[color:var(--color-accent)] ring-2',
                )}
              >
                <span aria-hidden className="text-lg leading-none">
                  {t.preview}
                </span>
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium text-[color:var(--color-fg-muted)]">外观</div>
        <div className="inline-flex overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)]">
          {(['light', 'system', 'dark'] as const).map((p) => {
            const active = p === preference;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPreference(p)}
                aria-pressed={active}
                className={cn(
                  'px-3 py-1.5 text-sm transition',
                  active
                    ? 'bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)]'
                    : 'bg-[color:var(--color-surface)] text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-muted)]',
                )}
              >
                {p === 'light' ? '浅色' : p === 'dark' ? '深色' : '跟随系统'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
