import { Button, Input, Label } from '@kairo/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../shared/lib/api-client';
import type { EventItem } from './use-events';

interface Props {
  /** Pre-filled startAt ISO string (optional) */
  defaultStart?: string;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { key: 'accent', label: '默认', var: 'var(--color-accent)' },
  { key: 'event-1', label: '蓝', var: 'var(--color-event-1)' },
  { key: 'event-2', label: '绿', var: 'var(--color-event-2)' },
  { key: 'event-3', label: '橙', var: 'var(--color-event-3)' },
  { key: 'event-4', label: '紫', var: 'var(--color-event-4)' },
  { key: 'event-5', label: '红', var: 'var(--color-event-5)' },
];

function toDatetimeLocal(iso: string): string {
  // datetime-local inputs accept "YYYY-MM-DDTHH:mm"
  return iso.slice(0, 16);
}

function toIso(dtLocal: string): string {
  // assumes local timezone
  return new Date(dtLocal).toISOString();
}

function defaultStartIso(hint?: string): string {
  if (hint) return hint;
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.toISOString();
}

function addHour(iso: string): string {
  const d = new Date(iso);
  d.setHours(d.getHours() + 1);
  return d.toISOString();
}

export function EventCreateDialog({ defaultStart, onClose }: Props) {
  const qc = useQueryClient();
  const startIso = defaultStartIso(defaultStart);

  const [title, setTitle] = useState('');
  const [startAt, setStartAt] = useState(toDatetimeLocal(startIso));
  const [endAt, setEndAt] = useState(toDatetimeLocal(addHour(startIso)));
  const [allDay, setAllDay] = useState(false);
  const [colorKey, setColorKey] = useState('accent');
  const [createLinkedTodo, setCreateLinkedTodo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      api<EventItem>('/events', {
        method: 'POST',
        json: {
          title: title.trim(),
          startAt: toIso(startAt),
          endAt: toIso(endAt),
          allDay,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          colorKey,
          createLinkedTodo,
        },
      }),
    onSuccess: () => {
      // Invalidate all event query keys to refresh week/month views
      void qc.invalidateQueries({ queryKey: ['events'] });
      // Also invalidate todos if linked todo was created
      if (createLinkedTodo) {
        const dateStr = toIso(startAt).slice(0, 10);
        void qc.invalidateQueries({ queryKey: ['todos', dateStr] });
      }
      onClose();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : '创建失败');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    create.mutate();
  }

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdrop}
    >
      <div className="border-border bg-surface w-full max-w-md rounded-lg border shadow-lg">
        <div className="border-border border-b px-5 py-4">
          <h2 className="text-base font-semibold">新建日程事件</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {/* Title */}
          <div>
            <Label>标题 *</Label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="事件名称…"
            />
          </div>

          {/* All day toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 accent-[color:var(--color-accent)]"
            />
            <label htmlFor="allDay" className="cursor-pointer select-none text-sm">
              全天事件
            </label>
          </div>

          {/* Time range */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>开始时间</Label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="border-border bg-surface text-fg focus:border-accent focus:ring-ring/30 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2"
                />
              </div>
              <div>
                <Label>结束时间</Label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="border-border bg-surface text-fg focus:border-accent focus:ring-ring/30 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2"
                />
              </div>
            </div>
          )}

          {/* Color */}
          <div>
            <Label>颜色</Label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColorKey(c.key)}
                  title={c.label}
                  className={`h-7 w-7 rounded-full border-2 transition ${
                    colorKey === c.key ? 'border-fg scale-110' : 'border-transparent'
                  }`}
                  style={{ background: c.var }}
                />
              ))}
            </div>
          </div>

          {/* Linked todo */}
          <div className="bg-surface-muted flex items-center gap-2 rounded-md p-3">
            <input
              type="checkbox"
              id="createLinkedTodo"
              checked={createLinkedTodo}
              onChange={(e) => setCreateLinkedTodo(e.target.checked)}
              className="h-4 w-4 accent-[color:var(--color-accent)]"
            />
            <label htmlFor="createLinkedTodo" className="cursor-pointer select-none text-sm">
              同时创建关联待办（TODO 绑定此事件）
            </label>
          </div>

          {error && <p className="text-danger text-xs">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={!title.trim() || create.isPending}>
              {create.isPending ? '创建中…' : '创建'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
