import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ============================================================
// users
// ============================================================
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // nullable if OAuth-only
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['admin', 'user'] })
    .notNull()
    .default('user'),
  themeId: text('theme_id').notNull().default('warm-japandi'),
  timezone: text('timezone').notNull().default('Asia/Shanghai'),
  locale: text('locale').notNull().default('zh-CN'),
  version: integer('version').notNull().default(1),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// sessions (also mirrored in KV for fast lookup)
// ============================================================
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  deviceLabel: text('device_label'),
  ipHash: text('ip_hash'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text('expires_at').notNull(),
});

// ============================================================
// oauth_accounts
// ============================================================
export const oauthAccounts = sqliteTable('oauth_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: ['github', 'google'] }).notNull(),
  providerUserId: text('provider_user_id').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// todos (supports nesting via parent_id)
// ============================================================
export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  title: text('title').notNull(),
  description: text('description'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: text('completed_at'),
  rollover: integer('rollover', { mode: 'boolean' }).notNull().default(true),
  linkedEventId: text('linked_event_id'),
  scheduledDate: text('scheduled_date').notNull(), // YYYY-MM-DD
  orderIndex: integer('order_index').notNull().default(0),
  version: integer('version').notNull().default(1),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// events
// ============================================================
export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  startAt: text('start_at').notNull(),
  endAt: text('end_at').notNull(),
  allDay: integer('all_day', { mode: 'boolean' }).notNull().default(false),
  timezone: text('timezone').notNull().default('Asia/Shanghai'),
  locationJson: text('location_json'), // JSON-encoded Location
  remindersJson: text('reminders_json').notNull().default('[]'),
  rrule: text('rrule'),
  colorKey: text('color_key').notNull().default('accent'),
  linkedTodoId: text('linked_todo_id'),
  version: integer('version').notNull().default(1),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// attachments (metadata; blobs in R2)
// ============================================================
export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ownerKind: text('owner_kind', { enum: ['todo', 'event'] }).notNull(),
  ownerId: text('owner_id').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  objectKey: text('object_key').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// admin_config (singleton row with id='singleton')
// ============================================================
export const adminConfig = sqliteTable('admin_config', {
  id: text('id').primaryKey().default('singleton'),
  configJson: text('config_json').notNull(),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// audit_log — admin actions; append-only
// ============================================================
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  actorUserId: text('actor_user_id'),
  action: text('action').notNull(),
  target: text('target'),
  detailsJson: text('details_json'),
  ipHash: text('ip_hash'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// login_attempts — rate limiting / lockouts
// ============================================================
export const loginAttempts = sqliteTable('login_attempts', {
  id: text('id').primaryKey(),
  emailLower: text('email_lower'),
  ipHash: text('ip_hash'),
  success: integer('success', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
