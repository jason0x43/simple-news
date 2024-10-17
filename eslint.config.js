import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tsEslint.config(
	eslint.configs.recommended,
	...tsEslint.configs.recommended,
	eslintConfigPrettier,
	{
		rules: {
			"no-cond-assign": ["error", "always"],
		},
	},
	{
		ignores: ["*/build/*"],
	},
);
