module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: {
    browser: true,
    es2022: true,
    webextensions: true,
  },
  extends: ["prettier"],
  ignorePatterns: [".output/", ".wxt/", "node_modules/"],
};
