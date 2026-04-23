import type { ThemeId } from '@kairo/shared';
import { deepNight } from './themes/deep-night.js';
import { morningMist } from './themes/morning-mist.js';
import { paperBook } from './themes/paper-book.js';
import { warmJapandi } from './themes/warm-japandi.js';
import type { ThemeDefinition } from './types.js';

export * from './types.js';
export * from './css.js';

export const themes: Record<ThemeId, ThemeDefinition> = {
  'warm-japandi': warmJapandi,
  'morning-mist': morningMist,
  'deep-night': deepNight,
  'paper-book': paperBook,
};

export const themeList: ThemeDefinition[] = Object.values(themes);

export function getTheme(id: ThemeId): ThemeDefinition {
  return themes[id];
}
