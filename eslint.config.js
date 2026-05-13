// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");

module.exports = defineConfig([
  expoConfig,
  {
    files: ["**/__tests__/**/*.{js,ts,jsx,tsx}", "**/*.test.{js,ts,jsx,tsx}", "**/*.spec.{js,ts,jsx,tsx}"],
    languageOptions: { globals: globals.jest },
  },
  {
    ignores: ["dist/*"],
  },
]);
