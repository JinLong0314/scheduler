import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/lib/api-client';

export interface TodoItem {
  id: string;
  userId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  completed: boolean;
  completedAt: string | null;
  rollover: boolean;
  linkedEventId: string | null;
  scheduledDate: string;
  orderIndex: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export function useTodos(date: string) {
  return useQuery({
    queryKey: ['todos', date],
    queryFn: () => api<{ items: TodoItem[] }>(`/todos?date=${date}`),
    staleTime: 10_000,
  });
}

export type TreeNode = TodoItem & { children: TreeNode[] };

/** Build a tree of TodoItem from a flat list returned by the API */
export function buildTree(items: TodoItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  items.forEach((i) => map.set(i.id, { ...i, children: [] }));
  const roots: TreeNode[] = [];
  items.forEach((i) => {
    if (i.parentId && map.has(i.parentId)) {
      map.get(i.parentId)!.children.push(map.get(i.id)!);
    } else {
      roots.push(map.get(i.id)!);
    }
  });
  return roots;
}
