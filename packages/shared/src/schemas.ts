import { z } from 'zod';
import {
  LOGIN_METHODS,
  MAP_PROVIDERS,
  MAX_REMINDERS_PER_EVENT,
  THEME_IDS,
} from './constants.js';

// ============================================================
// Primitive schemas
// ============================================================

export const ulidSchema = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'Invalid ULID');

export const iso8601Schema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/));

export const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const themeIdSchema = z.enum(THEME_IDS);
export const loginMethodSchema = z.enum(LOGIN_METHODS);
export const mapProviderSchema = z.enum(MAP_PROVIDERS);

// ============================================================
// Auth
// ============================================================

export const emailSchema = z.string().email().max(254);

export const passwordSchema = z
  .string()
  .min(10, 'At least 10 characters')
  .max(128)
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v), {
    message: 'Must include upper, lower and digit',
  });

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const registerInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().min(1).max(64),
  turnstileToken: z.string().min(1),
});

// ============================================================
// Reminder
// ============================================================

export const reminderChannelSchema = z.enum(['web-push', 'desktop', 'mobile', 'email']);

export const reminderSchema = z.object({
  offsetMinutes: z.number().int().min(0).max(60 * 24 * 30),
  channels: z.array(reminderChannelSchema).min(1),
});

// ============================================================
// Location
// ============================================================

export const locationSchema = z.object({
  text: z.string().max(256),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  provider: mapProviderSchema.optional(),
});

// ============================================================
// Todo
// ============================================================

export const todoCreateSchema = z.object({
  title: z.string().min(1).max(256).trim(),
  description: z.string().max(10_000).optional(),
  parentId: ulidSchema.nullable().default(null),
  rollover: z.boolean().default(true),
  scheduledDate: dateOnlySchema,
  linkedEventId: ulidSchema.optional(),
});

export const todoUpdateSchema = todoCreateSchema
  .partial()
  .extend({ completed: z.boolean().optional(), version: z.number().int().nonnegative() });

// ============================================================
// Event
// ============================================================

export const rruleSchema = z
  .string()
  .max(512)
  .regex(/^[A-Z0-9=;:,+\-/]+$/i, 'Invalid RRULE characters')
  .nullable();

export const eventCreateSchema = z
  .object({
    title: z.string().min(1).max(256).trim(),
    description: z.string().max(10_000).optional(),
    startAt: iso8601Schema,
    endAt: iso8601Schema,
    allDay: z.boolean().default(false),
    timezone: z.string().min(1).max(64),
    location: locationSchema.optional(),
    reminders: z.array(reminderSchema).max(MAX_REMINDERS_PER_EVENT).default([]),
    rrule: rruleSchema.default(null),
    colorKey: z.string().min(1).max(32).default('accent'),
    createLinkedTodo: z.boolean().default(false),
  })
  .refine((v) => new Date(v.endAt).getTime() >= new Date(v.startAt).getTime(), {
    message: 'endAt must be >= startAt',
    path: ['endAt'],
  });

export const eventUpdateSchema = z.object({
  version: z.number().int().nonnegative(),
  patch: z.object({
    title: z.string().min(1).max(256).trim().optional(),
    description: z.string().max(10_000).optional(),
    startAt: iso8601Schema.optional(),
    endAt: iso8601Schema.optional(),
    allDay: z.boolean().optional(),
    timezone: z.string().min(1).max(64).optional(),
    location: locationSchema.optional(),
    reminders: z.array(reminderSchema).max(MAX_REMINDERS_PER_EVENT).optional(),
    rrule: rruleSchema.optional(),
    colorKey: z.string().min(1).max(32).optional(),
  }),
});

// ============================================================
// Admin config
// ============================================================

export const adminConfigUpdateSchema = z.object({
  siteName: z.string().min(1).max(64).optional(),
  allowRegistration: z.boolean().optional(),
  enabledLoginMethods: z.array(loginMethodSchema).optional(),
  mapProvider: mapProviderSchema.optional(),
  mapApiKey: z.string().max(256).optional(),
  ipAllowlist: z.array(z.string()).optional(),
  ipBlocklist: z.array(z.string()).optional(),
  countryAllowlist: z.array(z.string().length(2)).optional(),
  countryBlocklist: z.array(z.string().length(2)).optional(),
  contactEmail: emailSchema.optional(),
});

// ============================================================
// Sync conflict
// ============================================================

export const conflictResolutionSchema = z.enum(['keep-local', 'keep-remote', 'merge']);

// ============================================================
// Type exports
// ============================================================

export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type TodoCreateInput = z.infer<typeof todoCreateSchema>;
export type TodoUpdateInput = z.infer<typeof todoUpdateSchema>;
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type AdminConfigUpdateInput = z.infer<typeof adminConfigUpdateSchema>;
