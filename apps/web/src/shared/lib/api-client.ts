import { useAuthStore } from './auth-store';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public details?: unknown,
  ) {
    super(`${status} ${code}`);
  }
}

export async function api<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, body: bodyInit, ...rest } = init;
  const token = useAuthStore.getState().token;
  const body: BodyInit | null =
    json !== undefined ? JSON.stringify(json) : (bodyInit ?? null);
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body,
  });
  if (res.status === 401) {
    useAuthStore.getState().clear();
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; details?: unknown };
    throw new ApiError(res.status, body.error ?? 'UNKNOWN', body.details);
  }
  return (await res.json()) as T;
}
