import { Button, Input, Label, cn } from '@kairo/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../shared/lib/api-client';
import type { EventItem } from '../events/use-events';
import type { TodoItem } from '../todos/use-todos';

type Tab = 'todo' | 'event';

interface Props {
  /** Which tab to show by default */
  defaultTab?: Tab | undefined;
  /** Pre-selected date for todo (YYYY-MM-DD) */
  defaultDate?: string | undefined;
  /** Pre-filled start time for event (ISO) */
  defaultStart?: string | undefined;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { key: 'accent', label: '默认', css: 'var(--color-accent)' },
  { key: 'event-1', label: '蓝', css: 'var(--color-event-1)' },
  { key: 'event-2', label: '绿', css: 'var(--color-event-2)' },
  { key: 'event-3', label: '橙', css: 'var(--color-event-3)' },
  { key: 'event-4', label: '紫', css: 'var(--color-event-4)' },
  { key: 'event-5', label: '红', css: 'var(--color-event-5)' },
];

function toDatetimeLocal(iso: string) {
  return iso.slice(0, 16);
}
function localToIso(dtLocal: string) {
  return new Date(dtLocal).toISOString();
}
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function nextHourIso() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.toISOString();
}

export function QuickCreateDialog({
  defaultTab = 'todo',
  defaultDate,
  defaultStart,
  onClose,
}: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [error, setError] = useState<string | null>(null);

  // ── Event form ────────────────────────────────────────────────────────────
  const startIso = defaultStart ?? nextHourIso();
  const endIso = new Date(new Date(startIso).getTime() + 3_600_000).toISOString();
  const [eventTitle, setEventTitle] = useState('');
  const [startAt, setStartAt] = useState(toDatetimeLocal(startIso));
  const [endAt, setEndAt] = useState(toDatetimeLocal(endIso));
  const [allDay, setAllDay] = useState(false);
  const [colorKey, setColorKey] = useState('accent');
  const [createLinkedTodo, setCreateLinkedTodo] = useState(false);

  // ── Todo form ─────────────────────────────────────────────────────────────
  const [todoTitle, setTodoTitle] = useState('');
  const [todoDate, setTodoDate] = useState(defaultDate ?? todayIso());
  const [rollover, setRollover] = useState(true);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createEvent = useMutation({
    mutationFn: () =>
      api<EventItem>('/events', {
        method: 'POST',
        json: {
          title: eventTitle.trim(),
          startAt: allDay ? `${startAt.slice(0, 10)}T00:00:00.000Z` : localToIso(startAt),
          endAt: allDay ? `${startAt.slice(0, 10)}T23:59:59.000Z` : localToIso(endAt),
          allDay,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          colorKey,
          createLinkedTodo,
        },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events'] });
      if (createLinkedTodo) {
        void qc.invalidateQueries({ queryKey: ['todos', localToIso(startAt).slice(0, 10)] });
        void qc.invalidateQueries({ queryKey: ['todos', 'range'] });
      }
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : '创建失败'),
  });

  const createTodo = useMutation({
    mutationFn: () =>
      api<TodoItem>('/todos', {
        method: 'POST',
        json: { title: todoTitle.trim(), scheduledDate: todoDate, rollover, parentId: null },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['todos', todoDate] });
      void qc.invalidateQueries({ queryKey: ['todos', 'range'] });
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : '创建失败'),
  });

  const isPending = createEvent.isPending || createTodo.isPending;
  const canSubmit = tab === 'todo' ? !!todoTitle.trim() : !!eventTitle.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (tab === 'todo') createTodo.mutate();
    else createEvent.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="border-border bg-surface w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="新建"
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="text-base font-semibold">新建</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="text-fg-muted hover:bg-surface-muted hover:text-fg flex h-7 w-7 items-center justify-center rounded-full transition"
          >
            ✕
          </button>
        </div>

        {/* Tab bar */}
        <div className="border-border flex border-b">
          {(
            [
              { key: 'todo', icon: '✓', label: '待办事项' },
              { key: 'event', icon: '📅', label: '日程事件' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setError(null);
              }}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition',
                tab === t.key
                  ? 'border-accent text-accent border-b-2'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {tab === 'todo' ? (
            <>
              <div>
                <Label>任务标题 *</Label>
                <Input
                  autoFocus
                  value={todoTitle}
                  onChange={(e) => setTodoTitle(e.target.value)}
                  placeholder="要做什么？"
                />
              </div>

              <div>
                <Label>计划日期</Label>
                <input
                  type="date"
                  value={todoDate}
                  onChange={(e) => setTodoDate(e.target.value)}
                  className="border-border bg-surface text-fg focus:border-accent focus:ring-ring/30 h-10 w-full rounded-lg border px-3 text-sm outline-none transition focus:ring-2"
                />
              </div>

              <label className="bg-surface-muted hover:bg-surface-muted/80 flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm transition">
                <input
                  type="checkbox"
                  checked={rollover}
                  onChange={(e) => setRollover(e.target.checked)}
                  className="h-4 w-4 accent-[color:var(--color-accent)]"
                />
                <div>
                  <div className="font-medium">未完成自动顺延</div>
                  <div className="text-fg-muted mt-0.5 text-xs">
                    每天自动顺延到次日，直到完成为止
                  </div>
                </div>
              </label>
            </>
          ) : (
            <>
              <div>
                <Label>事件标题 *</Label>
                <Input
                  autoFocus
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="事件名称…"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="h-4 w-4 accent-[color:var(--color-accent)]"
                />
                全天事件
              </label>

              {!allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>开始时间</Label>
                    <input
                      type="datetime-local"
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      className="border-border bg-surface text-fg focus:border-accent focus:ring-ring/30 h-10 w-full rounded-lg border px-3 text-sm outline-none transition focus:ring-2"
                    />
                  </div>
                  <div>
                    <Label>结束时间</Label>
                    <input
                      type="datetime-local"
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                      className="border-border bg-surface text-fg focus:border-accent focus:ring-ring/30 h-10 w-full rounded-lg border px-3 text-sm outline-none transition focus:ring-2"
                    />
                  </div>
                </div>
              )}

              {/* Color picker */}
              <div>
                <Label>颜色</Label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setColorKey(c.key)}
                      title={c.label}
                      className={cn(
                        'h-7 w-7 rounded-full border-2 transition hover:scale-110',
                        colorKey === c.key ? 'border-fg scale-110 shadow-md' : 'border-transparent',
                      )}
                      style={{ background: c.css }}
                      aria-label={c.label}
                    />
                  ))}
                </div>
              </div>

              <label className="bg-surface-muted hover:bg-surface-muted/80 flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm transition">
                <input
                  type="checkbox"
                  checked={createLinkedTodo}
                  onChange={(e) => setCreateLinkedTodo(e.target.checked)}
                  className="h-4 w-4 accent-[color:var(--color-accent)]"
                />
                <div>
                  <div className="font-medium">同时创建关联待办</div>
                  <div className="text-fg-muted mt-0.5 text-xs">自动生成与此事件绑定的待办任务</div>
                </div>
              </label>
            </>
          )}

          {error && (
            <p className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-xs">{error}</p>
          )}

          <div className="flex justify-end gap-2 pb-1 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} size="md">
              取消
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit} size="md">
              {isPending ? '创建中…' : '创建'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
