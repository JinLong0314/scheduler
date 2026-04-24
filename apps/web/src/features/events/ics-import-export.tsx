import { Button } from '@kairo/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { api } from '../../shared/lib/api-client';

export function IcsImportExport() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('导入中…');
    try {
      const text = await file.text();
      const res = await api<{ imported: number }>('/events/import-ics', {
        method: 'POST',
        json: { ics: text },
      });
      qc.invalidateQueries({ queryKey: ['events'] });
      setStatus(`已导入 ${res.imported} 个日程`);
    } catch {
      setStatus('导入失败');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
      setTimeout(() => setStatus(null), 3000);
    }
  }

  async function handleExport() {
    setStatus('导出中…');
    try {
      const res = await fetch(
        (import.meta.env.VITE_API_URL as string | undefined)
          ? `${import.meta.env.VITE_API_URL}/events/export-ics`
          : '/api/events/export-ics',
        {
          headers: {
            Authorization: `Bearer ${
              (await import('../../shared/lib/auth-store')).useAuthStore.getState().token ?? ''
            }`,
          },
        },
      );
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kairo-events.ics';
      a.click();
      URL.revokeObjectURL(url);
      setStatus('导出完成');
    } catch {
      setStatus('导出失败');
    } finally {
      setTimeout(() => setStatus(null), 3000);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          导入 .ics
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          导出 .ics
        </Button>
      </div>
      {status && <p className="text-fg-muted text-xs">{status}</p>}
      <input ref={fileRef} type="file" accept=".ics" className="hidden" onChange={handleImport} />
    </div>
  );
}
