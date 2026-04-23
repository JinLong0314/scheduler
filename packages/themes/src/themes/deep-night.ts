import { fontStacks, night } from '../primitives.js';
import type { ThemeDefinition } from '../types.js';

const radii = {
  'radius-sm': '4px',
  'radius-md': '8px',
  'radius-lg': '12px',
  'radius-xl': '20px',
};

const fonts = {
  'font-sans': fontStacks.sansCJK,
  'font-serif': fontStacks.serifCJK,
  'font-mono': fontStacks.mono,
};

/**
 * Deep Night is fundamentally dark. The "light" variant is a softer dim mode
 * (near-black rather than true black) for users who want reduced contrast.
 */
export const deepNight: ThemeDefinition = {
  id: 'deep-night',
  name: '深色极夜',
  description: 'OLED 纯黑 · 电光青 · 极客夜间友好',
  preview: '🌌',
  tokens: {
    light: {
      // "Dim" variant
      'color-bg': night.carbon,
      'color-surface': night.slate,
      'color-surface-muted': night.slate2,
      'color-fg': night.star,
      'color-fg-muted': night.mist,
      'color-border': night.line,
      'color-border-strong': night.lineStrong,

      'color-accent': night.cyan,
      'color-accent-hover': night.cyanDeep,
      'color-accent-fg': night.void,

      'color-success': night.lime,
      'color-warning': night.amber,
      'color-danger': '#FB7185',
      'color-info': night.cyan,

      'color-event-1': night.cyan,
      'color-event-2': night.magenta,
      'color-event-3': night.lime,
      'color-event-4': night.amber,
      'color-event-5': '#C084FC',

      'color-ring': night.cyan,
      'color-selected': night.slate2,
      'color-weekend': '#2A1822',

      ...radii,
      'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
      'shadow-md': '0 4px 12px rgba(0, 0, 0, 0.6), 0 0 1px rgba(110, 231, 249, 0.1)',
      'shadow-lg': '0 12px 32px rgba(0, 0, 0, 0.7), 0 0 2px rgba(110, 231, 249, 0.15)',
      ...fonts,
    },
    dark: {
      // "True black" variant (OLED)
      'color-bg': night.void,
      'color-surface': night.obsidian,
      'color-surface-muted': night.carbon,
      'color-fg': night.star,
      'color-fg-muted': night.mist,
      'color-border': night.line,
      'color-border-strong': night.lineStrong,

      'color-accent': night.cyan,
      'color-accent-hover': night.cyanDeep,
      'color-accent-fg': night.void,

      'color-success': night.lime,
      'color-warning': night.amber,
      'color-danger': '#FB7185',
      'color-info': night.cyan,

      'color-event-1': night.cyan,
      'color-event-2': night.magenta,
      'color-event-3': night.lime,
      'color-event-4': night.amber,
      'color-event-5': '#C084FC',

      'color-ring': night.cyan,
      'color-selected': night.slate,
      'color-weekend': '#1A0E14',

      ...radii,
      'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.8)',
      'shadow-md': '0 4px 12px rgba(0, 0, 0, 0.9), 0 0 1px rgba(110, 231, 249, 0.2)',
      'shadow-lg': '0 12px 32px rgba(0, 0, 0, 1), 0 0 2px rgba(110, 231, 249, 0.25)',
      ...fonts,
    },
  },
};
