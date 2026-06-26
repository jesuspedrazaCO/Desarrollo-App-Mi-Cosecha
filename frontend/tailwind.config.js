/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#edf7f0',
          100: '#d2edda',
          200: '#a8dbb7',
          300: '#72c28e',
          400: '#42a66a',
          500: '#258a4e',
          600: '#1a6e3c',
          700: '#155830',
          800: '#114527',
          900: '#0c3420',
        },
        accent: {
          50:  '#fdf3ee',
          100: '#fae2d4',
          200: '#f4c0a0',
          300: '#ec9666',
          400: '#e37038',
          500: '#c8541e',
          600: '#a34117',
        },
        mint: {
          300: '#86efb0',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        stone: {
          50:  '#fafaf8',
          100: '#f2f1ed',
          200: '#e4e2dc',
          300: '#cbc8bf',
          400: '#9c988c',
          500: '#79766b',
          600: '#5e5b52',
          700: '#46443d',
          800: '#302e2a',
          900: '#1f1e1b',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        'glass':    '0 4px 24px -4px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.18)',
        'glass-lg': '0 8px 40px -8px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.16)',
        'glass-xl': '0 20px 60px -12px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.14)',
        'glow-green': '0 0 0 1px rgba(66,166,106,0.35), 0 8px 32px -8px rgba(37,138,78,0.5)',
        'soft': '0 2px 12px -2px rgba(0,0,0,0.12)',
        'card': '0 4px 20px -4px rgba(0,0,0,0.16)',
        'elevated': '0 12px 40px -8px rgba(0,0,0,0.24)',
      },
    },
  },
  plugins: [],
}
