module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/public/'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/js/**/*.js',
    '!src/js/**/index.js',
    '!src/js/utils/assets.js', // Assuming this file is for preloading only
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};