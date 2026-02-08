export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    ignores: ['node_modules/**', '**/*.min.js'],
    plugins: {},
    rules: {
      indent: ['error', 2],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
    },
  },
  {
    files: ['src/features/**/*.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#(?:[0-9a-fA-F]{3}){1,2}$/]",
          message: 'Use semantic color tokens instead of hardcoded hex values in feature pages.',
        },
        {
          selector: "Literal[value=/^(?:rgb|hsl)a?\\(/]",
          message: 'Use semantic color tokens instead of raw rgb/hsl color values in feature pages.',
        },
        {
          selector: "Literal[value=/^[0-9.]+(?:px|rem)$/]",
          message: 'Use spacing tokens (for example, var(--space-* )) instead of hardcoded spacing literals in feature pages.',
        },
      ],
    },
  },
];
