/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Glass Morphism 配色方案
        background: {
          DEFAULT: '#2B2B2B',
          sidebar: '#232323',
          card: 'rgba(47, 47, 47, 0.6)',
          header: '#1F1F1F',
          footer: '#1A1A1A',
        },
        // 玻璃态卡片背景
        'glass-card': 'rgba(47, 47, 47, 0.6)',
        // 角色主题色（用于header背景）
        'theme-user': 'rgba(102, 153, 204, 0.1)',
        'theme-assistant': 'rgba(204, 153, 204, 0.1)',
        'theme-tool': 'rgba(102, 204, 204, 0.1)',
        'theme-thinking': 'rgba(255, 204, 102, 0.1)',
        'theme-system': 'rgba(153, 204, 153, 0.1)',
        accent: {
          cyan: '#66CCCC',
          pink: '#F2777A',
          yellow: '#FFCC66',
          blue: '#6699CC',
          green: '#99CC99',
          orange: '#F99157',
          purple: '#CC99CC',
        },
        text: {
          primary: '#D3D0C8',
          secondary: '#999999',
          muted: '#747369',
          link: '#6699CC',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
          hover: 'rgba(255, 255, 255, 0.2)',
        },
      },
      borderRadius: {
        brutal: '2px',
        glass: '8px',
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
  plugins: [require("@tailwindcss/typography")],
}
