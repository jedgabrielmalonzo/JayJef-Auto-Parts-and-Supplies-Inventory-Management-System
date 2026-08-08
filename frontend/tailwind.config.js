/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Tailwind's default spacing (4px base) and radius scale (sm=2px,
      // DEFAULT=4px, lg=8px) already match docs/09-design-system.md exactly
      // — only colors and fonts need to be added.
      colors: {
        red: {
          50: '#FDF1F1',
          100: '#FBE4E3',
          300: '#E88685',
          500: '#E23F3C',
          600: '#D7211E', // Shop Red — brand primary
          700: '#B01917',
          800: '#8A1210',
        },
        black: {
          900: '#111111', // Shop Black — primary text
          700: '#3A3A3A',
          500: '#6B6B6B',
          300: '#9B9B9B',
        },
        gray: {
          50: '#FAFAFA',
          100: '#F2F2F2',
          200: '#E4E4E4',
          300: '#D1D1D1',
        },
        green: {
          100: '#E3F3E6',
          600: '#1E7B34',
          700: '#155F28',
        },
        amber: {
          100: '#FBEEDA',
          700: '#946200',
        },
        blue: {
          100: '#E7EEF5',
          600: '#3A6EA5',
        },
      },
      fontFamily: {
        // Self-hosted via @fontsource/* (see docs/09-design-system.md
        // assumptions) — no CDN dependency for a LAN app.
        display: ['"Archivo Black"', 'sans-serif'],
        heading: ['Archivo', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        // Matches docs/09-design-system.md duration tokens (120ms/180ms) —
        // modal/dialog entrances only, gated by motion-safe: at each call site.
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.96) translateY(4px)' }, to: { opacity: 1, transform: 'scale(1) translateY(0)' } },
      },
      animation: {
        'fade-in': 'fadeIn 180ms ease-out',
        'scale-in': 'scaleIn 180ms ease-out',
      },
    },
  },
  plugins: [],
}
