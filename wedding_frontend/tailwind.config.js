import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: {
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        background: 'var(--color-bg)',
        foreground: 'var(--color-text)',
        card: 'var(--color-surface)',
        'card-foreground': 'var(--color-text)',
        popover: 'var(--color-surface)',
        'popover-foreground': 'var(--color-text)',
        primary: 'var(--color-primary)',
        'primary-foreground': 'var(--color-primary-foreground)',
        secondary: 'var(--color-surface-2)',
        'secondary-foreground': 'var(--color-text)',
        muted: 'var(--color-surface-2)',
        'muted-foreground': 'var(--color-text-muted)',
        accent: 'var(--color-surface-3)',
        'accent-foreground': 'var(--color-text)',
        border: 'var(--color-border)',
        input: 'var(--color-control-border)',
        ring: 'var(--color-primary)',
        sidebar: {
          DEFAULT: 'var(--color-shell)',
          foreground: 'var(--color-text)',
          border: 'var(--color-border)',
        },
        app: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          'surface-2': 'var(--color-surface-2)',
          border: 'var(--color-border)',
          text: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          primary: 'var(--color-primary)',
          danger: 'var(--color-danger)',
          success: 'var(--color-success)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-md)',
        '2xl': 'var(--radius-lg)',
        '3xl': 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        luxe: 'var(--shadow-md)',
        panel: 'var(--shadow-sm)',
        glow: 'var(--focus-ring)',
      },
      spacing: {
        page: 'var(--space-page)',
        section: 'var(--space-section)',
        card: 'var(--space-card)',
      },
      fontFamily: {
        sans: ['Cairo', 'ui-sans-serif', 'system-ui'],
        display: ['Cairo', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        'fade-in': 'fade-in 0.45s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [animate],
}
