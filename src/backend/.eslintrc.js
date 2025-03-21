/**
 * ESLint configuration for the Metronomics Platform backend
 * 
 * This configuration enforces code quality standards, TypeScript best practices,
 * and security checks for the backend codebase.
 * 
 * @version eslint v8.38.0
 * @version @typescript-eslint/eslint-plugin v5.59.0
 * @version @typescript-eslint/parser v5.59.0
 * @version eslint-config-prettier v8.8.0
 * @version eslint-plugin-import v2.27.5
 * @version eslint-plugin-node v11.1.0
 * @version eslint-plugin-security v1.7.1
 * @version eslint-plugin-prettier v4.2.1
 */

module.exports = {
  // Prevents ESLint from looking for configuration files in parent directories
  root: true,
  
  // Specifies the ESLint parser for TypeScript
  parser: '@typescript-eslint/parser',
  
  // Parser options for TypeScript and ESNext features
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: '.'
  },
  
  // ESLint plugins used for linting
  plugins: [
    '@typescript-eslint',
    'import',
    'node',
    'security',
    'prettier'
  ],
  
  // Extends various recommended configurations
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:node/recommended',
    'plugin:security/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier'
  ],
  
  // Environment settings
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  
  // Specific rule configurations
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',
    
    // General code quality rules
    'no-console': 'warn',
    'no-unused-vars': 'off', // Disabled in favor of TypeScript rule
    
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    '@typescript-eslint/explicit-function-return-type': ['error', {
      'allowExpressions': true
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    
    // Node.js specific rules
    'node/no-missing-import': 'off', // TypeScript handles this
    'node/no-unsupported-features/es-syntax': ['error', {
      'ignores': ['modules']
    }],
    'node/no-unpublished-import': ['error', {
      'allowModules': ['supertest', 'jest', 'ts-jest']
    }],
    
    // Import rules
    'import/order': ['error', {
      'newlines-between': 'always',
      'alphabetize': {
        'order': 'asc'
      }
    }],
    
    // Security rules - disable some that cause false positives
    'security/detect-object-injection': 'off',
    'security/detect-non-literal-fs-filename': 'off'
  },
  
  // Rule overrides for specific file patterns
  overrides: [
    {
      // Test files can have more relaxed rules
      files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        'node/no-unpublished-import': 'off'
      }
    }
  ],
  
  // Settings for plugins
  settings: {
    'import/resolver': {
      // Node.js import resolution
      'node': {
        'extensions': ['.ts', '.js'],
        'moduleDirectory': ['node_modules', 'src']
      },
      // TypeScript import resolution
      'typescript': {
        'alwaysTryTypes': true,
        'project': './tsconfig.json'
      }
    }
  }
};