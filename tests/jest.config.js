/**
 * Jest Configuration for Phase 6: Testing and Quality Assurance
 * Comprehensive testing setup for Aion Visualization project
 */

export default {
  // Testing environment
  testEnvironment: 'jsdom',
  
  // Module configuration
  moduleFileExtensions: ['js', 'json', 'html'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/tests/coverage',
  coverageReporters: ['html', 'text', 'lcov', 'json'],
  collectCoverageFrom: [
    'assets/js/**/*.js',
    '!assets/js/**/*.min.js',
    '!assets/js/**/vendor/**',
    '!**/node_modules/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/assets/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Global variables
  globals: {
    'window': true,
    'document': true,
    'navigator': true,
    'location': true
  },
  
  // Verbose output
  verbose: true,
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './tests/reports',
      filename: 'jest-report.html',
      expand: true
    }]
  ]
};