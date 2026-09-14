/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0F172A', accent: '#F59E0B', soft: '#F8FAFC' }
      }
    }
  },
  plugins: []
};
