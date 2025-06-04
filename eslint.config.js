export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: "module",
    },
    ignores: ["node_modules/**"],
    plugins: {},
    rules: {
      indent: ["error", 2],
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "single"],
      semi: ["error", "always"],
    },
  },
];
