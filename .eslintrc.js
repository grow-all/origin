module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:prettier/recommended'
  ],
  rules: {
    "prettier/prettier": ["error", {
      "endOfLine":"auto"
    }],
    "no-shadow": ["error"],
    "no-process-exit": "off",
  },
  parserOptions: {
    ecmaVersion: 10
  }
}
