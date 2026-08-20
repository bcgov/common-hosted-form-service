module.exports = {
  detectOpenHandles: true,
  clearMocks: true,
  collectCoverage: false,
  moduleFileExtensions: ['js', 'json'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/tests/integration/**/*.spec.(js|jsx|ts|tsx)'],
  testPathIgnorePatterns: ['frontend'],
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
  testTimeout: 30000,
  transformIgnorePatterns: ['/node_modules/(?!@json2csv|@streamparser)'],
};
