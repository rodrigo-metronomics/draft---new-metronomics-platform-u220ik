/**
 * ESLint configuration for the Metronomics Platform frontend
 * 
 * This configuration defines code quality rules, style guidelines, and 
 * React/TypeScript-specific linting rules to ensure consistent code 
 * quality across the React/TypeScript codebase.
 * 
 * @see eslint-plugin-react v7.32.2
 * @see eslint-plugin-react-hooks v4.6.0
 * @see @typescript-eslint/eslint-plugin v5.59.0
 * @see @typescript-eslint/parser v5.59.0
 * @see eslint-plugin-jsx-a11y v6.7.1
 * @see eslint-plugin-import v2.27.5
 * @see eslint-plugin-security v1.7.1
 * @see eslint-plugin-prettier v4.2.1
 * @see eslint-config-prettier v8.8.0
 * @see eslint v8.38.0
 */

module.exports = {
  // Prevents ESLint from looking for configuration files in parent directories
  root: true,
  
  // Parser for TypeScript files
  parser: '@typescript-eslint/parser',
  
  // Parser options
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
    tsconfigRootDir: '.',
  },
  
  // Plugins used for extending ESLint functionality
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'import',
    'security',
    'prettier',
  ],
  
  // Extend recommended configurations
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:security/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier', // Must be last to override other configs
  ],
  
  // Environment settings
  env: {
    browser: true,
    es2022: true,
    jest: true,
  },
  
  // Specific rule configurations
  rules: {
    // Prettier
    'prettier/prettier': 'error',
    
    // General
    'no-console': 'warn', // Warn on console statements
    'no-unused-vars': 'off', // Turned off in favor of TypeScript version
    
    // TypeScript
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_', 
      varsIgnorePattern: '^_' 
    }],
    '@typescript-eslint/explicit-function-return-type': ['error', { 
      allowExpressions: true
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    
    // React
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'off', // Not needed with TypeScript
    'react/jsx-uses-react': 'off', // Not needed with React 17+
    
    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Accessibility
    'jsx-a11y/anchor-is-valid': ['error', {
      components: ['Link'],
      specialLink: ['to'],
    }],
    
    // Imports
    'import/order': ['error', {
      'newlines-between': 'always',
      alphabetize: { order: 'asc' },
    }],
    
    // Security
    'security/detect-object-injection': 'off', // Often causes false positives
  },
  
  // Overrides for specific file patterns
  overrides: [
    {
      // Test files
      files: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        'tests/**/*.ts',
        'tests/**/*.tsx',
      ],
      rules: {
        // Loosen some rules for tests
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
      },
    },
  ],
  
  // Settings for plugins
  settings: {
    // React version detection
    react: {
      version: 'detect',
    },
    // Import resolver settings
    'import/resolver': {
      node: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        moduleDirectory: ['node_modules', 'src'],
      },
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
};