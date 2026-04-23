import { Button, Card, CardBody, CardHeader, Input } from '@kairo/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../shared/lib/api-client';
import { useTodos, type TodoItem } from './use-todos';

interface Props {
  date: string; // YYYY-MM-DD
}

export function TodoList({ date }: Props) {
  const { data, isLoading } = useTodos(date);
  const qc = useQueryClient();
  const [title, setTitle] = useState('');

  const create = useMutation({
    mutationFn: (t: string) =>
      api<TodoItem>('/todos', {
        method: 'POST',
        json: { title: t, scheduledDate: date, rollover: true, parentId: null },
      }),
    onSuccess: () => {
      setTitle('');
      void qc.invalidateQueries({ queryKey: ['todos', date] });
    },
  });

  const toggle = useMutation({
    mutationFn: (t: TodoItem) =>
      api<TodoItem>(`/todos/${t.id}`, {
        method: 'PATCH',
        json: { completed: !t.completed, version: t.version },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['todos', date] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/todos/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['todos', date] }),
  });

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">待办 · {date}</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            {items.filter((t) => !t.completed).length} 项未完成 / {items.length} 项
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = title.trim();
            if (t) create.mutate(t);
          }}
          className="flex gap-2"
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="添加新任务…"
            className="flex-1"
          />
          <Button type="submit" size="md" disabled={!title.trim() || create.isPending}>
            添加
          </Button>
        </form>

        {isLoading ? (
          <p className="text-sm text-fg-muted">加载中…</p>
        ) : items.length === 0 ? (
          <p className="rounded-md bg-surface-muted p-4 text-center text-sm text-fg-muted">
            今天没有任务，享受平静 🍵
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((t) => (
              <li
                key={t.id}
                className="group flex items-center gap-3 rounded-md border border-transparent px-2 py-2 hover:border-border hover:bg-surface-muted"
              >
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => toggle.mutate(t)}
                  className="h-4 w-4 accent-[color:var(--color-accent)]"
                />
                <span
                  className={
                    t.completed ? 'flex-1 text-sm text-fg-muted line-through' : 'flex-1 text-sm'
                  }
                >
                  {t.title}
                </span>
                <button
                  type="button"
                  onClick={() => remove.mutate(t.id)}
                  className="text-xs text-fg-muted opacity-0 transition hover:text-danger group-hover:opacity-100"
                  aria-label="删除"
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
