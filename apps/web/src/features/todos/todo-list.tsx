import { Card, CardBody, CardHeader, cn } from '@kairo/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../shared/lib/api-client';
import { buildTree, useTodos, type TodoItem, type TreeNode } from './use-todos';

interface Props {
  date: string; // YYYY-MM-DD
}

export function TodoList({ date }: Props) {
  const { data, isLoading } = useTodos(date);
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: (t: TodoItem) =>
      api<TodoItem & { parentCompletable?: boolean }>(`/todos/${t.id}`, {
        method: 'PATCH',
        json: { completed: !t.completed, version: t.version },
      }),
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'CHILDREN_INCOMPLETE') {
        alert('请先完成所有子任务，才能完成此任务。');
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['todos', date] }),
  });

  const flat = data?.items ?? [];
  const roots = buildTree(flat);
  const doneCount = flat.filter((t) => t.completed).length;
  const totalCount = flat.length;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">待办 · {date}</h2>
          <p className="text-fg-muted mt-0.5 text-xs">
            {doneCount}/{totalCount} 已完成{' '}
            {totalCount > doneCount && (
              <span className="text-accent ml-2">· {totalCount - doneCount} 项待处理</span>
            )}
          </p>
        </div>
        {totalCount > 0 && doneCount === totalCount && (
          <span className="bg-success/15 text-success rounded-full px-2 py-0.5 text-[11px] font-medium">
            全部完成 ✓{' '}
          </span>
        )}
      </CardHeader>

      <CardBody className="py-2">
        {isLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-muted h-8 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : roots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-2xl">🍵</div>
            <p className="text-fg-muted mt-2 text-sm">今天没有任务</p>
            <p className="text-fg-muted/70 text-xs">点击右下角 + 新建待办</p>
          </div>
        ) : (
          <ul className="space-y-0.5 pb-1">
            {roots.map((node) => (
              <TodoNode key={node.id} node={node} depth={0} onToggle={(t) => toggle.mutate(t)} />
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

// ─── TodoNode (recursive, read-only + complete) ───────────────────────────────

interface NodeProps {
  node: TreeNode;
  depth: number;
  onToggle: (t: TodoItem) => void;
}

function TodoNode({ node, depth, onToggle }: NodeProps) {
  const hasChildren = node.children.length > 0;
  const allChildrenDone = hasChildren && node.children.every((c) => c.completed);
  const canComplete = !hasChildren || allChildrenDone;
  const isLinked = !!node.linkedEventId;

  return (
    <li>
      <div
        className={cn(
          'hover:bg-surface-muted flex items-start gap-2.5 rounded-lg px-3 py-2 transition',
          depth > 0 && 'ml-5',
          node.completed && 'opacity-60',
        )}
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => canComplete && onToggle(node)}
          disabled={!canComplete && !node.completed}
          title={
            !canComplete ? '请先完成所有子任务' : node.completed ? '标记为未完成' : '标记为完成'
          }
          className={cn(
            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-[1.5px] transition',
            node.completed
              ? 'border-success bg-success text-white'
              : 'border-border-strong hover:border-accent',
            !canComplete && !node.completed && 'cursor-not-allowed opacity-40',
          )}
          aria-label={node.completed ? '取消完成' : '完成'}
        >
          {node.completed && (
            <svg viewBox="0 0 10 8" fill="none" className="h-2.5 w-2.5">
              <path
                d="M1 4l3 3 5-6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn('text-sm', node.completed && 'text-fg-muted line-through')}>
              {node.title}
            </span>
            {isLinked && (
              <span className="bg-[color:var(--color-accent)]/10 text-accent inline-flex items-center rounded px-1.5 py-0.5 text-[10px]">
                📅
              </span>
            )}
            {node.rollover && !node.completed && (
              <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 text-[10px]">
                顺延{' '}
              </span>
            )}
          </div>
          {hasChildren && (
            <p className="text-fg-muted mt-0.5 text-[11px]">
              {node.children.filter((c) => c.completed).length}/{node.children.length} 子任务{' '}
            </p>
          )}
        </div>
      </div>

      {/* Children */}
      {node.children.length > 0 && (
        <ul className="mt-0.5">
          {node.children.map((child) => (
            <TodoNode key={child.id} node={child} depth={depth + 1} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </li>
  );
}
