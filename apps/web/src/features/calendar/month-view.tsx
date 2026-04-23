import { cn } from '@kairo/ui';
import { useMemo } from 'react';
import { useEvents, type EventItem } from '../events/use-events';

interface MonthViewProps {
  anchor: Date;
  onDayClick?: (iso: string) => void;
  selectedIso?: string;
}

const COLOR_KEYS: Record<string, string> = {
  accent: 'var(--color-accent)',
  'event-1': 'var(--color-event-1)',
  'event-2': 'var(--color-event-2)',
  'event-3': 'var(--color-event-3)',
  'event-4': 'var(--color-event-4)',
  'event-5': 'var(--color-event-5)',
};

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function startOfMonthGrid(anchor: Date): Date {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const dayOfWeek = first.getDay(); // 0 = Sun
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday start
  first.setDate(first.getDate() - offset);
  first.setHours(0, 0, 0, 0);
  return first;
}

export function MonthView({ anchor, onDayClick, selectedIso }: MonthViewProps) {
  const gridStart = useMemo(() => startOfMonthGrid(anchor), [anchor]);
  const days = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        return d;
      }),
    [gridStart],
  );

  const from = gridStart.toISOString();
  const toDate = new Date(gridStart);
  toDate.setDate(toDate.getDate() + 42);
  const to = toDate.toISOString();
  const { data } = useEvents(from, to);
  const events = data?.items ?? [];

  const byDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of events) {
      const k = isoDate(new Date(e.startAt));
      const arr = map.get(k);
      if (arr) arr.push(e);
      else map.set(k, [e]);
    }
    return map;
  }, [events]);

  const currentMonth = anchor.getMonth();
  const todayIso = isoDate(new Date());

  return (
    <div className="border-border bg-surface flex h-full flex-col rounded-lg border shadow-sm">
      <div className="border-border text-fg-muted grid grid-cols-7 border-b text-center text-[11px]">
        {['一', '二', '三', '四', '五', '六', '日'].map((w, i) => (
          <div key={w} className={cn('py-2', i >= 5 && 'bg-[color:var(--color-weekend)]/20')}>
            {w}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7">
        {days.map((d, i) => {
          const iso = isoDate(d);
          const inMonth = d.getMonth() === currentMonth;
          const isToday = iso === todayIso;
          const isSelected = iso === selectedIso;
          const isWeekend = i % 7 >= 5;
          const dayEvents = byDay.get(iso) ?? [];
          return (
            <button
              type="button"
              key={iso}
              onClick={() => onDayClick?.(iso)}
              className={cn(
                'border-border hover:bg-surface-muted flex min-h-[96px] flex-col items-stretch border-b border-l p-1.5 text-left transition',
                i % 7 === 0 && 'border-l-0',
                isWeekend && 'bg-[color:var(--color-weekend)]/10',
                !inMonth && 'opacity-50',
                isSelected && 'ring-accent ring-2 ring-inset',
              )}
            >
              <div className="flex items-center justify-between text-xs">
                <span
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full',
                    isToday && 'bg-accent text-accent-fg font-semibold',
                  )}
                >
                  {d.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-fg-muted text-[10px]">{dayEvents.length}</span>
                )}
              </div>
              <div className="mt-1 space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className="truncate rounded px-1 text-[10px] text-white"
                    style={{ background: COLOR_KEYS[e.colorKey] ?? COLOR_KEYS.accent }}
                    title={e.title}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-fg-muted text-[10px]">+{dayEvents.length - 3}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
