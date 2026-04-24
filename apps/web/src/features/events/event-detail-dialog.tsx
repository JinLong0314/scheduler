import { Button } from '@kairo/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../shared/lib/api-client';
import type { EventItem } from './use-events';

interface Props {
  event: EventItem | null;
  onClose: () => void;
}

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EventDetailDialog({ event, onClose }: Props) {
  const qc = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => api(`/events/${event!.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
  });

  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border-border w-full max-w-sm rounded-xl border p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color stripe */}
        <div
          className="mb-3 h-1.5 w-full rounded-full"
          style={{ background: `var(--color-${event.colorKey})` }}
        />

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
          <Button variant="secondary" size="sm" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}
