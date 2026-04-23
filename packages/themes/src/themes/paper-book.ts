import { fontStacks, paper } from '../primitives.js';
import type { ThemeDefinition } from '../types.js';

const radii = {
  'radius-sm': '2px',
  'radius-md': '4px',
  'radius-lg': '6px',
  'radius-xl': '10px',
};

const fonts = {
  'font-sans': fontStacks.serifCJK, // serif-primary in this theme
  'font-serif': fontStacks.serifCJK,
  'font-mono': fontStacks.mono,
};

export const paperBook: ThemeDefinition = {
  id: 'paper-book',
  name: '纸质书感',
  description: '米白蛋壳 · 墨黑 · 朱砂红点缀 · 沉静阅读感',
  preview: '📖',
  tokens: {
    light: {
      'color-bg': paper.sheet,
      'color-surface': '#FFFFFF',
      'color-surface-muted': paper.sheet2,
      'color-fg': paper.ink,
      'color-fg-muted': paper.ink3,
      'color-border': paper.rule,
      'color-border-strong': paper.ruleStrong,

      'color-accent': paper.vermilion,
      'color-accent-hover': paper.vermilionDeep,
      'color-accent-fg': '#FFFFFF',

      'color-success': paper.moss,
      'color-warning': paper.ochre,
      'color-danger': paper.vermilion,
      'color-info': paper.indigo,

      'color-event-1': paper.vermilion,
      'color-event-2': paper.indigo,
      'color-event-3': paper.ochre,
      'color-event-4': paper.moss,
      'color-event-5': '#7B5E8C',

      'color-ring': paper.vermilion,
      'color-selected': '#F0E8D4',
      'color-weekend': '#EADFC8',

      ...radii,
      'shadow-sm': '0 1px 0 rgba(26, 26, 26, 0.06)',
      'shadow-md': '0 2px 8px rgba(26, 26, 26, 0.08)',
      'shadow-lg': '0 8px 24px rgba(26, 26, 26, 0.12)',
      ...fonts,
    },
    dark: {
      'color-bg': '#1C1915',
      'color-surface': '#27241E',
      'color-surface-muted': '#221F19',
      'color-fg': '#EFE8D9',
      'color-fg-muted': '#A89F8A',
      'color-border': '#38342B',
      'color-border-strong': '#5A5243',

      'color-accent': '#E8674D',
      'color-accent-hover': '#F07A63',
      'color-accent-fg': '#1C1915',

      'color-success': '#A7B884',
      'color-warning': '#E0B661',
      'color-danger': '#E8674D',
      'color-info': '#7A89C8',

      'color-event-1': '#E8674D',
      'color-event-2': '#7A89C8',
      'color-event-3': '#E0B661',
      'color-event-4': '#A7B884',
      'color-event-5': '#B090C3',

      'color-ring': '#E8674D',
      'color-selected': '#38342B',
      'color-weekend': '#2E2721',

      ...radii,
      'shadow-sm': '0 1px 0 rgba(0, 0, 0, 0.4)',
      'shadow-md': '0 2px 8px rgba(0, 0, 0, 0.5)',
      'shadow-lg': '0 8px 24px rgba(0, 0, 0, 0.6)',
      ...fonts,
    },
  },
};
