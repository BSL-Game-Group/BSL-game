const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // code quality
      "no-unused-vars": "warn",
      "no-undef": "error",
      "prefer-const": "error",
      "eqeqeq": "error",
      "curly": "error",

      // backend logging policy
      "no-console": "off" // allow logs in backend
    },
  },
];