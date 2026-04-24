import { Button, Input, Label } from '@kairo/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../shared/lib/api-client';
import type { EventItem } from './use-events';

interface Props {
  event: EventItem | null;
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

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(dtLocal: string): string {
  return new Date(dtLocal).toISOString();
}

export function EventDetailDialog({ event, onClose }: Props) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const [title, setTitle] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [description, setDescription] = useState('');
  const [colorKey, setColorKey] = useState('accent');
  const [error, setError] = useState<string | null>(null);

  function enterEdit(e: EventItem) {
    setTitle(e.title);
    setStartAt(toDatetimeLocal(e.startAt));
    setEndAt(toDatetimeLocal(e.endAt));
    setAllDay(e.allDay);
    setDescription(e.description ?? '');
    setColorKey(e.colorKey);
    setError(null);
    setMode('edit');
  }

  const deleteMutation = useMutation({
    mutationFn: () => api(`/events/${event!.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api<EventItem>(`/events/${event!.id}`, {
        method: 'PATCH',
        json: {
          version: event!.version,
          patch: {
            title: title.trim(),
            description: description.trim() || null,
            startAt: toIso(startAt),
            endAt: toIso(endAt),
            allDay,
            colorKey,
          },
        },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : '更新失败');
    },
  });

  if (!event) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    updateMutation.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border-border w-full max-w-sm rounded-xl border p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mb-3 h-1.5 w-full rounded-full"
          style={{ background: `var(--color-${mode === 'edit' ? colorKey : event.colorKey})` }}
        />

        {mode === 'view' ? (
          <>
            <h2 className="text-fg mb-3 text-base font-semibold">{event.title}</h2>

            <div className="text-fg-muted mb-4 space-y-1 text-sm">
              {event.allDay ? (
                <p>全天</p>
              ) : (
                <>
                  <p>开始：{formatDatetime(event.startAt)}</p>
                  <p>结束：{formatDatetime(event.endAt)}</p>
                </>
              )}
              {event.description && <p className="mt-2 text-xs">{event.description}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="text-red-500 hover:text-red-600"
              >
                删除
              </Button>
              <Button variant="ghost" size="sm" onClick={() => enterEdit(event)}>
                编辑
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                关闭
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>标题 *</Label>
              <Input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="事件名称…"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editAllDay"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--color-accent)]"
              />
              <label htmlFor="editAllDay" className="cursor-pointer select-none text-sm">
                全天事件
              </label>
            </div>

            {!allDay && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>开始时间</Label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="border-border bg-surface text-fg focus:border-accent focus:ring-ring/30 h-9 w-full rounded-md border px-2 text-xs outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <Label>结束时间</Label>
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="border-border bg-surface text-fg focus:border-accent focus:ring-ring/30 h-9 w-full rounded-md border px-2 text-xs outline-none focus:ring-2"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>备注</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="（可选）"
                rows={2}
                className="border-border bg-surface text-fg focus:border-accent focus:ring-ring/30 w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2"
              />
            </div>

            <div>
              <Label>颜色</Label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColorKey(c.key)}
                    title={c.label}
                    className={`h-6 w-6 rounded-full border-2 transition ${
                      colorKey === c.key ? 'border-fg scale-110' : 'border-transparent'
                    }`}
                    style={{ background: c.var }}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-danger text-xs">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMode('view')}
                disabled={updateMutation.isPending}
              >
                取消
              </Button>
              <Button type="submit" size="sm" disabled={!title.trim() || updateMutation.isPending}>
                {updateMutation.isPending ? '保存中…' : '保存'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
