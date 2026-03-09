import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  // Ignore Playwright tests
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  // Suppress console noise from production code exercised in error-path tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default config
