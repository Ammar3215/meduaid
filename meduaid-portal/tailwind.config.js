/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C63FF', // main purple
          dark: '#4B47B6',
          light: '#A393F9',
        },
        accent: {
          DEFAULT: '#3F51B5', // blue accent
          light: '#E3E6FC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

