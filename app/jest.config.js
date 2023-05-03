module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/db/migrations/*.js', '!src/db/seeds/*.js', '!frontend/**/*.*'],
  moduleFileExtensions: ['js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'],
  testPathIgnorePatterns: ['frontend'],
  testURL: 'http://localhost/',
  transformIgnorePatterns: ['/node_modules/(?!@json2csv|@streamparser)'],
};
