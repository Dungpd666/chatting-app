/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tg: {
          // Light mode colors (default)
          bg: 'var(--tg-bg)',
          panel: 'var(--tg-panel)',
          panel2: 'var(--tg-panel2)',
          border: 'var(--tg-border)',
          text: 'var(--tg-text)',
          muted: 'var(--tg-muted)',
          accent: 'var(--tg-accent)',
          accentHover: 'var(--tg-accentHover)',
          accentLight: 'var(--tg-accentLight)',
          bubbleOut: 'var(--tg-bubbleOut)',
          bubbleOutHover: 'var(--tg-bubbleOutHover)',
          bubbleIn: 'var(--tg-bubbleIn)',
          bubbleInHover: 'var(--tg-bubbleInHover)',
          success: 'var(--tg-success)',
          warning: 'var(--tg-warning)',
          danger: 'var(--tg-danger)',
          dangerHover: 'var(--tg-dangerHover)',
          bubbleOutText: 'var(--tg-bubbleOutText)',
          shadow: 'var(--tg-shadow)',
        },
      },
      borderRadius: {
        tg: '14px',
        'tg-lg': '18px',
        'tg-xl': '24px',
      },
      boxShadow: {
        tg: '0 6px 24px rgba(0,0,0,.35)',
        'tg-sm': '0 2px 8px rgba(0,0,0,.25)',
        'tg-lg': '0 12px 40px rgba(0,0,0,.45)',
        'tg-glow': '0 0 20px rgba(46, 166, 255, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'fade-in-down': 'fadeInDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 0.6s ease-in-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem',
      },
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
    },
  },
  plugins: [],
}
