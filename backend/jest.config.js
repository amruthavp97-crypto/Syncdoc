/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/src/tests/**/*.test.ts"],
  setupFiles: ["<rootDir>/src/tests/jest.setup.ts"],
  testTimeout: 30000,
};
