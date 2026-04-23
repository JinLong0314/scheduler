/**
 * Primitive color palettes — single source of truth for raw hex values.
 * NOT consumed directly by components. Only used by semantic maps in `themes/*`.
 */

export const neutral = {
  0: '#FFFFFF',
  50: '#FAFAFA',
  100: '#F5F5F5',
  150: '#ECECEC',
  200: '#E5E5E5',
  300: '#D4D4D4',
  400: '#A3A3A3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0A0A0A',
  1000: '#000000',
} as const;

// Warm Japandi — linen / coral / clay
export const warm = {
  ink: '#5D4037',
  ink2: '#8D6E63',
  ink3: '#A1887F',
  linen: '#FAF3E8',
  linen2: '#F5EBDA',
  cream: '#FFFFFF',
  coral: '#E8956A',
  coralDeep: '#D4845A',
  clay: '#D4A373',
  sand: '#E0D5C5',
  blush: '#FFE8D6',
  peach: '#FFB7B2',
} as const;

// Morning Mist — watercolor blue / blush pink
export const mist = {
  sky: '#E6F0F7',
  sky2: '#D2E1EC',
  cloud: '#FFFFFF',
  ink: '#35516B',
  ink2: '#5E7D96',
  ink3: '#93AEC3',
  rose: '#E9B9B9',
  rose2: '#D89797',
  iris: '#A7B8E8',
  sage: '#B8D0C0',
  dew: '#F5FAFC',
  line: '#CBD9E3',
} as const;

// Deep Night — OLED black / electric cyan
export const night = {
  void: '#000000',
  obsidian: '#0A0A0F',
  carbon: '#12121A',
  slate: '#1C1C28',
  slate2: '#2A2A3A',
  line: '#32324A',
  lineStrong: '#45456B',
  mist: '#9B9BB8',
  ghost: '#CFCFE0',
  star: '#EDEDF5',
  cyan: '#6EE7F9',
  cyanDeep: '#3DD4EC',
  magenta: '#F472B6',
  lime: '#A3E635',
  amber: '#FBBF24',
} as const;

// Paper Book — eggshell / ink black / vermilion
export const paper = {
  sheet: '#FBF8F1',
  sheet2: '#F3EEE2',
  ink: '#1A1A1A',
  ink2: '#3A3A3A',
  ink3: '#6B6B6B',
  vermilion: '#C8432C',
  vermilionDeep: '#A3321F',
  indigo: '#32407B',
  ochre: '#C89B3C',
  moss: '#6A7F4C',
  rule: '#D9D3C4',
  ruleStrong: '#B8AE97',
} as const;

export const fontStacks = {
  sansCJK:
    '"Inter", "Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", system-ui, -apple-system, sans-serif',
  serifCJK: '"Source Serif Pro", "Noto Serif SC", "Songti SC", Georgia, serif',
  mono: '"JetBrains Mono", "Cascadia Code", Consolas, "Courier New", monospace',
} as const;
