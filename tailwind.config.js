import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const palette = require('./src/theme/palette.json');
const cssVariableMap = require('./src/theme/css-variable-map.json');

const resolvePath = (obj, path) => {
  return path.reduce((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return acc[key];
    }
    return undefined;
  }, obj);
};

const buildCssVariableDefaults = (theme) => {
  return Object.entries(cssVariableMap).reduce((acc, [cssVar, pathParts]) => {
    const value = resolvePath(theme, pathParts);
    if (typeof value === 'string') {
      acc[cssVar] = value;
    }
    return acc;
  }, {});
};

const defaultThemeId = palette.defaultThemeId;
const defaultTheme = palette.themes[defaultThemeId] ?? Object.values(palette.themes)[0];
const cssVarDefaults = buildCssVariableDefaults(defaultTheme);

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    borderRadius: {
      none: '0px',
      sm: '2px',
      DEFAULT: '2px',
      md: '2px',
      lg: '2px',
      xl: '2px',
      '2xl': '2px',
      '3xl': '2px',
      full: '2px',
    },
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--color-background-primary)',
          sidebar: 'var(--color-background-sidebar)',
          card: 'var(--color-background-card)',
          header: 'var(--color-background-header)',
          footer: 'var(--color-background-footer)',
        },
        surface: {
          muted: 'var(--color-surface-muted)',
          badge: 'var(--color-surface-badge)',
          code: 'var(--color-code-block-background)',
          codeHeader: 'var(--color-surface-code-header)',
          skeleton: 'var(--color-surface-skeleton)',
          glass: 'var(--color-surface-glass)',
        },
        'glass-card': 'var(--color-surface-glass)',
        'theme-user': 'var(--color-tint-user)',
        'theme-assistant': 'var(--color-tint-assistant)',
        'theme-tool': 'var(--color-tint-tool)',
        'theme-thinking': 'var(--color-tint-thinking)',
        'theme-system': 'var(--color-tint-system)',
        accent: {
          cyan: 'var(--color-accent-cyan)',
          pink: 'var(--color-accent-pink)',
          yellow: 'var(--color-accent-yellow)',
          blue: 'var(--color-accent-blue)',
          green: 'var(--color-accent-green)',
          orange: 'var(--color-accent-orange)',
          purple: 'var(--color-accent-purple)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          link: 'var(--color-text-link)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          hover: 'var(--color-border-hover)',
        },
      },
      borderRadius: {
        brutal: '2px',
        glass: '2px',
      },
      boxShadow: {
        brutal: '8px 8px 0 rgba(0, 0, 0, 0.6)',
        'brutal-sm': '4px 4px 0 rgba(0, 0, 0, 0.6)',
        'brutal-lg': '12px 12px 0 rgba(0, 0, 0, 0.7)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-hover': '0 12px 40px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    ({ addBase }) => {
      addBase({
        ':root': cssVarDefaults,
      });
    },
  ],
}
