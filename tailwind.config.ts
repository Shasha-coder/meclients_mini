/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0faf4',
          100: '#d6f5e3',
          200: '#aeeac8',
          300: '#78d8a7',
          400: '#4abf84',
          500: '#5fca8a', // primary green (matches landing)
          600: '#3da86e',
          700: '#2e8557',
          800: '#276845',
          900: '#1e5236',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f7f8fa',
          border: '#e8edf2',
        },
        ink: {
          DEFAULT: '#0f172a',
          muted: '#64748b',
          faint: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(15, 23, 42, 0.06)',
        card: '0 1px 4px rgba(15, 23, 42, 0.08)',
        lifted: '0 8px 32px rgba(15, 23, 42, 0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'ticker': 'ticker 30s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
