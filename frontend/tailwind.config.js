/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#253653',
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          700: '#334E68',
          800: '#253653',
          900: '#182438',
        },
        actionBlue: {
          DEFAULT: '#38A0D8',
          light: '#62B8E5',
          dark: '#267CAE',
        },
        highlightOrange: {
          DEFAULT: '#E57116',
          light: '#F28B38',
          dark: '#B8550B',
        },
        accentYellow: {
          DEFAULT: '#F7C000',
          light: '#FFD333',
          dark: '#C79A00',
        },
        lightGrey: {
          DEFAULT: '#F5F5F5',
          dark: '#EAEAEA',
        },
      },
      fontFamily: {
        heading: ['Play', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(37, 54, 83, 0.08), 0 2px 6px -1px rgba(37, 54, 83, 0.04)',
        'premium-hover': '0 12px 32px -4px rgba(37, 54, 83, 0.12), 0 4px 12px -2px rgba(37, 54, 83, 0.06)',
      },
    },
  },
  plugins: [],
}
