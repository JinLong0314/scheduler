import { cn } from '@kairo/ui';
import { useMemo } from 'react';
import { useEvents, type EventItem } from '../events/use-events';
import { useTodosRange, type TodoItem } from '../todos/use-todos';

interface MonthViewProps {
  anchor: Date;
  onDayClick?: (iso: string) => void;
  selectedIso?: string;
  /** Called when the user clicks "+" on a day cell to create a new item */
  onCreateClick?: (iso: string) => void;
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

export function MonthView({ anchor, onDayClick, selectedIso, onCreateClick }: MonthViewProps) {
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

  const { data: eventsData } = useEvents(from, to);
  const events = eventsData?.items ?? [];

  const { data: todosData } = useTodosRange(from, to);
  const todos = todosData?.items ?? [];

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

  const todosByDay = useMemo(() => {
    const map = new Map<string, TodoItem[]>();
    for (const t of todos) {
      const k = t.scheduledDate;
      const arr = map.get(k);
      if (arr) arr.push(t);
      else map.set(k, [t]);
    }
    return map;
  }, [todos]);

  const currentMonth = anchor.getMonth();
  const todayIso = isoDate(new Date());

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg">
      {/* Weekday header */}
      <div className="border-border bg-surface-muted/50 grid grid-cols-7 border-b">
        {['一', '二', '三', '四', '五', '六', '日'].map((w, i) => (
          <div
            key={w}
            className={cn(
              'text-fg-muted py-2 text-center text-[11px] font-medium',
              i >= 5 && 'text-weekend',
            )}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid flex-1 grid-cols-7 overflow-hidden">
        {days.map((d, i) => {
          const iso = isoDate(d);
          const inMonth = d.getMonth() === currentMonth;
          const isToday = iso === todayIso;
          const isSelected = iso === selectedIso;
          const isWeekend = i % 7 >= 5;
          const dayEvents = byDay.get(iso) ?? [];
          const dayTodos = todosByDay.get(iso) ?? [];
          const pendingTodos = dayTodos.filter((t) => !t.completed);
          const totalItems = dayEvents.length + dayTodos.length;

          return (
            <div
              key={iso}
              className={cn(
                'border-border group relative flex min-h-[88px] flex-col border-b border-r p-1.5',
                i % 7 === 0 && 'border-l-0',
                isWeekend && 'bg-[color:var(--color-weekend)]/8',
                !inMonth && 'opacity-40',
                isSelected && !isToday && 'bg-selected/10 ring-accent ring-1 ring-inset',
              )}
            >
              {/* Date header */}
              <div className="flex items-start justify-between">
                <button
                  type="button"
                  onClick={() => onDayClick?.(iso)}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition',
                    isToday
                      ? 'bg-accent text-accent-fg shadow-sm'
                      : 'hover:bg-surface-muted text-fg',
                  )}
                >
                  {d.getDate()}
                </button>

                {/* + button on hover */}
                <button
                  type="button"
                  onClick={() => onCreateClick?.(iso)}
                  className="text-fg-muted hover:bg-surface-muted hover:text-accent flex h-5 w-5 items-center justify-center rounded text-[13px] font-light opacity-0 transition group-hover:opacity-100"
                  title={`在 ${iso} 新建`}
                  aria-label={`在 ${iso} 新建`}
                >
                  +
                </button>
              </div>

              {/* Item chips */}
              <div className="mt-1 space-y-0.5 overflow-hidden">
                {/* Events */}
                {dayEvents.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-0.5 truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
                    style={{ background: COLOR_KEYS[e.colorKey] ?? COLOR_KEYS.accent }}
                    title={e.title}
                  >
                    {!e.allDay && (
                      <span className="shrink-0 opacity-80">
                        {new Date(e.startAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    <span className="truncate">{e.title}</span>
                  </div>
                ))}

                {/* Todos */}
                {dayTodos.slice(0, Math.max(0, 3 - dayEvents.slice(0, 2).length)).map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      'flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[10px]',
                      t.completed
                        ? 'bg-surface-muted text-fg-muted line-through'
                        : 'bg-surface border-border text-fg border',
                    )}
                    title={t.title}
                  >
                    <span
                      className={cn('shrink-0', t.completed ? 'text-success' : 'text-fg-muted')}
                    >
                      {t.completed ? '✓' : '○'}
                    </span>
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}

                {/* Overflow */}
                {totalItems > 3 && (
                  <div className="text-fg-muted px-1.5 text-[10px]">+{totalItems - 3} 项</div>
                )}
              </div>

              {/* Pending todos badge */}
              {pendingTodos.length > 0 &&
                dayTodos.length === pendingTodos.length &&
                dayEvents.length === 0 && (
                  <div className="absolute bottom-1 right-1.5">
                    <span className="bg-warning/20 text-warning inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-semibold">
                      {pendingTodos.length}
                    </span>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
