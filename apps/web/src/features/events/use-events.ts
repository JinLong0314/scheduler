import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/lib/api-client';

export interface EventItem {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  timezone: string;
  locationJson: string | null;
  remindersJson: string;
  rrule: string | null;
  colorKey: string;
  linkedTodoId: string | null;
  version: number;
}

export function useEvents(fromIso: string, toIso: string) {
  return useQuery({
    queryKey: ['events', fromIso, toIso],
    queryFn: () =>
      api<{ items: EventItem[] }>(
        `/events?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
      ),
    staleTime: 10_000,
  });
}
