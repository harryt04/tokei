/**
 * Tests for the getRoutine server action.
 */

// ─── Mock setup ──────────────────────────────────────────────────────────────

const mockFetch = jest.fn()
global.fetch = mockFetch

// Set the env var the action uses
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'

import { getRoutine } from '@/actions/routine'

beforeEach(() => {
  jest.clearAllMocks()
})

// ═════════════════════════════════════════════════════════════════════════════
// Auth guard
// ═════════════════════════════════════════════════════════════════════════════

describe('getRoutine — auth guard', () => {
  it('returns 401 when user is undefined', async () => {
    const result = await getRoutine('some-id', undefined)

    expect(result).toEqual({
      notFound: true,
      error: expect.any(Error),
      status: 401,
      message: 'Unauthorized',
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns 401 when user has no id', async () => {
    const result = await getRoutine('some-id', {})

    expect(result).toEqual({
      notFound: true,
      error: expect.any(Error),
      status: 401,
      message: 'Unauthorized',
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns 401 when user.id is undefined', async () => {
    const result = await getRoutine('some-id', { id: undefined })

    expect(result).toEqual(
      expect.objectContaining({ status: 401, message: 'Unauthorized' }),
    )
  })

  it('returns 401 when user.id is empty string', async () => {
    // Empty string is falsy
    const result = await getRoutine('some-id', { id: '' })

    expect(result).toEqual(
      expect.objectContaining({ status: 401, message: 'Unauthorized' }),
    )
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Successful fetch
// ═════════════════════════════════════════════════════════════════════════════

describe('getRoutine — success', () => {
  it('fetches routine with correct URL and options', async () => {
    const routineData = { _id: 'r1', name: 'Morning' }
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(routineData),
    })

    await getRoutine('r1', { id: 'user1' })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/routine?id=r1',
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      },
    )
  })

  it('returns parsed JSON on success', async () => {
    const routineData = {
      _id: 'r1',
      name: 'Morning',
      userId: 'user1',
      swimLanes: [],
    }
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(routineData),
    })

    const result = await getRoutine('r1', { id: 'user1' })

    expect(result).toEqual(routineData)
  })

  it('includes routineId in the URL query parameter', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await getRoutine('abc-123-def', { id: 'user1' })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('id=abc-123-def'),
      expect.any(Object),
    )
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Error responses
// ═════════════════════════════════════════════════════════════════════════════

describe('getRoutine — error responses', () => {
  it('returns error object when response is not ok (404)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    const result = await getRoutine('nonexistent', { id: 'user1' })

    expect(result).toEqual({
      notFound: true,
      error: expect.objectContaining({ status: 404 }),
      status: 404,
      message: 'Not Found',
    })
  })

  it('returns error object when response is 500', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    const result = await getRoutine('r1', { id: 'user1' })

    expect(result).toEqual(
      expect.objectContaining({
        notFound: true,
        status: 500,
        message: 'Internal Server Error',
      }),
    )
  })

  it('returns error object when response is 401 (expired session)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    const result = await getRoutine('r1', { id: 'user1' })

    expect(result).toEqual(
      expect.objectContaining({
        notFound: true,
        status: 401,
        message: 'Unauthorized',
      }),
    )
  })

  it('returns error object when response is 400', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    })

    const result = await getRoutine('', { id: 'user1' })

    expect(result).toEqual(
      expect.objectContaining({
        notFound: true,
        status: 400,
        message: 'Bad Request',
      }),
    )
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Edge cases
// ═════════════════════════════════════════════════════════════════════════════

describe('getRoutine — edge cases', () => {
  it('handles routineId with special characters', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ _id: 'id-with-special' }),
    })

    await getRoutine('id/with&special=chars', { id: 'user1' })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('id=id/with&special=chars'),
      expect.any(Object),
    )
  })

  it('uses NEXT_PUBLIC_BASE_URL from environment', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await getRoutine('r1', { id: 'user1' })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/localhost:3000/),
      expect.any(Object),
    )
  })

  it('always sends GET method', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await getRoutine('r1', { id: 'user1' })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('always includes credentials', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await getRoutine('r1', { id: 'user1' })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: 'include' }),
    )
  })
})
