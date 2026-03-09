/**
 * Jest global setup — runs after the test framework is installed.
 *
 * Suppresses console.log and console.error output that comes from
 * production code exercised during error-path tests (e.g. catch blocks
 * that log before returning a 500, or informational logs in utilities).
 *
 * Tests that need to assert on console output should use jest.spyOn
 * within the test itself — those spies take precedence over these mocks.
 */
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})
