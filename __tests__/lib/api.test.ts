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

// ═════════════════════════════════════════════════════════════════════════════
// fetchRoutines
// ═════════════════════════════════════════════════════════════════════════════

describe('fetchRoutines', () => {
  it('calls GET /api/routines with no-store cache', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    )

    await fetchRoutines()

    expect(mockFetch).toHaveBeenCalledWith('/api/routines', {
      cache: 'no-store',
    })
  })

  it('returns routines array on success', async () => {
    const routines = [
      { _id: '1', userId: 'u1', name: 'Morning' },
      { _id: '2', userId: 'u1', name: 'Evening' },
    ]
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(routines), { status: 200 }),
    )

    const result = await fetchRoutines()
    expect(result).toEqual(routines)
  })

  it('returns empty array when user has no routines', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    )

    const result = await fetchRoutines()
    expect(result).toEqual([])
  })

  it('throws on 401 Unauthorized', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        statusText: 'Unauthorized',
      }),
    )

    await expect(fetchRoutines()).rejects.toThrow('Error: 401 Unauthorized')
  })

  it('throws on 500 Internal Server Error', async () => {
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

  it('throws on 403 Forbidden', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        statusText: 'Forbidden',
      }),
    )

    await expect(fetchRoutines()).rejects.toThrow('Error: 403 Forbidden')
  })

  it('throws on network error (fetch rejects)', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(fetchRoutines()).rejects.toThrow('Failed to fetch')
  })

  it('error message includes both status code and status text', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('', { status: 418, statusText: "I'm a Teapot" }),
    )

    await expect(fetchRoutines()).rejects.toThrow("Error: 418 I'm a Teapot")
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// createRoutine
// ═════════════════════════════════════════════════════════════════════════════

describe('createRoutine', () => {
  it('calls POST /api/routine with correct headers and body', async () => {
    const newRoutine = { name: 'Workout' }
    const created = { _id: '3', userId: 'u1', name: 'Workout' }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, updatedRoutine: created }), {
        status: 200,
      }),
    )

    await createRoutine(newRoutine)

    expect(mockFetch).toHaveBeenCalledWith('/api/routine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRoutine),
    })
  })

  it('returns the created routine from response.updatedRoutine', async () => {
    const created = { _id: '3', userId: 'u1', name: 'Workout' }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, updatedRoutine: created }), {
        status: 200,
      }),
    )

    const result = await createRoutine({ name: 'Workout' })
    expect(result).toEqual(created)
  })

  it('returns undefined when server response has no updatedRoutine key', async () => {
    // Edge case: if the server responds with { success: true } but no updatedRoutine
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    )

    const result = await createRoutine({ name: 'Test' })
    // data.updatedRoutine would be undefined
    expect(result).toBeUndefined()
  })

  it('throws on 401 Unauthorized', async () => {
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

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(createRoutine({ name: 'Fail' })).rejects.toThrow(
      'Failed to fetch',
    )
  })

  it('serializes complex routine data correctly', async () => {
    const complexRoutine = {
      name: 'Complex',
      swimLanes: [
        {
          id: 'l1',
          name: 'Lane 1',
          steps: [
            {
              id: 's1',
              swimLaneId: 'l1',
              name: 'Step 1',
              sequence: 0,
              durationInSeconds: 60,
              startType: 'automatic' as const,
            },
          ],
        },
      ],
      notes: 'Some notes',
    }

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: true, updatedRoutine: complexRoutine }),
        { status: 200 },
      ),
    )

    await createRoutine(complexRoutine)

    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options!.body as string)
    expect(body.swimLanes).toHaveLength(1)
    expect(body.swimLanes[0].steps).toHaveLength(1)
    expect(body.notes).toBe('Some notes')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// deleteRoutine
// ═════════════════════════════════════════════════════════════════════════════

describe('deleteRoutine', () => {
  it('calls DELETE /api/routine?id=... with correct URL', async () => {
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

  it('resolves with no return value on success', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, deletedCount: 1 }), {
        status: 200,
      }),
    )

    const result = await deleteRoutine('abc123')
    expect(result).toBeUndefined()
  })

  it('throws on 404 Not Found', async () => {
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

  it('throws on 401 Unauthorized', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        statusText: 'Unauthorized',
      }),
    )

    await expect(deleteRoutine('abc')).rejects.toThrow(
      'Error: 401 Unauthorized',
    )
  })

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network offline'))

    await expect(deleteRoutine('abc')).rejects.toThrow('Network offline')
  })

  it('URL-encodes the routineId to handle special characters safely', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    )

    await deleteRoutine('id with spaces')

    // The implementation uses encodeURIComponent for safe URL construction
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/routine?id=id%20with%20spaces',
      {
        method: 'DELETE',
      },
    )
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// updateRoutine
// ═════════════════════════════════════════════════════════════════════════════

describe('updateRoutine', () => {
  it('calls POST /api/routine?id=... with correct headers and body', async () => {
    const updates = { name: 'Updated Name' }
    const updated = { _id: 'r1', userId: 'u1', name: 'Updated Name' }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, updatedRoutine: updated }), {
        status: 200,
      }),
    )

    await updateRoutine('r1', updates)

    expect(mockFetch).toHaveBeenCalledWith('/api/routine?id=r1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  })

  it('returns the updated routine from response.updatedRoutine', async () => {
    const updated = { _id: 'r1', userId: 'u1', name: 'Updated Name' }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, updatedRoutine: updated }), {
        status: 200,
      }),
    )

    const result = await updateRoutine('r1', { name: 'Updated Name' })
    expect(result).toEqual(updated)
  })

  it('falls back to raw data if updatedRoutine is missing from response', async () => {
    const rawData = { _id: 'r1', userId: 'u1', name: 'Updated' }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(rawData), { status: 200 }),
    )

    const result = await updateRoutine('r1', { name: 'Updated' })
    expect(result).toEqual(rawData)
  })

  it('falls back to raw data if updatedRoutine is null', async () => {
    const rawData = { success: true, updatedRoutine: null }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(rawData), { status: 200 }),
    )

    const result = await updateRoutine('r1', { name: 'Updated' })
    // null || data => data (the whole response object)
    expect(result).toEqual(rawData)
  })

  it('throws on 500 server error', async () => {
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

  it('logs to console.error before throwing on error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Bad' }), {
        status: 400,
        statusText: 'Bad Request',
      }),
    )

    await expect(updateRoutine('r1', { name: 'Fail' })).rejects.toThrow()

    expect(consoleSpy).toHaveBeenCalledWith(
      'Unable to update routine: ',
      expect.any(Response),
    )

    consoleSpy.mockRestore()
  })

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(updateRoutine('r1', { name: 'Fail' })).rejects.toThrow(
      'Failed to fetch',
    )
  })

  it('URL-encodes the routineId to prevent query string injection', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ name: 'ok' }), { status: 200 }),
    )

    await updateRoutine('id&evil=true', { name: 'Hack' })

    // The implementation uses encodeURIComponent, so & is encoded as %26
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/routine?id=id%26evil%3Dtrue',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('sends partial updates (only changed fields)', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: true, updatedRoutine: { notes: 'new' } }),
        { status: 200 },
      ),
    )

    await updateRoutine('r1', { notes: 'new' })

    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options!.body as string)
    expect(body).toEqual({ notes: 'new' })
    expect(body.name).toBeUndefined()
  })
})
