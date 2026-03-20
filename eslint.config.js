// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // dist を lint 対象から除外
  {
    ignores: ["dist"],
  },

  // JavaScript の基本ルール
  js.configs.recommended,

  // TypeScript の推奨ルール
  ...tseslint.configs.recommended,

  // プロジェクト固有の設定
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      // "@typescript-eslint/no-unused-vars": "warn",
      // "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
