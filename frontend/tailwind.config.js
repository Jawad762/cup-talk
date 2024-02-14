/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purpleOne: '#49108B',
        purpleTwo: '#7E30E1',
        purpleThree: '#E26EE5',
        purpleFour: '#8a2be2',
        purpleHover: '#7925c7',
        purpleDark: '#100023'
      }
    },
  },
  plugins: [],
}

