import type { LoginMethod, MapProvider, ThemeId } from './constants.js';

// ============================================================
// Common
// ============================================================

export type Iso8601 = string; // e.g. "2026-04-23T10:00:00+08:00"
export type Ulid = string; // 26-char ULID

export interface Versioned {
  /** Optimistic concurrency control. Incremented on every write by server. */
  readonly version: number;
}

export interface Auditable {
  readonly createdAt: Iso8601;
  readonly updatedAt: Iso8601;
}

// ============================================================
// User / Auth
// ============================================================

export type UserRole = 'admin' | 'user';

export interface User extends Versioned, Auditable {
  id: Ulid;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  themeId: ThemeId;
  timezone: string;
  locale: string;
}

export interface Session {
  id: Ulid;
  userId: Ulid;
  createdAt: Iso8601;
  expiresAt: Iso8601;
  deviceLabel?: string;
  ipHash?: string;
}

// ============================================================
// Reminders
// ============================================================

export type ReminderChannel = 'web-push' | 'desktop' | 'mobile' | 'email';

export interface Reminder {
  /** Minutes before event start. 0 = at start. */
  offsetMinutes: number;
  channels: ReminderChannel[];
}

// ============================================================
// Location
// ============================================================

export interface Location {
  text: string;
  lat?: number;
  lng?: number;
  provider?: MapProvider;
}

// ============================================================
// Todo
// ============================================================

export interface Todo extends Versioned, Auditable {
  id: Ulid;
  userId: Ulid;
  parentId: Ulid | null;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Iso8601;
  /** If true, uncompleted todos roll over to next day automatically. */
  rollover: boolean;
  /** Optional linked event. */
  linkedEventId?: Ulid;
  /** Day this todo is currently scheduled for (YYYY-MM-DD). */
  scheduledDate: string;
  orderIndex: number;
}

// ============================================================
// Event
// ============================================================

export interface Event extends Versioned, Auditable {
  id: Ulid;
  userId: Ulid;
  title: string;
  description?: string;
  startAt: Iso8601;
  endAt: Iso8601;
  allDay: boolean;
  timezone: string;
  location?: Location;
  reminders: Reminder[];
  /** iCal RRULE string for recurrence, or null. */
  rrule: string | null;
  /** Color token key (e.g. "accent" | "info" | "success"). Resolved via theme. */
  colorKey: string;
  /** Whether a bound todo was auto-created for this event. */
  linkedTodoId?: Ulid;
}

// ============================================================
// Attachment (stored in R2)
// ============================================================

export interface Attachment extends Auditable {
  id: Ulid;
  userId: Ulid;
  ownerKind: 'todo' | 'event';
  ownerId: Ulid;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** R2 object key — never exposed directly; served via signed URL. */
  objectKey: string;
}

// ============================================================
// Admin config
// ============================================================

export interface AdminConfig {
  siteName: string;
  allowRegistration: boolean;
  enabledLoginMethods: LoginMethod[];
  mapProvider: MapProvider;
  mapApiKey?: string;
  /** CIDR strings. */
  ipAllowlist: string[];
  ipBlocklist: string[];
  /** ISO country codes (e.g. "CN", "US"). */
  countryAllowlist: string[];
  countryBlocklist: string[];
  contactEmail?: string;
  updatedAt: Iso8601;
}

// ============================================================
// Sync / Conflict
// ============================================================

export interface ConflictInfo<T> {
  local: T;
  remote: T;
  mine(): T;
  theirs(): T;
}
