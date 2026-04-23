import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  ENV: 'dev' | 'prod';
  SESSION_SECRET: string;
  ADMIN_SETUP_TOKEN?: string;
  TURNSTILE_SECRET?: string;
  OAUTH_GITHUB_ID?: string;
  OAUTH_GITHUB_SECRET?: string;
  OAUTH_GOOGLE_ID?: string;
  OAUTH_GOOGLE_SECRET?: string;
  VAPID_PUBLIC?: string;
  VAPID_PRIVATE?: string;
}

export interface Variables {
  userId?: string;
  userRole?: 'admin' | 'user';
}
