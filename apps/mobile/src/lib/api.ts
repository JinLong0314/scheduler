import { useAuthStore } from './auth-store';

export const API_BASE = 'https://kairo-api.jackie-macau.top';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(`${code} (${status})`);
  }
}

export async function api<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, body: rawBody, ...rest } = init;
  const token = useAuthStore.getState().token;
  const body: BodyInit | null = json !== undefined ? JSON.stringify(json) : (rawBody ?? null);
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    body,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.status === 401) useAuthStore.getState().clear();
    throw new ApiError(res.status, err.error ?? 'UNKNOWN');
  }
  return res.json() as Promise<T>;
}
