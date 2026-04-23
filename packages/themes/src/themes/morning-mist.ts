import { fontStacks, mist } from '../primitives.js';
import type { ThemeDefinition } from '../types.js';

const radii = {
  'radius-sm': '8px',
  'radius-md': '14px',
  'radius-lg': '20px',
  'radius-xl': '28px',
};

const fonts = {
  'font-sans': fontStacks.sansCJK,
  'font-serif': fontStacks.serifCJK,
  'font-mono': fontStacks.mono,
};

export const morningMist: ThemeDefinition = {
  id: 'morning-mist',
  name: '晨雾莫奈',
  description: '淡蓝晨雾 · 藕粉水彩 · 柔和印象派',
  preview: '🌫️',
  tokens: {
    light: {
      'color-bg': mist.dew,
      'color-surface': mist.cloud,
      'color-surface-muted': mist.sky,
      'color-fg': mist.ink,
      'color-fg-muted': mist.ink3,
      'color-border': mist.line,
      'color-border-strong': mist.ink3,

      'color-accent': '#7A9BC0',
      'color-accent-hover': '#5E83AB',
      'color-accent-fg': mist.cloud,

      'color-success': mist.sage,
      'color-warning': '#E8C987',
      'color-danger': mist.rose2,
      'color-info': mist.iris,

      'color-event-1': '#7A9BC0',
      'color-event-2': mist.rose2,
      'color-event-3': mist.iris,
      'color-event-4': mist.sage,
      'color-event-5': '#C89BB8',

      'color-ring': '#7A9BC0',
      'color-selected': mist.sky2,
      'color-weekend': mist.rose,

      ...radii,
      'shadow-sm': '0 1px 3px rgba(53, 81, 107, 0.06)',
      'shadow-md': '0 6px 18px rgba(53, 81, 107, 0.08)',
      'shadow-lg': '0 16px 40px rgba(53, 81, 107, 0.12)',
      ...fonts,
    },
    dark: {
      'color-bg': '#0F1A26',
      'color-surface': '#172535',
      'color-surface-muted': '#1E2E42',
      'color-fg': '#E6EEF6',
      'color-fg-muted': '#8DA3BC',
      'color-border': '#2A3E55',
      'color-border-strong': '#456780',

      'color-accent': '#9BB8D4',
      'color-accent-hover': '#B3CCE3',
      'color-accent-fg': '#0F1A26',

      'color-success': '#A7C7B2',
      'color-warning': '#E8C987',
      'color-danger': '#E8B4B4',
      'color-info': '#B8C5E8',

      'color-event-1': '#9BB8D4',
      'color-event-2': '#E8B4B4',
      'color-event-3': '#B8C5E8',
      'color-event-4': '#A7C7B2',
      'color-event-5': '#D9B4CC',

      'color-ring': '#9BB8D4',
      'color-selected': '#2A3E55',
      'color-weekend': '#3A2A34',

      ...radii,
      'shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.3)',
      'shadow-md': '0 6px 18px rgba(0, 0, 0, 0.4)',
      'shadow-lg': '0 16px 40px rgba(0, 0, 0, 0.5)',
      ...fonts,
    },
  },
};
