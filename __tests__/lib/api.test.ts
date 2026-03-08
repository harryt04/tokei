import {
  fetchRoutines,
  createRoutine,
  deleteRoutine,
  updateRoutine,
} from '@/lib/api'

// ─── Mock global fetch ───────────────────────────────────────────────────────

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

// ─── fetchRoutines ───────────────────────────────────────────────────────────

describe('fetchRoutines', () => {
  it('calls GET /api/routines and returns routines array', async () => {
    const routines = [
      { _id: '1', userId: 'u1', name: 'Morning' },
      { _id: '2', userId: 'u1', name: 'Evening' },
    ]
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(routines), { status: 200 }),
    )

    const result = await fetchRoutines()

    expect(mockFetch).toHaveBeenCalledWith('/api/routines', {
      cache: 'no-store',
    })
    expect(result).toEqual(routines)
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        statusText: 'Unauthorized',
      }),
    )

    await expect(fetchRoutines()).rejects.toThrow('Error: 401 Unauthorized')
  })

  it('throws on 500 server error', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    )

    await expect(fetchRoutines()).rejects.toThrow(
      'Error: 500 Internal Server Error',
    )
  })
})

// ─── createRoutine ───────────────────────────────────────────────────────────

describe('createRoutine', () => {
  it('calls POST /api/routine and returns the created routine', async () => {
    const newRoutine = { name: 'Workout' }
    const created = { _id: '3', userId: 'u1', name: 'Workout' }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, updatedRoutine: created }), {
        status: 200,
      }),
    )

    const result = await createRoutine(newRoutine)

    expect(mockFetch).toHaveBeenCalledWith('/api/routine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRoutine),
    })
    expect(result).toEqual(created)
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        statusText: 'Unauthorized',
      }),
    )

    await expect(createRoutine({ name: 'Fail' })).rejects.toThrow(
      'Error: 401 Unauthorized',
    )
  })
})

// ─── deleteRoutine ───────────────────────────────────────────────────────────

describe('deleteRoutine', () => {
  it('calls DELETE /api/routine?id=... and resolves', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, deletedCount: 1 }), {
        status: 200,
      }),
    )

    await deleteRoutine('abc123')

    expect(mockFetch).toHaveBeenCalledWith('/api/routine?id=abc123', {
      method: 'DELETE',
    })
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        statusText: 'Not Found',
      }),
    )

    await expect(deleteRoutine('missing')).rejects.toThrow(
      'Error: 404 Not Found',
    )
  })
})

// ─── updateRoutine ───────────────────────────────────────────────────────────

describe('updateRoutine', () => {
  it('calls POST /api/routine?id=... and returns the updated routine', async () => {
    const updates = { name: 'Updated Name' }
    const updated = { _id: 'r1', userId: 'u1', name: 'Updated Name' }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, updatedRoutine: updated }), {
        status: 200,
      }),
    )

    const result = await updateRoutine('r1', updates)

    expect(mockFetch).toHaveBeenCalledWith('/api/routine?id=r1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    expect(result).toEqual(updated)
  })

  it('falls back to raw data if updatedRoutine is not in response', async () => {
    const updates = { name: 'Updated' }
    const rawData = { _id: 'r1', userId: 'u1', name: 'Updated' }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(rawData), { status: 200 }),
    )

    const result = await updateRoutine('r1', updates)
    expect(result).toEqual(rawData)
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Server Error' }), {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    )

    await expect(updateRoutine('r1', { name: 'Fail' })).rejects.toThrow(
      'Error: 500 Internal Server Error',
    )
  })
})
