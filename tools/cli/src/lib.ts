import { execa } from 'execa';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * Walk up from process.cwd() looking for pnpm-workspace.yaml.
 * Falls back to process.cwd() if none found.
 */
export function repoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(process.cwd());
}

export function loadEnvLocal(): Record<string, string> {
  const path = join(repoRoot(), '.env.local');
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && m[1] && m[2] !== undefined) out[m[1]] = m[2];
  }
  return out;
}

export function mergedEnv(): NodeJS.ProcessEnv {
  return { ...process.env, ...loadEnvLocal() };
}

/**
 * Upload a local file to the Worker's R2 bucket (kairo-attachments)
 * via wrangler. Overwrites any existing object at the same key.
 */
export async function uploadToR2(options: {
  key: string;
  filePath: string;
  contentType?: string;
  env: NodeJS.ProcessEnv;
}): Promise<void> {
  const bucket = options.env.R2_BUCKET ?? 'kairo-attachments';
  const args = [
    'wrangler',
    'r2',
    'object',
    'put',
    `${bucket}/${options.key}`,
    `--file=${options.filePath}`,
    '--remote',
  ];
  if (options.contentType) args.push(`--content-type=${options.contentType}`);
  await execa('npx', args, { env: options.env, stdio: 'inherit' });
}
