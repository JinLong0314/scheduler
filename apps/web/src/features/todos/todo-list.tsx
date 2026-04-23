import { Button, Card, CardBody, CardHeader, Input } from '@kairo/ui';
import { cn } from '@kairo/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '../../shared/lib/api-client';
import { buildTree, useTodos, type TodoItem, type TreeNode } from './use-todos';

interface Props {
  date: string; // YYYY-MM-DD
}

export function TodoList({ date }: Props) {
  const { data, isLoading } = useTodos(date);
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (payload: { title: string; parentId: string | null }) =>
      api<TodoItem>('/todos', {
        method: 'POST',
        json: {
          title: payload.title,
          scheduledDate: date,
          rollover: payload.parentId === null, // root todos rollover; children follow parent
          parentId: payload.parentId,
        },
      }),
    onSuccess: () => {
      setTitle('');
      setAddError(null);
      void qc.invalidateQueries({ queryKey: ['todos', date] });
    },
  });

  const toggle = useMutation({
    mutationFn: async (t: TodoItem) => {
      return api<TodoItem & { parentCompletable?: boolean }>(`/todos/${t.id}`, {
        method: 'PATCH',
        json: { completed: !t.completed, version: t.version },
      });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'CHILDREN_INCOMPLETE') {
        alert('请先完成所有子任务，才能完成此任务。');
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['todos', date] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/todos/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['todos', date] }),
  });

  const flat = data?.items ?? [];
  const roots = buildTree(flat);
  const totalIncomplete = flat.filter((t) => !t.completed).length;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">待办 · {date}</h2>
          <p className="text-fg-muted mt-0.5 text-xs">
            {totalIncomplete} 项未完成 / {flat.length} 项
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        {/* Add root todo */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = title.trim();
            if (t) create.mutate({ title: t, parentId: null });
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
        {addError && <p className="text-danger text-xs">{addError}</p>}

        {isLoading ? (
          <p className="text-fg-muted text-sm">加载中…</p>
        ) : roots.length === 0 ? (
          <p className="bg-surface-muted text-fg-muted rounded-md p-4 text-center text-sm">
            今天没有任务，享受平静 🍵
          </p>
        ) : (
          <ul className="space-y-1">
            {roots.map((node) => (
              <TodoNode
                key={node.id}
                node={node}
                date={date}
                depth={0}
                onCreate={(payload) => create.mutate(payload)}
                onToggle={(t) => toggle.mutate(t)}
                onDelete={(id) => remove.mutate(id)}
              />
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

// ─── TodoNode (recursive) ─────────────────────────────────────────────────────

interface NodeProps {
  node: TreeNode;
  date: string;
  depth: number;
  onCreate: (payload: { title: string; parentId: string | null }) => void;
  onToggle: (t: TodoItem) => void;
  onDelete: (id: string) => void;
}

function TodoNode({ node, date, depth, onCreate, onToggle, onDelete }: NodeProps) {
  const [showAddChild, setShowAddChild] = useState(false);
  const [childTitle, setChildTitle] = useState('');
  const hasChildren = node.children.length > 0;
  const allChildrenDone = hasChildren && node.children.every((c) => c.completed);
  const canComplete = !hasChildren || allChildrenDone;
  const isLinked = !!node.linkedEventId;
  const isRollover = node.rollover && !node.completed;

  function submitChild(e: React.FormEvent) {
    e.preventDefault();
    const t = childTitle.trim();
    if (t) {
      onCreate({ title: t, parentId: node.id });
      setChildTitle('');
      setShowAddChild(false);
    }
  }

  return (
    <li>
      <div
        className={cn(
          'group flex items-start gap-2 rounded-md border border-transparent px-2 py-2',
          'hover:border-border hover:bg-surface-muted',
          depth > 0 && 'border-border/50 ml-6 border-l pl-4',
        )}
        style={depth > 1 ? { marginLeft: `${depth * 1.5}rem` } : undefined}
      >
        {/* Checkbox */}
        <div className="mt-0.5 flex items-center gap-1">
          <input
            type="checkbox"
            checked={node.completed}
            onChange={() => canComplete && onToggle(node)}
            disabled={!canComplete && !node.completed}
            title={!canComplete ? '请先完成所有子任务' : undefined}
            className="h-4 w-4 cursor-pointer accent-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
          />
        </div>

        {/* Title + badges */}
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              'text-sm',
              node.completed && 'text-fg-muted line-through',
              !node.completed && !canComplete && 'text-fg-muted/80',
            )}
          >
            {node.title}
          </span>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {isLinked && (
              <span className="bg-[color:var(--color-accent)]/15 text-accent rounded px-1.5 py-0.5 text-[10px]">
                📅 绑定事件
              </span>
            )}
            {isRollover && (
              <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 text-[10px]">
                ↻ 可顺延
              </span>
            )}
            {hasChildren && (
              <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 text-[10px]">
                {node.children.filter((c) => c.completed).length}/{node.children.length} 子任务
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
          {depth < 3 && (
            <button
              type="button"
              onClick={() => setShowAddChild((v) => !v)}
              className="text-fg-muted hover:bg-surface hover:text-fg rounded px-1.5 py-0.5 text-[11px]"
              title="添加子任务"
            >
              +子
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="text-fg-muted hover:text-danger rounded px-1.5 py-0.5 text-[11px]"
            aria-label="删除"
          >
            删除
          </button>
        </div>
      </div>

      {/* Inline add-child form */}
      {showAddChild && (
        <form onSubmit={submitChild} className={cn('ml-8 mt-1 flex gap-2', depth > 0 && 'ml-14')}>
          <Input
            autoFocus
            value={childTitle}
            onChange={(e) => setChildTitle(e.target.value)}
            placeholder="子任务名称…"
            className="flex-1 text-xs"
            onKeyDown={(e) => e.key === 'Escape' && setShowAddChild(false)}
          />
          <Button type="submit" size="sm" disabled={!childTitle.trim()}>
            添加
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddChild(false)}>
            取消
          </Button>
        </form>
      )}

      {/* Recurse into children */}
      {node.children.length > 0 && (
        <ul className="mt-1">
          {node.children.map((child) => (
            <TodoNode
              key={child.id}
              node={child}
              date={date}
              depth={depth + 1}
              onCreate={onCreate}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
