import { log, spinner } from '@clack/prompts';
import { execa } from 'execa';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import pc from 'picocolors';
import { mergedEnv, repoRoot, uploadToR2 } from '../lib.js';

interface ReleaseFlags {
  web: boolean;
  worker: boolean;
  desktop: boolean;
  mobile: boolean;
  waitMobile: boolean;
}

function parseFlags(args: string[]): ReleaseFlags {
  return {
    web: !args.includes('--no-web'),
    worker: !args.includes('--no-worker'),
    desktop: !args.includes('--no-desktop'),
    mobile: !args.includes('--no-mobile'),
    // By default we trigger the EAS build but do not block on it, since EAS
    // builds take 10–30 min. Pass --wait-mobile to run the full mobile
    // pipeline (wait → download APK → upload to R2) inline.
    waitMobile: args.includes('--wait-mobile'),
  };
}

async function buildWeb(env: NodeJS.ProcessEnv): Promise<void> {
  const s = spinner();
  s.start('构建 Web…');
  await execa('pnpm', ['--filter', '@kairo/web', 'build'], {
    env,
    stdio: ['ignore', 'inherit', 'inherit'],
    cwd: repoRoot(),
  });
  s.stop('Web 构建完成');
}

async function deployWebPages(env: NodeJS.ProcessEnv): Promise<void> {
  const projectName = env.CF_PAGES_PROJECT ?? 'kairo-web';
  const branch = env.CF_PAGES_BRANCH ?? 'main';
  const s = spinner();
  s.start(`部署 Web 到 Cloudflare Pages (${projectName}/${branch})…`);
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
    { env, stdio: ['ignore', 'inherit', 'inherit'], cwd: repoRoot() },
  );
  s.stop('Web 部署完成');
}

async function deployWorker(env: NodeJS.ProcessEnv): Promise<void> {
  const s = spinner();
  s.start('部署 Worker (Cloudflare)…');
  // Use `run deploy` so pnpm doesn't interpret `deploy` as its built-in
  // deployment subcommand.
  await execa('pnpm', ['--filter', '@kairo/worker', 'run', 'deploy'], {
    env,
    stdio: ['ignore', 'inherit', 'inherit'],
    cwd: repoRoot(),
  });
  s.stop('Worker 部署完成');
}

/**
 * On Windows, if MSVC toolchain is installed but vcvars isn't loaded in the
 * current shell, detect it via vswhere and source vcvars64.bat so cargo/link
 * can find cl.exe/link.exe. Returns env merged with MSVC paths, or the
 * original env if MSVC is not installed.
 */
async function withMsvcEnv(env: NodeJS.ProcessEnv): Promise<NodeJS.ProcessEnv> {
  if (process.platform !== 'win32') return env;
  // If link.exe is already on PATH, assume vcvars already loaded.
  try {
    await execa('where.exe', ['link.exe'], { env });
    return env;
  } catch {
    // not found, need to locate MSVC
  }
  const vswhere = 'C:/Program Files (x86)/Microsoft Visual Studio/Installer/vswhere.exe';
  if (!existsSync(vswhere)) return env;
  let installPath: string;
  try {
    const { stdout } = await execa(
      vswhere,
      [
        '-products',
        '*',
        '-requires',
        'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
        '-property',
        'installationPath',
        '-latest',
      ],
      { env },
    );
    installPath = stdout.trim().split(/\r?\n/)[0];
    if (!installPath) return env;
  } catch {
    return env;
  }
  const vcvars = join(installPath, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat');
  if (!existsSync(vcvars)) return env;
  try {
    // Dump the environment after sourcing vcvars64.bat.
    const { stdout } = await execa('cmd.exe', ['/c', `call "${vcvars}" >NUL && set`], { env });
    const merged: NodeJS.ProcessEnv = { ...env };
    for (const line of stdout.split(/\r?\n/)) {
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      merged[line.slice(0, eq)] = line.slice(eq + 1);
    }
    return merged;
  } catch {
    return env;
  }
}

/**
 * Build the Tauri Windows desktop EXE. Tolerates failure (Rust/MSVC may
 * be missing locally) — logs warning and returns null so the rest of the
 * pipeline continues.
 */
async function buildDesktop(env: NodeJS.ProcessEnv): Promise<string | null> {
  const s = spinner();
  s.start('构建 Desktop (Tauri)…');
  const buildEnv = await withMsvcEnv(env);
  try {
    const result = await execa('pnpm', ['--filter', '@kairo/desktop', 'build'], {
      env: buildEnv,
      stdio: ['ignore', 'inherit', 'inherit'],
      cwd: repoRoot(),
      reject: false,
    });
    if (result.exitCode !== 0) {
      s.stop('Desktop 构建失败，跳过（通常为本机缺少 Rust/MSVC 工具链）');
      return null;
    }
    const exePath = join(
      repoRoot(),
      'apps',
      'desktop',
      'src-tauri',
      'target',
      'release',
      'kairo-desktop.exe',
    );
    if (!existsSync(exePath)) {
      s.stop('Desktop 构建产物未找到，跳过上传');
      log.warn(`未找到 ${exePath}`);
      return null;
    }
    const size = (statSync(exePath).size / 1_000_000).toFixed(2);
    s.stop(`Desktop 构建完成 (${size} MB)`);
    return exePath;
  } catch (err) {
    s.stop('Desktop 构建失败，跳过（通常为本机缺少 Rust/MSVC 工具链）');
    log.warn(String(err instanceof Error ? err.message : err));
    return null;
  }
}

async function uploadDesktopExe(exePath: string, env: NodeJS.ProcessEnv): Promise<void> {
  const s = spinner();
  s.start('上传 Desktop EXE 到 R2…');
  await uploadToR2({
    key: 'desktop-windows.exe',
    filePath: exePath,
    contentType: 'application/vnd.microsoft.portable-executable',
    env,
  });
  s.stop('Desktop EXE 上传完成 → r2://kairo-attachments/desktop-windows.exe');
}

interface EasBuildInfo {
  id: string;
  status: string; // 'finished' | 'in-progress' | 'in-queue' | 'errored' | ...
  artifacts?: { buildUrl?: string };
}

/**
 * Trigger a new EAS Android preview build. Returns the build id.
 * Runs with --no-wait so the pipeline continues while EAS builds in cloud.
 */
async function triggerMobileBuild(env: NodeJS.ProcessEnv): Promise<string | null> {
  const s = spinner();
  s.start('提交 Android EAS 构建…');
  try {
    const { stdout } = await execa(
      'npx',
      [
        'eas-cli',
        'build',
        '-p',
        'android',
        '--profile',
        'preview',
        '--non-interactive',
        '--no-wait',
        '--json',
      ],
      { cwd: join(repoRoot(), 'apps', 'mobile'), env },
    );
    // EAS prints the JSON array at the end; find the first '['.
    const jsonStart = stdout.indexOf('[');
    const list: EasBuildInfo[] = jsonStart >= 0 ? JSON.parse(stdout.slice(jsonStart)) : [];
    const id = list[0]?.id;
    if (!id) {
      s.stop('EAS 返回无 build id，跳过');
      return null;
    }
    s.stop(`Mobile 构建已提交 (id: ${id})`);
    return id;
  } catch (err) {
    s.stop('EAS 构建提交失败');
    log.warn(String(err instanceof Error ? err.message : err));
    return null;
  }
}

async function fetchEasBuild(id: string, env: NodeJS.ProcessEnv): Promise<EasBuildInfo | null> {
  try {
    const { stdout } = await execa('npx', ['eas-cli', 'build:view', id, '--json'], {
      cwd: join(repoRoot(), 'apps', 'mobile'),
      env,
    });
    const jsonStart = stdout.indexOf('{');
    if (jsonStart < 0) return null;
    return JSON.parse(stdout.slice(jsonStart)) as EasBuildInfo;
  } catch {
    return null;
  }
}

/**
 * Poll EAS until the build finishes, then download the APK and upload to R2.
 * Returns true on success, false on timeout / failure.
 */
export async function waitAndUploadMobile(
  buildId: string,
  env: NodeJS.ProcessEnv,
  maxMinutes = 40,
): Promise<boolean> {
  const s = spinner();
  s.start(`等待 EAS 构建完成 (${buildId})…`);
  const deadline = Date.now() + maxMinutes * 60_000;
  let info: EasBuildInfo | null = null;
  while (Date.now() < deadline) {
    info = await fetchEasBuild(buildId, env);
    const st = info?.status?.toUpperCase();
    if (info && st === 'FINISHED' && info.artifacts?.buildUrl) break;
    if (info && (st === 'ERRORED' || st === 'CANCELED')) {
      s.stop(`EAS 构建 ${st}`);
      return false;
    }
    await new Promise((r) => setTimeout(r, 20_000));
  }
  if (!info || info.status?.toUpperCase() !== 'FINISHED' || !info.artifacts?.buildUrl) {
    s.stop('EAS 构建超时');
    return false;
  }
  s.stop('EAS 构建完成，开始下载 APK…');

  const apkUrl = info.artifacts.buildUrl;
  const apkPath = join(process.env.TEMP ?? '/tmp', `kairo-${buildId}.apk`);

  const dl = spinner();
  dl.start('下载 APK…');
  const res = await fetch(apkUrl);
  if (!res.ok) {
    dl.stop(`APK 下载失败: ${res.status}`);
    return false;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await import('node:fs/promises').then((m) => m.writeFile(apkPath, buf));
  dl.stop(`APK 已下载 → ${apkPath} (${(buf.byteLength / 1_000_000).toFixed(2)} MB)`);

  const up = spinner();
  up.start('上传 APK 到 R2…');
  await uploadToR2({
    key: 'mobile-android.apk',
    filePath: apkPath,
    contentType: 'application/vnd.android.package-archive',
    env,
  });
  up.stop('APK 上传完成 → r2://kairo-attachments/mobile-android.apk');
  return true;
}

export async function releaseCommand(args: string[]): Promise<void> {
  const flags = parseFlags(args);
  const env = mergedEnv();

  log.info(
    pc.bold('发布流程：') +
      ` web=${flags.web} worker=${flags.worker} desktop=${flags.desktop} mobile=${flags.mobile}${
        flags.mobile && flags.waitMobile ? ' (同步等待)' : ''
      }`,
  );

  // 1. Build web bundle (needed before Pages deploy).
  if (flags.web) await buildWeb(env);

  // 2. Build desktop EXE locally (fault-tolerant).
  let desktopExe: string | null = null;
  if (flags.desktop) desktopExe = await buildDesktop(env);

  // 3. Kick off EAS mobile build in parallel (non-blocking by default).
  let mobileBuildId: string | null = null;
  if (flags.mobile) mobileBuildId = await triggerMobileBuild(env);

  // 4. Upload desktop artifact to R2.
  if (desktopExe) await uploadDesktopExe(desktopExe, env);

  // 5. Deploy Worker (reads from R2 at request time → R2 upload must precede this
  //    for any schema change; for binary artifacts upload order doesn't matter,
  //    but we deploy worker first so new download routes go live before Pages).
  if (flags.worker) {
    try {
      await deployWorker(env);
    } catch (err) {
      log.warn(`Worker 部署失败：${err instanceof Error ? err.message : err}`);
    }
  }

  // 6. Deploy Web to Pages.
  if (flags.web) {
    try {
      await deployWebPages(env);
    } catch (err) {
      log.warn(`Web Pages 部署失败：${err instanceof Error ? err.message : err}`);
    }
  }

  // 7. Optionally wait for EAS build and upload APK.
  if (mobileBuildId && flags.waitMobile) {
    await waitAndUploadMobile(mobileBuildId, env);
  } else if (mobileBuildId) {
    log.info(
      pc.cyan(
        `📱 EAS 构建已提交 (${mobileBuildId})，完成后运行:\n    ` +
          pc.bold(`pnpm kairo mobile-upload ${mobileBuildId}`),
      ),
    );
  }

  log.success(pc.green('发布流程完成。'));
}

/**
 * Stand-alone command: download the APK for a completed EAS build (or the
 * latest successful one if no id given) and upload it to R2.
 */
export async function mobileUploadCommand(args: string[]): Promise<void> {
  const env = mergedEnv();
  let buildId = args[0];

  if (!buildId) {
    const s = spinner();
    s.start('查询最近一次 EAS 构建…');
    const { stdout } = await execa(
      'npx',
      [
        'eas-cli',
        'build:list',
        '--platform',
        'android',
        '--limit',
        '1',
        '--status',
        'finished',
        '--json',
        '--non-interactive',
      ],
      { cwd: join(repoRoot(), 'apps', 'mobile'), env },
    );
    const jsonStart = stdout.indexOf('[');
    const list: EasBuildInfo[] = jsonStart >= 0 ? JSON.parse(stdout.slice(jsonStart)) : [];
    buildId = list[0]?.id;
    if (!buildId) {
      s.stop('未找到任何已完成的 Android 构建');
      return;
    }
    s.stop(`找到构建 ${buildId}`);
  }

  const ok = await waitAndUploadMobile(buildId, env, 2);
  if (!ok) log.warn('APK 同步未完成，稍后重试。');
}
