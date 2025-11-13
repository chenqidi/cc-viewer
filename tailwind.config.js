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
        // Spacegray Eighties 配色方案
        background: {
          DEFAULT: '#2B2B2B',
          sidebar: '#232323',
          card: '#353535',
          header: '#1F1F1F',      // 深色 header 背景
          footer: '#1A1A1A',      // 更深的底部背景
        },
        'card-user': '#3A3A3A',
        'card-assistant': '#353535',
        'card-tool': '#2F4F4F',
        'card-thinking': '#3D3356',
        'card-system': '#4F2F2F',
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
        border: '#000000',
      },
      borderRadius: {
        brutal: '2px',
      },
      boxShadow: {
        brutal: '8px 8px 0 rgba(0, 0, 0, 0.6)',
        'brutal-sm': '4px 4px 0 rgba(0, 0, 0, 0.6)',
        'brutal-lg': '12px 12px 0 rgba(0, 0, 0, 0.7)',
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
