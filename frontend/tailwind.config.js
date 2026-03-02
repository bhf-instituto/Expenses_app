/** @type {import('tailwindcss').Config} */
const colorFromVar = (variableName) => `rgb(var(${variableName}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Outfit"', 'sans-serif'],
        body: ['"Nunito Sans"', 'sans-serif'],
      },
      colors: {
        app: {
          bg: colorFromVar('--app-bg'),
          panel: colorFromVar('--app-panel'),
          mint: colorFromVar('--app-accent-soft'),
          coral: colorFromVar('--app-accent-main'),
          sky: colorFromVar('--app-accent-alt'),
          warning: colorFromVar('--app-accent-warning'),
          ink: colorFromVar('--app-text-primary'),
          muted: colorFromVar('--app-text-muted'),
          'success-bg': colorFromVar('--app-success-bg'),
          'success-border': colorFromVar('--app-success-border'),
          'success-text': colorFromVar('--app-success-text'),
          'error-bg': colorFromVar('--app-error-bg'),
          'error-border': colorFromVar('--app-error-border'),
          'error-text': colorFromVar('--app-error-text'),
          'status-online-bg': colorFromVar('--app-status-online-bg'),
          'status-online-border': colorFromVar('--app-status-online-border'),
          'status-online-text': colorFromVar('--app-status-online-text'),
          'status-offline-bg': colorFromVar('--app-status-offline-bg'),
          'status-offline-border': colorFromVar('--app-status-offline-border'),
          'status-offline-text': colorFromVar('--app-status-offline-text'),
          'status-pending-bg': colorFromVar('--app-status-pending-bg'),
          'status-pending-border': colorFromVar('--app-status-pending-border'),
        },
      },
      boxShadow: {
        card: '0 10px 30px rgba(0, 0, 0, 0.18)',
      },
      keyframes: {
        riseIn: {
          '0%': { opacity: 0, transform: 'translateY(14px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        riseIn: 'riseIn 260ms ease-out both',
      },
    },
  },
  plugins: [],
}
