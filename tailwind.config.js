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
          blue: '#0B2341', // Goodyear blueish tone
          yellow: '#FFD100', // Goodyear yellow tone
        }
      }
    },
  },
  plugins: [],
}
