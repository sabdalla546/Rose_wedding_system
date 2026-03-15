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
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          border: 'hsl(var(--sidebar-border))',
        },
        luxe: {
          background: 'var(--lux-background)',
          sidebar: 'var(--lux-sidebar)',
          card: 'var(--lux-card)',
          elevated: 'var(--lux-elevated)',
          text: 'var(--lux-text)',
          secondary: 'var(--lux-text-secondary)',
          muted: 'var(--lux-text-muted)',
          gold: 'var(--lux-gold)',
          goldSoft: 'var(--lux-gold-soft)',
          goldBorder: 'var(--lux-gold-border)',
          goldGlow: 'var(--lux-gold-glow)',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        luxe: '0 22px 60px rgba(0, 0, 0, 0.42)',
        panel: '0 16px 40px rgba(0, 0, 0, 0.28)',
        glow: '0 0 0 1px rgba(212, 175, 55, 0.12), 0 18px 48px rgba(212, 175, 55, 0.08)',
      },
      backgroundImage: {
        'lux-grid':
          'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
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
