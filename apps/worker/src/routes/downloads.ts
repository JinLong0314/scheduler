import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env, Variables } from '../env.js';

type HonoCtx = Context<{ Bindings: Env; Variables: Variables }>;

export const downloadRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// R2 key → { contentType, filename }
const ARTIFACTS: Record<string, { key: string; contentType: string; filename: string }> = {
  'desktop/windows': {
    key: 'desktop-windows.exe',
    contentType: 'application/vnd.microsoft.portable-executable',
    filename: 'kairo-desktop.exe',
  },
  'desktop/linux-deb': {
    key: 'desktop-linux.deb',
    contentType: 'application/vnd.debian.binary-package',
    filename: 'kairo.deb',
  },
  'desktop/linux-appimage': {
    key: 'desktop-linux.AppImage',
    contentType: 'application/octet-stream',
    filename: 'kairo.AppImage',
  },
  'mobile/android': {
    key: 'mobile-android.apk',
    contentType: 'application/vnd.android.package-archive',
    filename: 'kairo.apk',
  },
};

async function serveR2Download(c: HonoCtx, artifactId: string) {
  const artifact = ARTIFACTS[artifactId];
  if (!artifact) return c.json({ error: 'NOT_FOUND' }, 404);

  const obj = await c.env.R2.get(artifact.key);
  if (!obj) {
    return c.json(
      { error: 'NOT_AVAILABLE', message: 'This build has not been uploaded yet.' },
      404,
    );
  }

  const headers = new Headers();
  headers.set('Content-Type', artifact.contentType);
  headers.set('Content-Disposition', `attachment; filename="${artifact.filename}"`);
  if (obj.size) headers.set('Content-Length', String(obj.size));
  // Allow caching for 10 minutes
  headers.set('Cache-Control', 'public, max-age=600');

  return new Response(obj.body, { headers });
}

// Desktop downloads
downloadRoutes.get('/desktop/download/windows', (c) => serveR2Download(c, 'desktop/windows'));
downloadRoutes.get('/desktop/download/linux-deb', (c) => serveR2Download(c, 'desktop/linux-deb'));
downloadRoutes.get('/desktop/download/linux-appimage', (c) =>
  serveR2Download(c, 'desktop/linux-appimage'),
);

// Mobile downloads
downloadRoutes.get('/mobile/download/android', (c) => serveR2Download(c, 'mobile/android'));
