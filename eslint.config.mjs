import tseslint from "typescript-eslint";
import globals from "globals";
import prettierConfig from "eslint-config-prettier/flat";

export default tseslint.config(
  {
    ignores: [".output/", ".wxt/", "node_modules/"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.webextensions,
      },
    },
  },
  prettierConfig,
);
