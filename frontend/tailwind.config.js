/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Verde principal — tierra fértil
        primary: {
          50:  '#f1f8f2',
          100: '#dcefe0',
          200: '#bce0c4',
          300: '#8fc99e',
          400: '#5dab74',
          500: '#3d8a56',
          600: '#2d6f43',
          700: '#255838',
          800: '#1f462f',
          900: '#1a3a28',
        },
        // Terracota — acento cálido
        accent: {
          50:  '#fdf4ed',
          100: '#fae5d3',
          200: '#f4c7a3',
          300: '#eba26b',
          400: '#df7e42',
          500: '#cc6228',
          600: '#a94e1f',
          700: '#883f1c',
          800: '#6e341c',
          900: '#5b2c1a',
        },
        // Crema / arena — fondos
        sand: {
          50:  '#fdfcf8',
          100: '#f8f4ec',
          200: '#f0e8d8',
          300: '#e3d6bd',
          400: '#cfb98f',
          500: '#b89e6f',
        },
        // Grises neutros cálidos
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
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(45, 111, 67, 0.08), 0 1px 3px -1px rgba(45, 111, 67, 0.06)',
        'card': '0 4px 20px -4px rgba(45, 111, 67, 0.10), 0 2px 8px -2px rgba(45, 111, 67, 0.06)',
        'elevated': '0 12px 40px -8px rgba(45, 111, 67, 0.18), 0 4px 16px -4px rgba(45, 111, 67, 0.10)',
        'glow': '0 0 0 1px rgba(255,255,255,0.4), 0 8px 32px -8px rgba(45, 111, 67, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh': 'radial-gradient(at 0% 0%, rgba(93,171,116,0.18) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(223,126,66,0.14) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(45,111,67,0.16) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(244,199,163,0.18) 0px, transparent 50%)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
