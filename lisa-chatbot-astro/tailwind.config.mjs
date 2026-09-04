/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#006c4b',
        'primary-variant': '#005238',
        secondary: '#4d6357',
        tertiary: '#3d6373',
        error: '#ba1a1a',
        surface: '#f9f9f7',
        'surface-container': '#eeeeec',
        'surface-container-low': '#f4f4f2',
        'on-surface': '#1a1c1b',
        'on-surface-variant': '#404943',
        outline: '#707973',
        'outline-variant': '#c0c9c1',
        csr: { orange: '#D99324', green: '#19946C', gray: '#EAECEF' },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
    },
  },
  plugins: [],
};
