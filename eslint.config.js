import eslint from "@eslint/js";
import ts from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default ts.config(
	eslint.configs.recommended,
	...ts.configs.recommended,
	prettier,
	{
		rules: {
			"no-cond-assign": ["error", "always"],
		},
	},
	{
		ignores: ["*/build/*"],
	},
);
