const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{svelte,js,ts,jsx,tsx}"],
	theme: {
		colors: {
			black: colors.neutral["700"],
			blue: colors.blue["500"],
			current: "currentColor",
			gray: {
				DEFAULT: colors.neutral["300"],
				light: colors.neutral["200"],
				'x-light': colors.neutral["100"],
				dark: colors.neutral["400"],
				'x-dark': colors.neutral["500"],
			},
			green: colors.green["500"],
			red: colors.red["500"],
			transparent: "transparent",
			white: colors.white,
			yellow: {
				DEFAULT: colors.yellow["300"],
				dark: colors.yellow["500"],
				light: colors.yellow["50"],
			},
		},
	},
	plugins: [],
};
