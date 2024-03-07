/** @type {import('tailwindcss').Config} */

import colors from "tailwindcss/colors";

export default {
	content: ["./client/**/*.{js,ts,jsx,tsx}"],
	theme: {
		colors: {
			transparent: "transparent",
			current: "currentColor",
			header: {
				bg: colors.gray[800],
				text: colors.white,
			},
			primary: {
				bg: colors.gray[500],
				text: colors.white,
			},
			secondary: {
				bg: colors.sky[300],
				text: colors.gray[700],
			},
			menu: {
				bg: colors.white,
				text: colors.black,
				hover: colors.gray[200],
			},
			delete: {
				bg: colors.red[500],
				text: colors.white,
			},
			success: {
				bg: colors.green[500],
				text: colors.white,
			},
			warning: {
				bg: colors.yellow[500],
				text: colors.white,
			},
		},
		screens: {
			"sm": "640px",
			"md": "768px",
			"lg": "1024px",
			"xl": "1280px",
			"2xl": "1536px",
		},
	},
	plugins: [],
};

