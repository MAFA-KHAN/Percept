/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'chip-in': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'dot-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.75' },
          '50%': { transform: 'scale(1.8)', opacity: '0' },
        },
        'soft-glow': {
          '0%, 100%': {
            boxShadow:
              '0 0 0 1px rgba(129,140,248,0.15), 0 0 48px rgba(99,102,241,0.12), 0 0 96px rgba(99,102,241,0.06)',
          },
          '50%': {
            boxShadow:
              '0 0 0 1px rgba(129,140,248,0.25), 0 0 56px rgba(99,102,241,0.18), 0 0 112px rgba(99,102,241,0.08)',
          },
        },
        'pipeline-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(129, 140, 248, 0.4), 0 0 20px rgba(129, 140, 248, 0.2)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 0 6px rgba(129, 140, 248, 0), 0 0 28px rgba(129, 140, 248, 0.45)',
            transform: 'scale(1.06)',
          },
        },
        'results-in': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'chip-in': 'chip-in 0.6s ease-out forwards',
        'dot-pulse': 'dot-pulse 2.4s ease-in-out infinite',
        'soft-glow': 'soft-glow 4s ease-in-out infinite',
        'pipeline-pulse': 'pipeline-pulse 0.8s ease-in-out infinite',
        'results-in': 'results-in 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
