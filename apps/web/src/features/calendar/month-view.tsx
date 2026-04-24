import { cn } from '@kairo/ui';
import { useMemo, useState } from 'react';
import { EventDetailDialog } from '../events/event-detail-dialog';
import { useEvents, type EventItem } from '../events/use-events';
import { useTodosRange } from '../todos/use-todos';

interface MonthViewProps {
  anchor: Date;
  onDayClick?: (iso: string) => void;
  selectedIso?: string;
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
  const dayOfWeek = first.getDay();
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  first.setDate(first.getDate() - offset);
  first.setHours(0, 0, 0, 0);
  return first;
}

export function MonthView({ anchor, onDayClick, selectedIso, onCreateClick }: MonthViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

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

  const pendingByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of todos) {
      if (!t.completed) {
        map.set(t.scheduledDate, (map.get(t.scheduledDate) ?? 0) + 1);
      }
    }
    return map;
  }, [todos]);

  const currentMonth = anchor.getMonth();
  const todayIso = isoDate(new Date());

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden rounded-lg">
        {/* Weekday headers */}
        <div className="border-border bg-surface-muted/50 grid shrink-0 grid-cols-7 border-b">
          {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((w, i) => (
            <div
              key={w}
              className={cn(
                'text-fg-muted py-2 text-center text-[11px] font-medium',
                i >= 5 && 'text-[color:var(--color-weekend)]',
              )}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid min-h-0 flex-1 grid-cols-7 overflow-hidden">
          {days.map((d, i) => {
            const iso = isoDate(d);
            const inMonth = d.getMonth() === currentMonth;
            const isToday = iso === todayIso;
            const isSelected = iso === selectedIso;
            const isWeekend = i % 7 >= 5;
            const dayEvents = byDay.get(iso) ?? [];
            const pendingCount = pendingByDay.get(iso) ?? 0;

            return (
              <div
                key={iso}
                onClick={() => onDayClick?.(iso)}
                className={cn(
                  'border-border hover:bg-surface-muted/40 group relative flex cursor-pointer flex-col border-b border-r p-1.5 transition-colors',
                  i % 7 === 0 && 'border-l-0',
                  isWeekend && 'bg-[color:var(--color-weekend)]/6',
                  !inMonth && 'opacity-40',
                  isSelected && !isToday && 'ring-accent bg-accent/5 ring-1 ring-inset',
                )}
              >
                {/* Date number + actions row */}
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                      isToday ? 'bg-accent text-accent-fg shadow-sm' : 'text-fg',
                    )}
                  >
                    {d.getDate()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateClick?.(iso);
                    }}
                    className="text-fg-muted hover:text-accent flex h-5 w-5 items-center justify-center rounded text-[13px] opacity-0 transition group-hover:opacity-100"
                    aria-label={`在 ${iso} 新建`}
                  >
                    +
                  </button>
                </div>

                {/* Event chips */}
                <div className="mt-0.5 min-h-0 space-y-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setSelectedEvent(e);
                      }}
                      className="flex w-full items-center gap-0.5 truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium text-white shadow-sm transition hover:brightness-110"
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
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-fg-muted px-1 text-[10px]">+{dayEvents.length - 3} 项</div>
                  )}
                </div>

                {/* Pending todos badge */}
                {pendingCount > 0 && (
                  <div className="mt-auto pt-0.5">
                    <span className="text-fg-muted text-[9px]">待办 {pendingCount} 项</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event detail popup */}
      {selectedEvent && (
        <EventDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </>
  );
}
