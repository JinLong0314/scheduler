import { fontStacks, warm } from '../primitives.js';
import type { ThemeDefinition } from '../types.js';

const radii = {
  'radius-sm': '6px',
  'radius-md': '10px',
  'radius-lg': '16px',
  'radius-xl': '24px',
};

const fonts = {
  'font-sans': fontStacks.sansCJK,
  'font-serif': fontStacks.serifCJK,
  'font-mono': fontStacks.mono,
};

export const warmJapandi: ThemeDefinition = {
  id: 'warm-japandi',
  name: '暖色日系',
  description: '亚麻暖白 · 珊瑚橙 · 继承原版，温润治愈',
  preview: '🍑',
  tokens: {
    light: {
      'color-bg': warm.linen,
      'color-surface': warm.cream,
      'color-surface-muted': warm.linen2,
      'color-fg': warm.ink,
      'color-fg-muted': warm.ink3,
      'color-border': warm.sand,
      'color-border-strong': warm.clay,

      'color-accent': warm.coral,
      'color-accent-hover': warm.coralDeep,
      'color-accent-fg': warm.cream,

      'color-success': '#7FB069',
      'color-warning': '#E8A745',
      'color-danger': '#E07A5F',
      'color-info': '#8AA8B8',

      'color-event-1': warm.coral,
      'color-event-2': warm.clay,
      'color-event-3': '#8AA8B8',
      'color-event-4': '#A8B89F',
      'color-event-5': '#C9ADA7',

      'color-ring': warm.coral,
      'color-selected': warm.blush,
      'color-weekend': warm.peach,

      ...radii,
      'shadow-sm': '0 1px 2px rgba(93, 64, 55, 0.06)',
      'shadow-md': '0 4px 12px rgba(93, 64, 55, 0.08)',
      'shadow-lg': '0 12px 32px rgba(93, 64, 55, 0.12)',
      ...fonts,
    },
    dark: {
      'color-bg': '#1E1612',
      'color-surface': '#2A1F19',
      'color-surface-muted': '#241A15',
      'color-fg': '#F2E6D8',
      'color-fg-muted': '#BFA893',
      'color-border': '#3D2D24',
      'color-border-strong': '#5A4232',

      'color-accent': '#F4A775',
      'color-accent-hover': '#FFBA8A',
      'color-accent-fg': '#1E1612',

      'color-success': '#9BC88A',
      'color-warning': '#EBB968',
      'color-danger': '#EB9A84',
      'color-info': '#A3BECA',

      'color-event-1': '#F4A775',
      'color-event-2': '#D4A373',
      'color-event-3': '#A3BECA',
      'color-event-4': '#B8C9B0',
      'color-event-5': '#D4BDB7',

      'color-ring': '#F4A775',
      'color-selected': '#3D2D24',
      'color-weekend': '#4A2E28',

      ...radii,
      'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
      'shadow-md': '0 4px 12px rgba(0, 0, 0, 0.4)',
      'shadow-lg': '0 12px 32px rgba(0, 0, 0, 0.5)',
      ...fonts,
    },
  },
};
