import type { Mode, SemanticTokens, ThemeDefinition } from './types.js';

/** Render a theme to a CSS block targeting `[data-theme="<id>"][data-mode="<mode>"]`. */
export function themeToCss(theme: ThemeDefinition, mode: Mode): string {
  const selector = `[data-theme="${theme.id}"][data-mode="${mode}"]`;
  const decls = Object.entries(theme.tokens[mode])
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n');
  return `${selector} {\n${decls}\n}`;
}

/** Emit a consolidated CSS string for all themes in both modes. */
export function themesToCss(themes: ThemeDefinition[]): string {
  const blocks: string[] = [];
  for (const theme of themes) {
    blocks.push(themeToCss(theme, 'light'));
    blocks.push(themeToCss(theme, 'dark'));
  }
  return blocks.join('\n\n');
}

/** Apply tokens imperatively at runtime (used by ThemeProvider). */
export function applyTokens(root: HTMLElement, tokens: SemanticTokens): void {
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(`--${key}`, value);
  }
}
