/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'abyss': {
          bg: '#020611',
          darkest: '#020611',
          dark: '#061325',
          card: '#0a1d36',
          border: 'rgba(0, 242, 254, 0.18)',
          hover: '#0e2748',
          cyan: '#00f2fe',
        },
        'krill': {
          cyan: '#00f2fe',
          glow: '#4facfe',
          neon: '#00ffcc',
          gold: '#fbbf24',
          danger: '#ff4b4b',
          text: '#e2f1f8',
          muted: '#8ba6be',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        pixel: ['VT323', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 25px rgba(0, 242, 254, 0.25)',
        'cyan-intense': '0 0 40px rgba(0, 242, 254, 0.45)',
      },
    },
  },
  plugins: [],
};
