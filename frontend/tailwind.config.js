/** @type {import('tailwindcss').Config} */
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
          bg: '#f6f4eb',
          panel: '#fefefe',
          mint: '#9be7d8',
          coral: '#f5b6a4',
          sky: '#a9d9ff',
          ink: '#1e2a39',
          muted: '#61708a',
          warning: '#ffdd8b',
        },
      },
      boxShadow: {
        card: '0 10px 30px rgba(30, 42, 57, 0.12)',
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
