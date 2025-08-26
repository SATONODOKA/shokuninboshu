/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1BA3A3',
          hover: '#159090',
          pale: '#E6F6F6'
        },
        ink: {
          900: '#0B1320',
          800: '#162027',
          600: '#4B5563',
          500: '#6B7280'
        },
        ui: {
          bg: '#F7F9FB',
          line: '#E6E8EB'
        },
        state: {
          ok: '#10B981',
          warn: '#F59E0B',
          err: '#EF4444'
        }
      }
    },
  },
  plugins: [],
}

