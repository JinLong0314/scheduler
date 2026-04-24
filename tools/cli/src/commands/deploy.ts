import { log, spinner } from '@clack/prompts';
import { execa } from 'execa';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadEnvLocal(): Record<string, string> {
  const path = join(process.cwd(), '.env.local');
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && m[1] && m[2] !== undefined) out[m[1]] = m[2];
  }
  return out;
}

export async function deployCommand(args: string[]): Promise<void> {
  const targets = args.length > 0 ? args : ['worker', 'web'];
  const envLocal = loadEnvLocal();
  const env = { ...process.env, ...envLocal };

  for (const target of targets) {
    const s = spinner();
    switch (target) {
      case 'worker': {
        s.start('部署 Worker (Cloudflare)…');
        await execa('pnpm', ['--filter', '@kairo/worker', 'deploy'], { env, stdio: 'inherit' });
        s.stop('Worker 部署完成');
        break;
      }
      case 'web': {
        s.start('构建 Web…');
        await execa('pnpm', ['--filter', '@kairo/web', 'build'], { env, stdio: 'inherit' });
        s.stop('Web 构建完成');

        const projectName = env.CF_PAGES_PROJECT ?? 'kairo-web';
        const branch = env.CF_PAGES_BRANCH ?? 'main';
        const s2 = spinner();
        s2.start(`部署 Web 到 Cloudflare Pages (${projectName}/${branch})…`);
        // wrangler is installed in the worker workspace; use npx to auto-resolve
        // from the hoisted node_modules (pnpm node-linker=hoisted).
        await execa(
          'npx',
          [
            'wrangler',
            'pages',
            'deploy',
            'apps/web/dist',
            `--project-name=${projectName}`,
            `--branch=${branch}`,
            '--commit-dirty=true',
          ],
          { env, stdio: 'inherit' },
        );
        s2.stop('Web 部署完成');
        break;
      }
      case 'desktop': {
        s.start('构建 Desktop (Tauri)…');
        await execa('pnpm', ['--filter', '@kairo/desktop', 'build'], { env, stdio: 'inherit' });
        s.stop('Desktop 构建完成');
        break;
      }
      case 'mobile': {
        s.start('构建 Android APK (EAS)…');
        await execa('pnpm', ['--filter', '@kairo/mobile', 'build:android'], {
          env,
          stdio: 'inherit',
        });
        s.stop('Mobile 构建完成');
        break;
      }
      default:
        log.warn(`跳过未知目标: ${target}`);
    }
  }
}
