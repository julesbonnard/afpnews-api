module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: [
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: ['./tsconfig.json'],
        sourceType: 'module'
      },
    }
  ],
  plugins: [
    'eslint-plugin-import',
    'eslint-plugin-jsdoc',
    '@typescript-eslint',
    '@typescript-eslint/tslint'
  ],
  rules: {
    indent: ['error', 2],
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/consistent-type-assertions': 'error',
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'none',
          requireLast: true
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false
        }
      }
    ],
    '@typescript-eslint/naming-convention': 'error',
    '@typescript-eslint/no-empty-function': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-new': 'error',
    '@typescript-eslint/no-unnecessary-qualifier': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-unused-expressions': [
      'error',
      {
        allowTaggedTemplates: true,
        allowShortCircuit: true
      }
    ],
    '@typescript-eslint/prefer-namespace-keyword': 'error',
    '@typescript-eslint/quotes': [
      'error',
      'single',
      {
        avoidEscape: true
      }
    ],
    '@typescript-eslint/semi': [
      'error',
      'never'
    ],
    '@typescript-eslint/triple-slash-reference': [
      'error',
      {
        path: 'always',
        types: 'prefer-import',
        lib: 'always'
      }
    ],
    '@typescript-eslint/tslint/config': [
      'error',
      {
        'rules': {
          'strict-type-predicates': true,
          whitespace: true
        }
      }
    ],
    '@typescript-eslint/type-annotation-spacing': 'error',
    '@typescript-eslint/unified-signatures': 'error',
    'brace-style': [
      'error',
      '1tbs'
    ],
    'comma-dangle': 'error',
    'curly': [
      'error',
      'multi-line'
    ],
    'eol-last': 'error',
    'eqeqeq': [
      'error',
      'smart'
    ],
    'id-blacklist': [
      'error',
      'any',
      'Number',
      'number',
      'String',
      'string',
      'Boolean',
      'boolean',
      'Undefined',
      'undefined'
    ],
    'id-match': 'error',
    'import/no-deprecated': 'error',
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-indentation': 'error',
    'jsdoc/newline-after-description': 'error',
    'new-parens': 'error',
    'no-caller': 'error',
    'no-cond-assign': 'error',
    'no-constant-condition': 'error',
    'no-control-regex': 'error',
    'no-duplicate-imports': 'error',
    'no-empty': 'error',
    'no-eval': 'error',
    'no-fallthrough': 'error',
    'no-invalid-regexp': 'error',
    'no-multiple-empty-lines': 'error',
    'no-redeclare': 'error',
    'no-regex-spaces': 'error',
    'no-return-await': 'error',
    'no-throw-literal': 'error',
    'no-trailing-spaces': 'error',
    'no-underscore-dangle': 'error',
    'no-unused-labels': 'error',
    'no-var': 'error',
    'one-var': [
      'error',
      'never'
    ],
    'radix': 'error',
    'space-before-function-paren': [
      'error',
      'always'
    ],
    'space-in-parens': [
      'error',
      'never'
    ],
    'spaced-comment': [
      'error',
      'always',
      {
        'markers': [
          '/'
        ]
      }
    ],
    'use-isnan': 'error'
  }
}
