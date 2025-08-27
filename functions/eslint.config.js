import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { languageOptions: { globals: globals.node } },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-expressions": "off"
    }
  },
  {
    ignores: ["lib/**/*"]
  }
);
