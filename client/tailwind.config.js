/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // AetherHealth design tokens (Design.md)
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#4f46e5', // deep indigo
          600: '#4338ca',
          700: '#3730a3',
          900: '#1e1b4b',
        },
        secondary: {
          400: '#2dd4bf',
          500: '#14b8a6', // teal
          600: '#0d9488',
        },
        surface: '#f8fafc',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
