/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: {
    // The injected stylesheet is global. Preflight would reset the official
    // RADMIR UI, so the reset lives inside #custom-radmir-hud-root instead.
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        hud: {
          violet: '#a855f7',
          lilac: '#c084fc',
          fuchsia: '#e879f9',
          muted: '#94a3b8',
          glass: 'rgba(15, 12, 24, 0.88)',
        },
      },
    },
  },
  plugins: [],
};
