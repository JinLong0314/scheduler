import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/lib/api-client';

export interface TodoItem {
  id: string;
  userId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  completed: boolean;
  rollover: boolean;
  linkedEventId: string | null;
  scheduledDate: string;
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
