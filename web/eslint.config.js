import parent from "../eslint.config.js";
import eslintPluginSvelte from "eslint-plugin-svelte";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import tsEslint from "typescript-eslint";

export default [
	...parent,
	...eslintPluginSvelte.configs["flat/recommended"],
	{
		ignores: [".svelte-kit"],
	},
	{
		files: ["**/*.svelte"],
		languageOptions: {
			parser: svelteParser,
			globals: { ...globals.node, ...globals.browser },
			parserOptions: {
				parser: tsEslint.parser,
			},
		},
		rules: {
			"svelte/no-target-blank": "error",
			"svelte/no-at-debug-tags": "error",
			"svelte/no-reactive-functions": "error",
			"svelte/no-reactive-literals": "error",
		},
	},
];
