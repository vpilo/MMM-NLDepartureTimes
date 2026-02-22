import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/", "node_modules/", "build/"]
  },

  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        Module: "readonly",
        Log: "readonly",
        moment: "readonly",
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,

      "no-unused-vars": "warn",
      "no-console": "off",
      "semi": ["error", "always"]
    },
  }
];
