export const DEFAULT_TIMEZONE = 'Asia/Shanghai';

export const WEEK_START = 'monday' as const;

export const MAX_REMINDERS_PER_EVENT = 10;
export const MAX_TODO_DEPTH = 5;
export const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const SETUP_TOKEN_TTL_SECONDS = 60 * 30; // 30 min
export const DEVICE_PAIR_TTL_SECONDS = 60 * 15; // 15 min

export const THEME_IDS = ['warm-japandi', 'morning-mist', 'deep-night', 'paper-book'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME_ID: ThemeId = 'warm-japandi';

export const LOGIN_METHODS = ['password', 'github', 'google', 'cf-access', 'device-pair'] as const;
export type LoginMethod = (typeof LOGIN_METHODS)[number];

export const MAP_PROVIDERS = ['osm', 'amap', 'google'] as const;
export type MapProvider = (typeof MAP_PROVIDERS)[number];
