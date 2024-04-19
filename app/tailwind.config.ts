import { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

export default {
	future: {
		hoverOnlyWhenSupported: true
	},

	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		colors: {
			black: colors.black,
			blue: {
				DEFAULT: colors.blue['500'],
				light: colors.blue['50'],
				dark: colors.blue['950']
			},
			current: 'currentColor',
			gray: {
				DEFAULT: colors.neutral['300'],
				'x-light': colors.neutral['100'],
				light: colors.neutral['200'],
				dark: colors.neutral['700'],
				'x-dark': colors.neutral['800']
			},
			green: colors.green['500'],
			red: colors.red['500'],
			transparent: 'transparent',
			white: colors.white,
			yellow: {
				DEFAULT: colors.yellow['300'],
				dark: colors.yellow['950'],
				light: colors.yellow['50']
			}
		}
	},

	plugins: []
} satisfies Config;
