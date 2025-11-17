import paletteFile from './palette.json';
import cssVariableMapFile from './css-variable-map.json';

export type ThemeId = string;

export interface ThemeColors {
  background: {
    primary: string;
    sidebar: string;
    card: string;
    header: string;
    footer: string;
  };
  surfaces: {
    muted: string;
    badge: string;
    codeHeader: string;
    codeBlock: string;
    skeleton: string;
    glass: string;
    overlayBase: string;
    overlaySoft: string;
  };
  cards: Record<'user' | 'assistant' | 'tool' | 'thinking' | 'system', string>;
  tints: Record<'user' | 'assistant' | 'tool' | 'thinking' | 'system', string>;
  accent: Record<'cyan' | 'pink' | 'yellow' | 'blue' | 'green' | 'orange' | 'purple', string>;
  text: Record<'primary' | 'secondary' | 'muted' | 'link', string>;
  border: Record<'base' | 'hover', string>;
  code: {
    blockBackground: string;
    blockForeground: string;
  };
  syntax: Record<'comment' | 'keyword' | 'string' | 'function' | 'number' | 'operator' | 'variable', string>;
  scrollbar: Record<'track' | 'thumb' | 'thumbHover', string>;
}

export interface ThemeDefinition {
  label: string;
  description?: string;
  colors: ThemeColors;
}

interface ThemePaletteFile {
  defaultThemeId: ThemeId;
  themes: Record<string, ThemeDefinition>;
}

const themeFile = paletteFile as ThemePaletteFile;
const cssVariableMap = cssVariableMapFile as Record<string, string[]>;

export const themes: Record<string, ThemeDefinition> = themeFile.themes;
export const DEFAULT_THEME_ID: ThemeId = themeFile.defaultThemeId;

const resolvePath = (obj: unknown, path: string[]): unknown => {
  return path.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

export type ThemeCssVariables = Record<string, string>;

export const buildCssVariables = (theme: ThemeDefinition): ThemeCssVariables => {
  const variables: ThemeCssVariables = {};
  for (const [cssVar, pathParts] of Object.entries(cssVariableMap)) {
    const value = resolvePath(theme, pathParts);
    if (typeof value === 'string') {
      variables[cssVar] = value;
    }
  }
  return variables;
};

export const getThemeDefinition = (themeId: ThemeId): ThemeDefinition => {
  return themes[themeId] ?? themes[DEFAULT_THEME_ID];
};

export const getAvailableThemes = () => {
  return Object.entries(themes).map(([id, theme]) => ({
    id,
    label: theme.label,
    description: theme.description,
  }));
};

export const applyTheme = (themeId: ThemeId = DEFAULT_THEME_ID): ThemeId => {
  const resolvedThemeId = themes[themeId] ? themeId : DEFAULT_THEME_ID;
  if (typeof document === 'undefined') {
    return resolvedThemeId;
  }

  const theme = getThemeDefinition(resolvedThemeId);
  const vars = buildCssVariables(theme);
  const root = document.documentElement;

  Object.entries(vars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });

  root.dataset.theme = resolvedThemeId;
  return resolvedThemeId;
};
