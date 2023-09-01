/** @type {import('tailwindcss').Config} */

import colors, { gray } from 'tailwindcss/colors'

export default {
  content: [
    "./client/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      header: {
        bg: colors.gray[800],
        text: colors.white
      },
      primary: {
        bg: colors.gray[500],
        text: colors.white
      },
      secondary: {
        bg: colors.sky[300],
        text: colors.gray[700]
      },
      menu: {
        bg: colors.white,
        text: colors.black,
        hover: colors.gray[200],
      },
    }
  },
  plugins: [],
}

