import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { and, eq, isNull, lt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import type { Env, Variables } from './env.js';
import { todos } from './db/schema.js';
import { attachSession } from './middleware/auth.js';
import { ipCountryGuard } from './middleware/ip-guard.js';
import { securityHeaders } from './middleware/security-headers.js';
import { authRoutes } from './routes/auth.js';
import { todoRoutes } from './routes/todos.js';
import { eventRoutes } from './routes/events.js';
import { adminRoutes } from './routes/admin.js';
import { downloadRoutes } from './routes/downloads.js';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Allowed browser origins — add new front-end domains here.
const ALLOWED_ORIGINS = [
  'https://kairo.jackie-macau.top',
  // Cloudflare Pages (production + preview deployments)
  'https://kairo-web.pages.dev',
  'https://kairo-web-3ja.pages.dev',
  // local dev
  'http://localhost:5173',
  'http://localhost:4173',
];

// CORS must be the VERY FIRST middleware so preflight always gets CORS headers.
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return '';
      if (ALLOWED_ORIGINS.includes(origin)) return origin;
      // Allow Cloudflare Pages preview deployments
      if (/^https:\/\/[a-z0-9]+-kairo-web-3ja\.pages\.dev$/.test(origin)) return origin;
      return '';
    },
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 86400,
  }),
);
app.use('*', securityHeaders);
app.use('*', ipCountryGuard);
app.use('*', attachSession);

app.get('/health', (c) => c.json({ ok: true, version: '0.1.0' }));

app.route('/auth', authRoutes);
app.route('/todos', todoRoutes);
app.route('/events', eventRoutes);
app.route('/admin', adminRoutes);

// Download routes are public — no auth, no IP guard.
// Served before the IP guard middleware runs (handled at route level).
app.route('/', downloadRoutes);

app.notFound((c) => c.json({ error: 'NOT_FOUND' }, 404));
app.onError((err, c) => {
  console.error('[worker-error]', err);
  return c.json({ error: 'INTERNAL' }, 500);
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    // Daily rollover — runs at 02:00 UTC+8 (18:00 UTC previous day).
    // Moves all uncompleted todos where rollover=true and scheduledDate < today
    // to today's date.
    const db = drizzle(env.DB);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().slice(0, 10);

    await db
      .update(todos)
      .set({ scheduledDate: todayIso, updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(todos.completed, false),
          eq(todos.rollover, true),
          lt(todos.scheduledDate, todayIso),
          isNull(todos.parentId), // only roll over root todos (children follow parent's date)
        ),
      );

    // Also roll over children whose parents were just rolled over.
    // Children with rollover=true whose parent's scheduledDate is now today.
    // We do a second pass: update children with rollover=true where their parent is in today.
    // This is a simple approach; for large datasets a recursive CTE would be better.
    const rolledParents = await db
      .select({ id: todos.id })
      .from(todos)
      .where(
        and(eq(todos.completed, false), eq(todos.scheduledDate, todayIso), isNull(todos.parentId)),
      )
      .all();

    // Batch update children for each rolled-over parent (D1 doesn't support IN subquery well).
    for (const parent of rolledParents) {
      await db
        .update(todos)
        .set({ scheduledDate: todayIso, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(todos.parentId, parent.id),
            eq(todos.completed, false),
            eq(todos.rollover, true),
            lt(todos.scheduledDate, todayIso),
          ),
        );
    }
  },
};
