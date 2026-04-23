import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, Variables } from './env.js';
import { attachSession } from './middleware/auth.js';
import { ipCountryGuard } from './middleware/ip-guard.js';
import { securityHeaders } from './middleware/security-headers.js';
import { authRoutes } from './routes/auth.js';
import { todoRoutes } from './routes/todos.js';
import { eventRoutes } from './routes/events.js';
import { adminRoutes } from './routes/admin.js';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use('*', securityHeaders);
app.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
    credentials: true,
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 86400,
  }),
);
app.use('*', ipCountryGuard);
app.use('*', attachSession);

app.get('/health', (c) => c.json({ ok: true, version: '0.1.0' }));

app.route('/auth', authRoutes);
app.route('/todos', todoRoutes);
app.route('/events', eventRoutes);
app.route('/admin', adminRoutes);

app.notFound((c) => c.json({ error: 'NOT_FOUND' }, 404));
app.onError((err, c) => {
  console.error('[worker-error]', err);
  return c.json({ error: 'INTERNAL' }, 500);
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, _env: Env, _ctx: ExecutionContext) {
    // Daily rollover of uncompleted todos with rollover=true.
    // Implementation sketch — a full version would batch by user.
    // TODO: implement in M2 when tested end-to-end.
  },
};
