export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['backend/src/**/*.js'],
  coverageDirectory: 'coverage',
  verbose: true,
};
