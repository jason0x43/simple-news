import { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

export default {
	future: {
		hoverOnlyWhenSupported: true,
	},

	content: ["./src/**/*.{html,js,svelte,ts}"],

	theme: {
		extend: {
			colors: {
				black: colors.black,
				blue: {
					DEFAULT: colors.blue["500"],
					light: colors.blue["50"],
					dark: colors.blue["950"],
				},
				current: "currentColor",
				gray: {
					DEFAULT: colors.gray["300"],
					"x-x-light": colors.gray["50"],
					"x-light": colors.gray["100"],
					light: colors.gray["200"],
					dark: colors.gray["700"],
					"x-dark": colors.gray["800"],
					"x-x-dark": colors.gray["900"],
				},
				green: {
					DEFAULT: colors.green["500"],
					light: colors.green["200"],
					dark: colors.green["700"],
				},
				red: {
					DEFAULT: colors.red["500"],
					light: colors.red["200"],
					dark: colors.red["700"],
				},
				transparent: "transparent",
				white: colors.white,
				yellow: {
					DEFAULT: colors.yellow["300"],
					dark: colors.yellow["950"],
					light: colors.yellow["50"],
				},
				hover: {
					light: colors.neutral["100"],
					dark: colors.neutral["900"],
				},
				border: {
					light: colors.neutral["200"],
					dark: colors.neutral["800"],
				},
				text: {
					light: colors.neutral["700"],
					dark: colors.neutral["400"],
				},
				disabled: {
					light: colors.neutral["300"],
					dark: colors.neutral["700"],
				},
				modal: {
					light: colors.neutral["200"],
					dark: colors.neutral["800"],
				},
			},
		},
	},

	plugins: [],
} satisfies Config;
