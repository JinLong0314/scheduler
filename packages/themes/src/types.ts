/**
 * Theme token architecture (three layers)
 *
 *   primitive  →  semantic  →  component
 *
 * - primitive: raw color / size values, not consumed by components directly.
 * - semantic:  meaningful names (bg/surface, fg/primary, accent, danger...).
 *              Components ONLY reference these.
 * - component: rare overrides for component-specific tokens.
 *
 * All tokens are emitted as CSS variables under `[data-theme][data-mode]`.
 * Components read them via Tailwind utilities that map to `var(--token-name)`.
 */

export type Mode = 'light' | 'dark';

/** Semantic tokens — the only surface components are allowed to reference. */
export interface SemanticTokens {
  /** Page background. */
  'color-bg': string;
  /** Elevated surfaces (cards, menus). */
  'color-surface': string;
  /** Sunken surfaces (inputs, subtle rails). */
  'color-surface-muted': string;
  /** Primary text. */
  'color-fg': string;
  /** Secondary / muted text. */
  'color-fg-muted': string;
  /** Hairline borders. */
  'color-border': string;
  /** Strong borders (focus ring base). */
  'color-border-strong': string;

  /** Brand accent (primary action). */
  'color-accent': string;
  'color-accent-hover': string;
  'color-accent-fg': string;

  /** Status colors. */
  'color-success': string;
  'color-warning': string;
  'color-danger': string;
  'color-info': string;

  /** Event/todo color variants (used for colorKey mapping). */
  'color-event-1': string;
  'color-event-2': string;
  'color-event-3': string;
  'color-event-4': string;
  'color-event-5': string;

  /** Focus ring. */
  'color-ring': string;
  /** Selected day cell. */
  'color-selected': string;
  /** Weekend cell tint. */
  'color-weekend': string;

  /** Radii. */
  'radius-sm': string;
  'radius-md': string;
  'radius-lg': string;
  'radius-xl': string;

  /** Shadows. */
  'shadow-sm': string;
  'shadow-md': string;
  'shadow-lg': string;

  /** Typography. */
  'font-sans': string;
  'font-serif': string;
  'font-mono': string;
}

import type { ThemeId } from '@kairo/shared';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  /** Emoji or short preview glyph used in theme switcher. */
  preview: string;
  tokens: Record<Mode, SemanticTokens>;
}
