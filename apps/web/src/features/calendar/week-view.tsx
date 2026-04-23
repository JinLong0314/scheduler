import { cn } from '@kairo/ui';
import { useMemo, useState } from 'react';
import { useEvents, type EventItem } from '../events/use-events';

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

  const from = weekStart.toISOString();
  const to = addDays(weekStart, 7).toISOString();
  const { data } = useEvents(from, to);
  const events = data?.items ?? [];

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">周视图</h2>
          <p className="text-xs text-fg-muted">{fmtRangeLabel(weekStart)}</p>
        </div>
        <div className="flex gap-1">
          <NavButton onClick={() => setAnchor((a) => addDays(a, -7))} label="上一周" />
          <NavButton onClick={() => setAnchor(new Date())} label="本周" />
          <NavButton onClick={() => setAnchor((a) => addDays(a, 7))} label="下一周" />
        </div>
      </div>

      <div className="relative flex-1 overflow-auto">
        <div className="grid min-w-[720px]" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
          {/* header row */}
          <div className="sticky top-0 z-10 border-b border-border bg-surface" />
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(weekStart, i);
            const isToday = isoDate(d) === isoDate(new Date());
            const isWeekend = i >= 5;
            return (
              <div
                key={i}
                className={cn(
                  'sticky top-0 z-10 border-b border-l border-border bg-surface px-2 py-2 text-center',
                  isWeekend && 'bg-[color:var(--color-weekend)]/30',
                )}
              >
                <div className="text-[11px] text-fg-muted">
                  {['一', '二', '三', '四', '五', '六', '日'][i]}
                </div>
                <div
                  className={cn(
                    'mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm',
                    isToday && 'bg-accent text-accent-fg font-semibold',
                  )}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}

          {/* time column + day columns */}
          <div className="relative">
            {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
              <div
                key={i}
                className="relative border-b border-border text-[11px] text-fg-muted"
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
                  'relative border-l border-border',
                  i >= 5 && 'bg-[color:var(--color-weekend)]/10',
                )}
              >
                {Array.from({ length: END_HOUR - START_HOUR }, (_, h) => (
                  <div
                    key={h}
                    className="border-b border-border/60"
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

function NavButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-fg transition hover:bg-surface-muted"
    >
      {label}
    </button>
  );
}
