/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  setupFiles: ["<rootDir>/src/tests/setupEnv.ts"],
  clearMocks: true,
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        diagnostics: false,
      },
    ],
  },
};
