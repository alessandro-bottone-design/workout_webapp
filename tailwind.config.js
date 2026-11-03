/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          app: '#0A0A0C',
          surface: '#161618',
          elevated: '#202024',
          glass: 'rgba(255, 255, 255, 0.05)',
          'glass-elevated': 'rgba(255, 255, 255, 0.09)',
          'glass-active': 'rgba(255, 255, 255, 0.14)',
        },
        text: {
          primary: '#F5F5F7',
          secondary: '#98989D',
          tertiary: '#636366',
        },
        border: {
          default: '#2C2C2E',
          glass: 'rgba(255, 255, 255, 0.08)',
          'glass-strong': 'rgba(255, 255, 255, 0.16)',
        },
        accent: {
          primary: '#FFFFFF',
          muted: 'rgba(255, 255, 255, 0.12)',
        },
        icon: {
          primary: '#F5F5F7',
          secondary: '#98989D',
          accent: '#FFFFFF',
          'on-accent': '#0A0A0C',
        },
        danger: '#FF453A',
        warning: '#FFD60A',
        success: '#30D158',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        'display': ['32px', { fontWeight: '600', lineHeight: '1.2' }],
        'title': ['24px', { fontWeight: '600', lineHeight: '1.25' }],
        'title-sm': ['20px', { fontWeight: '600', lineHeight: '1.3' }],
        'title-lg': ['28px', { fontWeight: '600', lineHeight: '1.2' }],
        'heading': ['18px', { fontWeight: '600', lineHeight: '1.35' }],
        'body': ['16px', { fontWeight: '400', lineHeight: '1.5' }],
        'meta': ['14px', { fontWeight: '400', lineHeight: '1.4' }],
        'label-sm': ['12px', { fontWeight: '600', lineHeight: '1.3' }],
        'numeric-lg': ['56px', { fontWeight: '600', lineHeight: '1' }],
      },
      borderRadius: {
        'sm': '8px',
        'btn': '16px',
        'card': '24px',
        'modal': '32px',
        'pill': '9999px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'screen': '100dvh',
        'touch': '48px',
      },
      height: {
        'cta': '48px',
        'touch': '48px',
      },
      animation: {
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
