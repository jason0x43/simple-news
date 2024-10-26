import parent from "../eslint.config.js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";

export default [
	...parent,
	...svelte.configs["flat/recommended"],
	{
		ignores: [".svelte-kit"],
	},
	{
		files: ["**/*.svelte"],
		languageOptions: {
			globals: { ...globals.node, ...globals.browser },
			parserOptions: {
				parser: ts.parser,
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
