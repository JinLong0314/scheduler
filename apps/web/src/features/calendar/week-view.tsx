import { cn } from '@kairo/ui';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../shared/lib/api-client';
import { QuickCreateDialog } from '../create/quick-create-dialog';
import { useEvents, type EventItem } from '../events/use-events';
import { useTodosRange, type TodoItem } from '../todos/use-todos';

const HOUR_PX = 48;
const START_HOUR = 0;
const END_HOUR = 24;
const DAY_MS = 86_400_000;

const COLOR_KEYS: Record<string, string> = {
  accent: 'var(--color-accent)',
  'event-1': 'var(--color-event-1)',
  'event-2': 'var(--color-event-2)',
  'event-3': 'var(--color-event-3)',
  'event-4': 'var(--color-event-4)',
  'event-5': 'var(--color-event-5)',
};

function mondayOf(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  const day = r.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  r.setDate(r.getDate() + diff);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatHour(h: number): string {
  return String(h).padStart(2, '0') + ':00';
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtRangeLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const m1 = weekStart.getMonth() + 1;
  const d1 = weekStart.getDate();
  const m2 = end.getMonth() + 1;
  const d2 = end.getDate();
  return `${weekStart.getFullYear()} · ${m1}/${d1} - ${m2}/${d2}`;
}

export function WeekView() {
  const [anchor, setAnchor] = useState(() => new Date());
  const weekStart = useMemo(() => mondayOf(anchor), [anchor]);
  // null = closed; '' or ISO = open
  const [creating, setCreating] = useState<string | null>(null);

  const from = weekStart.toISOString();
  const to = addDays(weekStart, 7).toISOString();
  const { data: eventsData } = useEvents(from, to);
  const events = eventsData?.items ?? [];

  const { data: todosData } = useTodosRange(from, to);
  const allTodos = todosData?.items ?? [];

  const qc = useQueryClient();
  const toggleTodo = useMutation({
    mutationFn: (t: TodoItem) =>
      api<TodoItem>(`/todos/${t.id}`, {
        method: 'PATCH',
        json: { completed: !t.completed, version: t.version },
      }),
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'CHILDREN_INCOMPLETE') {
        alert('请先完成所有子任务。');
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <>
      <div className="border-border bg-surface flex h-full flex-col rounded-lg border shadow-sm">
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">周视图</h2>
            <p className="text-fg-muted text-xs">{fmtRangeLabel(weekStart)}</p>
          </div>
          <div className="flex gap-1">
            <NavButton onClick={() => setAnchor((a) => addDays(a, -7))} label="上一周" />
            <NavButton onClick={() => setAnchor(new Date())} label="本周" />
            <NavButton onClick={() => setAnchor((a) => addDays(a, 7))} label="下一周" />
            <NavButton onClick={() => setCreating('')} label="+ 新建" highlight />
          </div>
        </div>

        <div className="relative flex-1 overflow-auto">
          <div
            className="grid min-w-[720px]"
            style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}
          >
            {/* header row + todos shelf */}
            <div className="border-border bg-surface sticky top-0 z-10 border-b" />
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(weekStart, i);
              const isToday = isoDate(d) === isoDate(new Date());
              const isWeekend = i >= 5;
              const dayIso = isoDate(d);
              const dayTodos = allTodos.filter((t) => t.scheduledDate === dayIso && !t.parentId);
              return (
                <div
                  key={i}
                  className={cn(
                    'border-border bg-surface sticky top-0 z-10 border-b border-l px-1.5 py-1.5',
                    isWeekend && 'bg-[color:var(--color-weekend)]/20',
                  )}
                >
                  {/* Day name + date */}
                  <div className="flex items-center justify-between">
                    <span className="text-fg-muted text-[10px]">
                      {['一', '二', '三', '四', '五', '六', '日'][i]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCreating(d.toISOString())}
                      className="text-fg-muted hover:bg-surface-muted hover:text-fg rounded px-1 py-0.5 text-[10px] opacity-0 transition group-hover:opacity-100"
                      title={`在 ${dayIso} 新建`}
                    >
                      +
                    </button>
                  </div>
                  <div
                    className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm',
                      isToday && 'bg-accent text-accent-fg font-semibold',
                    )}
                  >
                    {d.getDate()}
                  </div>
                  {/* Compact todos for this day */}
                  {dayTodos.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayTodos.slice(0, 2).map((t) => (
                        <TodoChip key={t.id} todo={t} onToggle={(tt) => toggleTodo.mutate(tt)} />
                      ))}
                      {dayTodos.length > 2 && (
                        <span className="text-fg-muted block text-[10px]">
                          +{dayTodos.length - 2} 项
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* time column + day columns */}
            <div className="relative">
              {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                <div
                  key={i}
                  className="border-border text-fg-muted relative border-b text-[11px]"
                  style={{ height: HOUR_PX }}
                >
                  <span className="absolute -top-2 right-1.5">{formatHour(START_HOUR + i)}</span>
                </div>
              ))}
            </div>

            {Array.from({ length: 7 }, (_, i) => {
              const dayStart = addDays(weekStart, i);
              const dayStartMs = dayStart.getTime();
              const dayEvents = events.filter((e) => {
                const t = new Date(e.startAt).getTime();
                return t >= dayStartMs && t < dayStartMs + DAY_MS;
              });
              return (
                <div
                  key={i}
                  className={cn(
                    'border-border relative border-l',
                    i >= 5 && 'bg-[color:var(--color-weekend)]/10',
                  )}
                >
                  {Array.from({ length: END_HOUR - START_HOUR }, (_, h) => (
                    <div
                      key={h}
                      className="border-border/60 border-b"
                      style={{ height: HOUR_PX }}
                    />
                  ))}
                  {dayEvents.map((e) => (
                    <EventBlock key={e.id} e={e} dayStartMs={dayStartMs} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {creating !== null && (
        <QuickCreateDialog
          defaultTab="event"
          {...(creating ? { defaultStart: creating } : {})}
          onClose={() => setCreating(null)}
        />
      )}
    </>
  );
}

function EventBlock({ e, dayStartMs }: { e: EventItem; dayStartMs: number }) {
  const start = new Date(e.startAt).getTime();
  const end = new Date(e.endAt).getTime();
  const top = Math.max(0, ((start - dayStartMs) / 3_600_000) * HOUR_PX);
  const height = Math.max(20, ((end - start) / 3_600_000) * HOUR_PX - 2);
  const color = COLOR_KEYS[e.colorKey] ?? COLOR_KEYS.accent;
  return (
    <div
      className="absolute left-1 right-1 overflow-hidden rounded-sm border border-white/20 px-1.5 py-1 text-[11px] text-white shadow-sm"
      style={{ top, height, background: color }}
      title={`${e.title}\n${new Date(e.startAt).toLocaleTimeString()} - ${new Date(e.endAt).toLocaleTimeString()}`}
    >
      <div className="truncate font-semibold">{e.title}</div>
      <div className="truncate opacity-80">
        {new Date(e.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
        {new Date(e.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}

function NavButton({
  onClick,
  label,
  highlight,
}: {
  onClick: () => void;
  label: string;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-3 py-1 text-xs transition',
        highlight
          ? 'border-accent bg-accent text-accent-fg hover:opacity-90'
          : 'border-border bg-surface text-fg hover:bg-surface-muted',
      )}
    >
      {label}
    </button>
  );
}

function TodoChip({ todo, onToggle }: { todo: TodoItem; onToggle: (t: TodoItem) => void }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(todo)}
      className={cn(
        'hover:bg-surface-muted flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] transition',
      )}
    >
      <span
        className={cn(
          'flex h-3 w-3 shrink-0 items-center justify-center rounded-full border',
          todo.completed ? 'border-success bg-success text-white' : 'border-border-strong',
        )}
      >
        {todo.completed && '✓'}
      </span>
      <span className={cn('truncate', todo.completed && 'text-fg-muted line-through')}>
        {todo.title}
      </span>
    </button>
  );
}
